import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { UsageError } from './errors.js';

/**
 * Deploy a built static site to Teachfluence (PI-1511 Phase 5).
 *
 * Three server calls plus one upload per file: create the bundle, sign each
 * file, POST it straight to object storage, then finalize. Files never pass
 * through our API — a deploy of a few thousand assets would otherwise be a few
 * thousand requests through the GraphQL layer for no reason.
 */

/** Directories that are never part of a built site. */
const SKIP_DIRECTORIES = new Set(['.DS_Store', '.git', 'node_modules']);

/**
 * The one dotfile directory a real site serves.
 *
 * Everything else beginning with `.` is skipped — see `discoverFiles`.
 */
const ALLOWED_DOTFILES = new Set(['.well-known']);

/**
 * A build output never contains this. Its presence means the directory is a
 * project root, not a `dist/`.
 */
const PROJECT_ROOT_MARKERS = ['package.json', 'package-lock.json', 'pnpm-lock.yaml'];

/** Conservative content types. The CDN serves what we set here. */
const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.gif': 'image/gif',
  '.htm': 'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

/**
 * `application/octet-stream` for an unknown extension, never a guess.
 *
 * Serving an unknown file as `text/html` would let a stray upload become an
 * executable page on the customer's own domain; octet-stream downloads instead.
 */
function contentTypeFor(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

export interface DiscoveredFile {
  absolutePath: string;
  bytes: number;
  /** POSIX-separated path relative to the deploy root. */
  relativePath: string;
}

/**
 * Walk a build directory.
 *
 * Emits POSIX separators regardless of platform: a Windows deploy must produce
 * the same object keys as a Linux one, or the same site deployed from two
 * machines would serve from two different sets of keys.
 */
export async function discoverFiles(
  root: string,
  { allowProjectRoot = false }: { allowProjectRoot?: boolean } = {},
): Promise<DiscoveredFile[]> {
  const found: DiscoveredFile[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      // DOTFILES ARE NOT PUBLISHED.
      //
      // `teachfluence deploy .` from a project root is an easy mistake — the
      // usage string's `<directory>` invites it — and every dotfile in the tree
      // would land on the customer's own domain, served as
      // `application/octet-stream` because `contentTypeFor` does not know the
      // extension. That is `.env`, `.npmrc`, `.env.production`, any stray
      // `*.pem`. The blast radius is the customer's secrets, and the CLI is
      // what made them public.
      //
      // `.well-known` is the one dotfile path a real site serves (ACME
      // challenges, apple-app-site-association), so it is allowed through.
      if (entry.name.startsWith('.') && !ALLOWED_DOTFILES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);

        continue;
      }
      // Symlinks are skipped rather than followed: following one out of the
      // build directory would upload whatever it points at, which on a CI
      // runner can be anything the job can read.
      if (!entry.isFile()) continue;

      const info = await stat(absolutePath);

      found.push({
        absolutePath,
        bytes: info.size,
        relativePath: path
          .relative(root, absolutePath)
          .split(path.sep)
          .join('/'),
      });
    }
  }

  // Refuse a project root outright rather than quietly uploading it. Skipping
  // dotfiles removes the worst of it, but a project root also holds source,
  // README drafts and whatever else — none of which the author meant to
  // publish, and all of which would be live on their domain.
  // A HEURISTIC, so it has an override. Some generators legitimately copy a
  // `package.json` into their output — Jekyll's `_site/` copies anything not in
  // its default excludes, and `package.json` is not among them — and without an
  // escape those deploys would be unfixable short of renaming a source file.
  const rootEntries = await readdir(root);
  const marker = PROJECT_ROOT_MARKERS.find((name) => rootEntries.includes(name));

  if (marker && !allowProjectRoot) {
    throw new UsageError(
      `${root} looks like a project root, not a build output (it contains ${marker}). ` +
        // The directory is POSITIONAL — `--directory` is not a flag, and since
        // unknown flags are now rejected, naming one here would hand the author
        // a second error instead of a fix.
        `Pass your build output directory — usually dist/ or build/ — as the argument, ` +
        `so source and secrets are not published to your domain. ` +
        `If this really is your build output, re-run with --allow-project-root.`,
    );
  }

  await walk(root);

  return found.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export interface UploadTarget {
  apiUrl: string;
  formFields: Record<string, string>;
}

/**
 * POST one file to object storage using the presigned form.
 *
 * The signed fields must come FIRST and the file LAST — S3 evaluates a
 * multipart POST in order and ignores anything after the file part, so a field
 * appended after it is silently dropped and the upload fails its policy.
 */
export async function uploadFile(
  target: UploadTarget,
  file: DiscoveredFile,
  contentType = contentTypeFor(file.relativePath),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const form = new FormData();

  for (const [key, value] of Object.entries(target.formFields)) {
    form.append(key, value);
  }

  // Read whole rather than stream: bundle files are capped at 25 MB server-side
  // and only a handful upload at once, so the peak is bounded and small — and a
  // Blob needs a length up front anyway for the multipart body.
  const bytes = await readFile(file.absolutePath);

  form.append(
    'file',
    new Blob([new Uint8Array(bytes)], { type: contentType }),
    path.basename(file.relativePath),
  );

  const response = await fetchImpl(target.apiUrl, { body: form, method: 'POST' });

  if (!response.ok) {
    throw new Error(
      `Upload failed for ${file.relativePath}: HTTP ${response.status}`,
    );
  }
}


export { contentTypeFor };
