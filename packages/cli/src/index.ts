#!/usr/bin/env node
import {
  SdkActivateSiteBundle,
  SdkCreateOrgRouteManifestEntry,
  SdkCreateSiteBundle,
  SdkFinalizeSiteBundle,
  SdkOrganizationIdBySlug,
  SdkOrgRouteManifestEntries,
  SdkSignSiteBundleUpload,
  SdkUpdateOrgRouteManifestEntry,
} from './__generated__/operations.js';
import { graphql } from './api.js';
import { parseArgs, scopeForRoute } from './args.js';
import { formatClaimRefusal } from './claim-refusal.js';
import {
  findClaimForRoute,
  classifyScopeChange,
  isScopeChangeRefusal,
  type RouteClaim,
} from './rescope.js';
import { PublishedButUnverifiedError, UsageError } from './errors.js';
import { contentTypeFor, discoverFiles, uploadFile } from './deploy.js';
import { publishDemoSite } from './publish.js';

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
  if (args.publish) {
    await publishDemoSite(args);
    return;
  }
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

  // A whole-site claim on a verified custom domain takes `robots.txt` and
  // `sitemap.xml` too — the customer owns that origin, so those are theirs to
  // answer. If the bundle does not actually contain them, nothing serves them:
  // the platform handler that used to is now yielded past, and the bundle 404s.
  //
  // Warned rather than refused, because it is legitimate not to want either
  // file, and warned HERE rather than after the claim, because this is still
  // before the upload. Most generators emit robots.txt, but "most" is doing a
  // lot of work for something whose only symptom is a crawler noticing weeks
  // later.
  if (args.wholeSite) {
    const missing = ['robots.txt', 'sitemap.xml'].filter(
      (name) => !files.some((file) => file.relativePath === name),
    );

    if (missing.length > 0) {
      console.warn(
        `\nWarning: this bundle has no ${missing.join(' or ')}. On your own domain a` +
          `\nwhole-site claim answers those addresses, so they will 404 rather than` +
          `\nfalling back to the platform's. Add them to your build to serve your own.`,
      );
    }
  }

  // Resolve the slug to the organization's GlobalID first. Every deploy input
  // is `.refine(isGlobalId)`, so passing the slug straight through failed on
  // the very first call with "OrganizationId is invalid" — the CLI speaks
  // slugs because that is what a human types, and the API speaks GlobalIDs
  // because ids are opaque; something has to translate, and it is this.
  const { organization } = await graphql<{
    organization: { id: string } | null;
  }>(SdkOrganizationIdBySlug.id, { slug: args.organizationSlug }, secretKey);

  if (!organization) {
    throw new UsageError(
      `No organization found for --org ${args.organizationSlug}.`,
    );
  }

  const organizationId = organization.id;

  const { createSiteBundle } = await graphql<{
    createSiteBundle: { siteBundle: { id: string; version: number } };
  }>(
    SdkCreateSiteBundle.id,
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
      SdkSignSiteBundleUpload.id,
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
    SdkFinalizeSiteBundle.id,
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
      orgRouteManifestEntry: null | { eclipsedPaths: string[]; id: string };
      shadowReport: null | { count: number; sampleUrls: string[] };
      userErrors?: { code?: null | string; message: string }[];
    };
  }>(
    SdkCreateOrgRouteManifestEntry.id,
    {
      input: {
        acknowledgeShadowing: args.acknowledgeShadowing,
        organizationId,
        pathPattern: args.route,
        priority: 0,
        scope: scopeForRoute(args.route, args.wholeSite, args.section),
        targetKind: 'CDN_BUNDLE',
        targetRef: bundle.id,
      },
    },
    secretKey,
    // This caller renders the refusal itself — see below.
    true,
  );

  let entry = createOrgRouteManifestEntry.orgRouteManifestEntry;

  // The server refuses to change a LIVE claim's scope through create -- it
  // returns CONFLICT and says to update the claim instead. That refusal is
  // correct, and it is the one every `--whole-site` upgrade hits, because the
  // root claim from the previous one-page deploy is already EXACT. Printing the
  // sentence and exiting left the operator with no path through the CLI, so the
  // deploy follows it: find the claim, rescope it, carry on.
  //
  // Only this code is followed. Every other refusal means the caller asked for
  // something that will not work -- a reserved path, an unknown bundle, an
  // unacknowledged shadow -- and answering those by mutating a claim they did
  // not name would be the CLI deciding something they did not ask for.
  //
  // Reusing the existing claim does NOT leave it serving the previous bundle,
  // which is the obvious worry: the update carries no `targetRef`, but the
  // `activateSiteBundle` below re-points whatever entry it is given at the
  // bundle just uploaded. Same last step as the create path.
  const createErrors = createOrgRouteManifestEntry.userErrors ?? [];

  if (!entry && isScopeChangeRefusal(createErrors)) {
    const { orgRouteManifestEntries } = await graphql<{
      orgRouteManifestEntries: RouteClaim[];
    }>(SdkOrgRouteManifestEntries.id, { organizationId }, secretKey);

    const existing = findClaimForRoute(orgRouteManifestEntries, args.route);

    const requestedScope = scopeForRoute(args.route, args.wholeSite, args.section);

    // Follow an UPGRADE only. Narrowing a live claim gives up ground the
    // customer is currently serving, and it can happen by omission: `--site` is
    // refused without `--take-over-site` on every run, so a CI step that lost
    // its flags computes EXACT for `/`, hits this same refusal, and would
    // rescope a live SITE claim down to one address — taking every other path
    // off their bundle with one log line and exit 0. Narrowing shadows nothing,
    // so no shadow report and no `--force` gate stands in the way.
    // Null when there is no claim, rather than classifying against a
    // fabricated EXACT. Dead today — the `existing &&` below short-circuits —
    // but inferring a decision from missing data is how a nonexistent claim
    // ends up reported as a WIDEN the moment this read moves.
    const change = existing
      ? classifyScopeChange(existing.scope, requestedScope)
      : null;

    // A LATERAL flip is the PI-1628 migration itself — an existing PREFIX
    // claim moving to SITE_SUBTREE — so it has to be REACHABLE, not merely
    // refused. It runs through the same update the WIDEN auto-follow uses,
    // gated on an explicit --rescope the way --site is gated on
    // --take-over-site. Without that flag the refusal below names it.
    const lateralConfirmed = change === 'LATERAL' && args.rescope;

    if (existing && change !== 'WIDEN' && !lateralConfirmed) {
      // Three refusals, because they send the operator three different ways.
      // A SAME scope is not reachable — the server sends this refusal only when
      // the scope differs, so matching a claim with the same scope means the
      // CLI found one the server was not talking about. LATERAL is the
      // PREFIX ↔ SITE_SUBTREE flip: it gives up no addresses at all, so telling
      // the operator it "serves less" and pointing at --site (refused off the
      // root anyway) would send them chasing a problem that is not there.
      throw new UsageError(
        change === 'SAME'
          ? `Route "${args.route}" is already claimed at ${existing.scope}, ` +
              `which is what this deploy asks for — so the bundle just ` +
              `uploaded was NOT activated. The claim the server refused is ` +
              `not the one found at this route.`
          : change === 'LATERAL'
            ? `Route "${args.route}" is already claimed at ${existing.scope}, ` +
              `and this deploy asks for ${requestedScope}. Both cover the same ` +
              `addresses, but a different file would answer each one — ` +
              `${requestedScope === 'SITE_SUBTREE' ? 'the pages this deploy already publishes under that path, instead of the deploy republished at it' : 'the deploy republished at that path, instead of the pages it already publishes there'}. ` +
              `Re-run with --rescope to change it.`
            : `Route "${args.route}" is already claimed at ${existing.scope}, ` +
              `and this deploy asks for ${requestedScope}, which serves less. ` +
              `Re-run with --site --take-over-site to redeploy the whole site, ` +
              `or pass the narrower route explicitly if that is what you meant.`,
      );
    }

    if (existing) {
      const scope = requestedScope;

      console.log(
        `Route "${args.route}" is already claimed at ${existing.scope}; ` +
          `changing it to ${scope}.`,
      );

      const { updateOrgRouteManifestEntry } = await graphql<{
        updateOrgRouteManifestEntry: {
          orgRouteManifestEntry: null | { eclipsedPaths: string[]; id: string };
          shadowReport: null | { count: number; sampleUrls: string[] };
          userErrors?: { code?: null | string; message: string }[];
        };
      }>(
        SdkUpdateOrgRouteManifestEntry.id,
        {
          input: {
            acknowledgeShadowing: args.acknowledgeShadowing,
            id: existing.id,
            organizationId,
            scope,
          },
        },
        secretKey,
        // Rendered below by the same formatter as the create refusal.
        true,
      );

      entry = updateOrgRouteManifestEntry.orgRouteManifestEntry;

      // A widening still needs confirming, so a refusal here is the shadow gate
      // doing its job -- report THAT, not the stale create conflict.
      if (!entry) {
        for (const line of formatClaimRefusal(
          updateOrgRouteManifestEntry,
          args.route,
        )) {
          console.error(line);
        }

        process.exitCode = 1;

        return;
      }
    }
  }

  // The server refuses a shadowing claim rather than silently taking pages
  // away from the org — a customer who routes `/` and thereby hides their own
  // published product pages should find out here, not from a support ticket.
  if (!entry) {
    for (const line of formatClaimRefusal(
      createOrgRouteManifestEntry,
      args.route,
    )) {
      console.error(line);
    }

    process.exitCode = 1;

    return;
  }

  // BEFORE activation, because activation is what puts the deploy in front of
  // visitors. A page at an address the platform answers is not a broken build
  // and not a refused claim: it uploads, it claims, it publishes green, and it
  // is then never served. That silence is the defect -- a client site shipped
  // its main sales page this way and it was a 404 for weeks with every gate
  // passing. Reported, never refused: a whole-site deploy legitimately mirrors
  // a basket or a sign-in page, and refusing those would block every such
  // deploy forever.
  if (entry.eclipsedPaths.length > 0) {
    console.warn(
      `\n! ${entry.eclipsedPaths.length} page(s) in this deploy sit at addresses the platform answers instead:`,
    );

    for (const path of [...entry.eclipsedPaths].sort()) {
      console.warn(`    ${path}`);
    }

    console.warn(
      '  They will NOT be served from this deploy. Move them, or leave them if the platform should own them.\n',
    );
  }

  await graphql(
    SdkActivateSiteBundle.id,
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

  console.error(error instanceof UsageError || error instanceof PublishedButUnverifiedError
    ? message : `Deploy failed: ${message}`);
  process.exitCode = error instanceof PublishedButUnverifiedError ? 2 : 1;
});
