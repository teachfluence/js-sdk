#!/usr/bin/env node
import {
  ActivateSiteBundle,
  CreateOrgRouteManifestEntry,
  CreateSiteBundle,
  FinalizeSiteBundle,
  OrganizationIdBySlug,
  SignSiteBundleUpload,
} from './__generated__/operations.js';
import { graphql } from './api.js';
import { parseArgs } from './args.js';
import { UsageError } from './errors.js';
import { contentTypeFor, discoverFiles, uploadFile } from './deploy.js';

/**
 * `teachfluence deploy ./dist --org my-org` (PI-1511 Phase 5).
 *
 * Reads the key from TEACHFLUENCE_SECRET_KEY rather than a flag. A key passed
 * on the command line lands in shell history and in the process list, where any
 * other process on a CI runner can read it.
 */


/** Uploads in flight at once. Enough to saturate a CI runner's link without
 *  opening a thousand sockets against object storage. */
const UPLOAD_CONCURRENCY = 8;

/** Run `worker` over `items`, at most `limit` at a time. */
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const secretKey = process.env.TEACHFLUENCE_SECRET_KEY;

  if (!secretKey) {
    throw new UsageError(
      'Set TEACHFLUENCE_SECRET_KEY (a tf_sk_… key). Passing it as a flag would leak it into shell history and the process list.',
    );
  }
  if (!secretKey.startsWith('tf_sk_')) {
    throw new UsageError(
      'Deploys need a SECRET key (tf_sk_…). A publishable key cannot deploy.',
    );
  }

  const files = await discoverFiles(args.directory, {
    allowProjectRoot: args.allowProjectRoot,
  });

  if (files.length === 0) {
    throw new UsageError(`No files found in ${args.directory}. Did the build run?`);
  }

  console.log(`Deploying ${files.length} file(s) from ${args.directory}`);

  // Resolve the slug to the organization's GlobalID first. Every deploy input
  // is `.refine(isGlobalId)`, so passing the slug straight through failed on
  // the very first call with "OrganizationId is invalid" — the CLI speaks
  // slugs because that is what a human types, and the API speaks GlobalIDs
  // because ids are opaque; something has to translate, and it is this.
  const { organization } = await graphql<{
    organization: { id: string } | null;
  }>(OrganizationIdBySlug.id, { slug: args.organizationSlug }, secretKey);

  if (!organization) {
    throw new UsageError(
      `No organization found for --org ${args.organizationSlug}.`,
    );
  }

  const organizationId = organization.id;

  const { createSiteBundle } = await graphql<{
    createSiteBundle: { siteBundle: { id: string; version: number } };
  }>(
    CreateSiteBundle.id,
    {
      input: {
        organizationId,
        sourceLabel: args.sourceLabel ?? null,
      },
    },
    secretKey,
  );

  const bundle = createSiteBundle.siteBundle;

  let uploaded = 0;

  await mapWithConcurrency(files, UPLOAD_CONCURRENCY, async (file) => {
    const { signSiteBundleUpload } = await graphql<{
      signSiteBundleUpload: {
        uploadTarget: { apiUrl: string; formFields: Record<string, string> };
      };
    }>(
      SignSiteBundleUpload.id,
      {
        input: {
          bundleId: bundle.id,
          bytes: file.bytes,
          contentType: contentTypeFor(file.relativePath),
          organizationId,
          path: file.relativePath,
        },
      },
      secretKey,
    );

    await uploadFile(signSiteBundleUpload.uploadTarget, file);

    uploaded += 1;
    process.stdout.write(`\r  uploaded ${uploaded}/${files.length}`);
  });

  process.stdout.write('\n');

  await graphql(
    FinalizeSiteBundle.id,
    {
      input: {
        bundleId: bundle.id,
        fileCount: files.length,
        organizationId,
      },
    },
    secretKey,
  );

  if (!args.route) {
    console.log(
      `Deployed v${bundle.version}. No traffic is served yet — re-run with ` +
        `--route <path> to publish it.`,
    );

    return;
  }

  // Claim the route, then point it at this bundle. Two steps because a route
  // claim outlives any single deploy: the server re-points the SAME claim when
  // one already owns this path, which is what makes redeploying to a route work
  // at all and keeps activation atomic from a visitor's point of view.
  //
  // That re-pointing lives in `createEntry` on the server, not here — an
  // earlier version of this comment described it as though it were already
  // true while the server still did an unconditional insert, so the second
  // deploy to any route failed after every file had uploaded.
  const { createOrgRouteManifestEntry } = await graphql<{
    createOrgRouteManifestEntry: {
      orgRouteManifestEntry: null | { id: string };
      shadowReport: null | { count: number; sampleUrls: string[] };
      userErrors?: { message: string }[];
    };
  }>(
    CreateOrgRouteManifestEntry.id,
    {
      input: {
        acknowledgeShadowing: args.acknowledgeShadowing,
        organizationId,
        pathPattern: args.route,
        priority: 0,
        scope: 'PREFIX',
        targetKind: 'CDN_BUNDLE',
        targetRef: bundle.id,
      },
    },
    secretKey,
    // This caller renders the refusal itself — see below.
    true,
  );

  const entry = createOrgRouteManifestEntry.orgRouteManifestEntry;

  // The server refuses a shadowing claim rather than silently taking pages
  // away from the org — a customer who routes `/` and thereby hides their own
  // published product pages should find out here, not from a support ticket.
  if (!entry) {
    const shadowed = createOrgRouteManifestEntry.shadowReport;

    if (shadowed && shadowed.count > 0) {
      console.error(
        `\nRoute "${args.route}" would shadow ${shadowed.count} existing page(s):`,
      );

      for (const url of shadowed.sampleUrls) console.error(`  ${url}`);

      console.error('\nRe-run with --force to publish it anyway.');
    } else {
      // Any OTHER refusal (unknown bundle, bad pattern, reserved segment).
      // Without this the opt-out above would swallow it: no throw, no report,
      // and a non-zero exit with nothing printed.
      console.error(
        createOrgRouteManifestEntry.userErrors
          ?.map((error) => error.message)
          .join('; ') ?? 'The route claim was refused.',
      );
    }

    process.exitCode = 1;

    return;
  }

  await graphql(
    ActivateSiteBundle.id,
    {
      input: {
        bundleId: bundle.id,
        organizationId,
        routeManifestEntryId: entry.id,
      },
    },
    secretKey,
  );

  console.log(`Deployed v${bundle.version} and serving at ${args.route}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(error instanceof UsageError ? message : `Deploy failed: ${message}`);
  process.exitCode = 1;
});
