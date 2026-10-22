import JSZip from 'jszip';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import type { DiscoveredFile, UploadTarget } from './deploy.js';

import { UsageError } from './errors.js';

export interface ArchiveManifestEntry {
  bytes: number;
  path: string;
  sha256: string;
}

export interface SiteArchive {
  bytes: Buffer;
  manifest: ArchiveManifestEntry[];
  probePath: string;
  sha256: string;
}

const DEFAULT_SITE_JSON = Buffer.from(
  `${JSON.stringify({ mount: { assetPrefix: '', scope: 'SITE' } })}\n`,
  'utf8',
);
const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertWholeSiteDeclaration(bytes: Buffer): void {
  let parsed: unknown;

  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new UsageError('site.json is not valid JSON. Fix it before publishing.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new UsageError('site.json must declare a whole-site mount.');
  }

  const document = parsed as Record<string, unknown>;
  const mount = (document.mount ?? document) as Record<string, unknown>;

  if (mount.scope !== 'SITE' || (mount.assetPrefix ?? '') !== '') {
    throw new UsageError(
      '--publish requires site.json with mount.scope SITE and no assetPrefix; the CLI will not overwrite an authored mount.',
    );
  }
}

/** Build the exact ZIP and manifest the server verifies before importing. */
export async function createSiteArchive(files: DiscoveredFile[]): Promise<SiteArchive> {
  const zip = new JSZip();
  const manifest: ArchiveManifestEntry[] = [];
  let foundSiteJson = false;

  for (const file of files) {
    const bytes = await readFile(file.absolutePath);

    if (file.relativePath === 'site.json') {
      assertWholeSiteDeclaration(bytes);
      foundSiteJson = true;
    }

    zip.file(file.relativePath, bytes, { createFolders: false, date: ZIP_EPOCH });
    manifest.push({ bytes: bytes.length, path: file.relativePath, sha256: sha256(bytes) });
  }

  if (!foundSiteJson) {
    zip.file('site.json', DEFAULT_SITE_JSON, {
      createFolders: false,
      date: ZIP_EPOCH,
    });
    manifest.push({
      bytes: DEFAULT_SITE_JSON.length,
      path: 'site.json',
      sha256: sha256(DEFAULT_SITE_JSON),
    });
  }

  // A fresh public path is the deploy readiness proof. Probing an existing
  // page can return 200 from the previous version while the new bytes still
  // propagate, so every CLI ZIP carries one unique, harmless text asset.
  const authoredPaths = new Set(files.map((file) => file.relativePath));
  let probePath: string;

  do {
    probePath = `tf-deploy-check/${randomUUID()}.txt`;
  } while (authoredPaths.has(probePath));

  const probeBytes = Buffer.from('Teachfluence deploy readiness\n', 'utf8');

  zip.file(probePath, probeBytes, { createFolders: false, date: ZIP_EPOCH });
  manifest.push({ bytes: probeBytes.length, path: probePath, sha256: sha256(probeBytes) });

  manifest.sort((a, b) => a.path.localeCompare(b.path));
  const bytes = await zip.generateAsync({
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    type: 'nodebuffer',
  });

  return { bytes, manifest, probePath, sha256: sha256(bytes) };
}

/** S3 presigned POST fields precede the file part. */
export async function uploadArchive(
  target: UploadTarget,
  bytes: Buffer,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const form = new FormData();

  for (const [name, value] of Object.entries(target.formFields)) {
    form.append(name, value);
  }

  form.append('file', new Blob([new Uint8Array(bytes)], { type: 'application/zip' }), 'site.zip');
  const response = await fetchImpl(target.apiUrl, { body: form, method: 'POST' });

  if (!response.ok) {
    throw new Error(`Archive upload failed: HTTP ${response.status}.`);
  }
}
