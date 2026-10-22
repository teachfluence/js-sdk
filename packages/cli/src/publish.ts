import { randomUUID } from 'node:crypto';

import type { Args } from './args.js';

import { createSiteArchive, uploadArchive } from './archive.js';
import { discoverFiles } from './deploy.js';
import { PublishedButUnverifiedError, UsageError } from './errors.js';
import { callTool, McpToolError } from './mcp.js';
import { apiBaseUrl, browserCredential, forgetCredential } from './oauth.js';

interface PublishResult {
  status: 'ACTIVATED' | 'CHECK_FAILED' | 'MOUNT_UNUSABLE' | 'PUBLISH_PENDING' | 'SCANNING';
  version?: number;
}

interface SiteStatus {
  dbVersion: number | null;
  isDemo: boolean;
  organizationSlug: string | null;
  state: string;
  requestedPathServed?: boolean | null;
}

function shadowReportId(message: string): string | null {
  return /acknowledgeShadowing:\s*"([^"]+)"/.exec(message)?.[1] ?? null;
}

/** One explicit demo command: discover, archive, verify/import, activate. */
export async function publishDemoSite(args: Args): Promise<void> {
  const apiBase = apiBaseUrl();
  const files = await discoverFiles(args.directory, {
    allowProjectRoot: args.allowProjectRoot,
  });

  if (files.length === 0) {
    throw new UsageError(`No files found in ${args.directory}. Did the build run?`);
  }

  const archive = await createSiteArchive(files);

  if (archive.bytes.length > 64 * 1024 * 1024) {
    throw new UsageError('The ZIP exceeds the 64 MB demo archive upload limit.');
  }

  const accessToken = await browserCredential(apiBase, args.organizationSlug);
  const call = <T>(name: string, input: Record<string, unknown>): Promise<T> =>
    callTool<T>(apiBase, accessToken, name, input);

  const before = await call<SiteStatus>('site_serving_status', {});

  if (before.organizationSlug !== args.organizationSlug || !before.isDemo) {
    await forgetCredential(apiBase, args.organizationSlug);

    throw new UsageError(
      `--publish requires the browser connection to the demo organization "${args.organizationSlug}". Connected organization: ${before.organizationSlug ?? 'unknown'}.`,
    );
  }

  const preflight = await call<{
    archiveAllowedExtensions: string[];
    reservedFirstSegments: string[];
  }>('site_preflight', {});
  const reserved = new Set(preflight.reservedFirstSegments.map((segment) => segment.toLowerCase()));

  const allowed = new Set(preflight.archiveAllowedExtensions);
  const folded = new Set<string>();

  for (const entry of archive.manifest) {
    const segments = entry.path.split('/');
    const filename = segments.at(-1) ?? '';
    const extension = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
    const lowerPath = entry.path.toLowerCase();

    if (!/^[A-Za-z0-9._/-]+$/.test(entry.path) || entry.path.includes('..') ||
      !allowed.has(extension) || folded.has(lowerPath)) {
      throw new UsageError(`The ZIP importer cannot accept "${entry.path}". Use a supported extension and a unique ASCII path without "..".`);
    }

    folded.add(lowerPath);
  }

  if (reserved.has(archive.probePath.split('/')[0].toLowerCase())) {
    throw new UsageError('The platform now reserves the CLI deploy-check path; update the CLI before publishing.');
  }

  console.log(`Uploading ${archive.manifest.length} files in one verified ZIP.`);

  const draft = await call<{ bundleId: string; version: number }>('site_draft_create', {
    from: 'empty',
    idempotencyKey: randomUUID(),
    label: args.sourceLabel,
    mount: { assetPrefix: '', scope: 'SITE' },
  });
  console.log(`Created draft ${draft.bundleId}.`);
  const grant = await call<{
    uploadId: string;
    uploadTarget: { apiUrl: string; formFields: Record<string, string> };
  }>('site_draft_archive_upload_grant', {
    bundleId: draft.bundleId,
    bytes: archive.bytes.length,
    sha256: archive.sha256,
  });
  await uploadArchive(grant.uploadTarget, archive.bytes);
  const imported = await call<{
    fileCount: number;
    manifest: { bytes: number; path: string; sha256: string }[];
  }>('site_draft_archive_import', {
    bundleId: draft.bundleId,
    expectedSha256: archive.sha256,
    manifest: archive.manifest,
    uploadId: grant.uploadId,
  });

  const expected = new Map(archive.manifest.map((entry) => [entry.path, entry]));

  if (
    imported.fileCount !== archive.manifest.length ||
    imported.manifest.length !== expected.size ||
    new Set(imported.manifest.map((entry) => entry.path)).size !== expected.size ||
    imported.manifest.some((entry) => {
      const source = expected.get(entry.path);

      return !source || source.bytes !== entry.bytes || source.sha256 !== entry.sha256;
    })
  ) {
    throw new Error(`Server file manifest differs from the local ZIP. Draft ${draft.bundleId} was not published.`);
  }

  const publishInput: Record<string, unknown> = {
    bundleId: draft.bundleId,
    confirmSlug: args.organizationSlug,
    expectedCurrentVersion: before.dbVersion ?? 0,
    requireDemo: true,
  };

  const publish = async (): Promise<PublishResult> => {
    try {
      return await call<PublishResult>('site_draft_publish', publishInput);
    } catch (error) {
      if (!(error instanceof McpToolError) || !args.acknowledgeShadowing) throw error;

      const reportId = shadowReportId(error.message);

      if (!reportId) throw error;

      console.warn(error.message);

      return call<PublishResult>('site_draft_publish', {
        ...publishInput,
        acknowledgeShadowing: reportId,
      });
    }
  };
  let published = await publish();

  if (published.status === 'SCANNING') {
    // The import is complete, but the content scan is running in the backend.
    // Keep this one command alive until it finishes; do not claim success yet.
    const deadline = Date.now() + 120_000;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const versions = await call<{
        versions: { id: string; checkStatus: string; status: string; }[];
      }>('site_versions_list', { limit: 50 });
      const current = versions.versions.find((version) => version.id === draft.bundleId);

      if (current?.status === 'READY') {
        published = await publish();

        break;
      }
      if (current?.checkStatus === 'FAILED') {
        throw new Error(`Site scan failed for draft ${draft.bundleId}. Review site_versions_get before publishing.`);
      }
    }
  }
  if (published.status === 'SCANNING') {
    throw new Error(`Site scan timed out for draft ${draft.bundleId}. It may finish later; inspect site_versions_get before retrying.`);
  }
  if (published.status !== 'ACTIVATED' && published.status !== 'PUBLISH_PENDING') {
    throw new Error(`Draft ${draft.bundleId} is not published (status ${published.status}). Review site_versions_get.`);
  }

  console.log(`Demo v${draft.version} accepted; checking the public path.`);
  const probeInput = { path: `/${archive.probePath}` };
  const deadline = Date.now() + 45_000;
  let serving = await call<SiteStatus>('site_serving_status', probeInput);

  while (Date.now() <= deadline) {

    if (
      serving.state === 'serving' &&
      serving.dbVersion === draft.version &&
      serving.requestedPathServed === true
    ) {
      console.log(`Demo v${draft.version} is serving, including /${archive.probePath}.`);

      return;
    }
    if (Date.now() >= deadline) break;

    await new Promise((resolve) => setTimeout(resolve, 3000));
    serving = await call<SiteStatus>('site_serving_status', probeInput);
  }

  throw new PublishedButUnverifiedError(
    `Draft ${draft.bundleId} was accepted, but /${archive.probePath} was not verified as serving within 45 seconds (state ${serving.state}). Recheck site_serving_status before sharing.`,
  );
}
