import path from 'node:path';

import { UsageError } from './errors.js';

export interface Args {
  acknowledgeShadowing: boolean;
  /**
   * Separate from `--force` on purpose. Overloading one flag meant the
   * project-root refusal — whose own text tells the author to re-run with
   * `--force` — ALSO sent `acknowledgeShadowing: true`, so the shadow report
   * that exists to make hiding your own pages a decision was the branch that
   * got skipped. Two risks, two confirmations.
   */
  allowProjectRoot: boolean;
  directory: string;
  organizationSlug: string;
  /** Publish a demo site through the org-scoped MCP archive workflow. */
  publish: boolean;
  /**
   * `--rescope`: confirm a LATERAL scope change on a claim that already exists
   * — PREFIX ↔ SITE_SUBTREE. The two cover the same addresses, so nothing is
   * given up, but a DIFFERENT FILE answers every one of them, which is a
   * decision rather than something a deploy should do on its own. Kept apart
   * from --force for the same reason --take-over-site is: --force confirms the
   * CONTENTS (yes, hide those N pages), this confirms the SHAPE.
   */
  rescope: boolean;
  /**
   * `--section`: serve the pages this deploy ALREADY publishes under the
   * claimed path, instead of republishing the whole deploy at it.
   *
   * The difference is which file answers, and it follows from how the deploy
   * was built. `--base /preview` bakes the prefix into every link and leaves
   * the files at the deploy root, so the claim's segments must be stripped
   * before lookup — that is PREFIX, and it is the default. A deploy built for
   * the ROOT already carries the full address in its own file paths, so
   * stripping guarantees a miss. Only meaningful under a path; the root
   * equivalent is `--site`.
   */
  section: boolean;
  /**
   * Separate from `--force` for the same reason `allowProjectRoot` is, and the
   * stakes are higher here. `--site` used to require `--force`, but `--force`
   * IS `acknowledgeShadowing` — so the single claim that shadows every page an
   * org has was the one claim whose author could never be shown the shadow
   * report, because sending the acknowledgement is exactly what makes the
   * server skip the refusal that produces it.
   *
   * This flag confirms the SCOPE ("yes, my whole URL space") before the upload,
   * keeping the fast pre-check. `--force` still confirms the CONTENTS ("yes,
   * hide those N pages") after the report has actually been printed.
   */
  takeOverSite: boolean;
  /**
   * `--site`: claim the whole site from the root rather than the single URL an
   * EXACT root claim owns. Only meaningful with `--route /`.
   */
  wholeSite: boolean;
  route?: string;
  sourceLabel?: string;
}

/**
 * The claim scope a `--route` deploys at.
 *
 * PREFIX everywhere except the site root, which never takes PREFIX: a PREFIX
 * claim there matches every path in the org, so one entry would take over the
 * storefront, the course pages, checkout and the admin-host bounce. The backend
 * refuses to store that shape and the edge matcher refuses to honour it; this
 * keeps the CLI from asking for it in the first place.
 *
 * At the root the caller picks between two shapes, because they are genuinely
 * different sites:
 *
 *   - EXACT (default) — one URL, serving the bundle's `index.html`. Whatever
 *     path an EXACT claim names, that is the only file it can ever serve: the
 *     claim's own segments are stripped before lookup and the remainder of an
 *     exact match is always empty. Right for a one-page site.
 *   - SITE (`--site`) — the whole site from the root, every path the platform
 *     does not own. The shape a multi-page site needs, and the reason a root
 *     deploy no longer needs a second claim to serve its own pages.
 *
 * Under a path the caller picks between two shapes for the same reason:
 *
 *   - PREFIX (default) — the deploy is republished AT that path, so its own
 *     segments are stripped before lookup. Right when the deploy was built for
 *     the mount (`--base /docs`).
 *   - SITE_SUBTREE (`--section`) — the deploy already publishes pages at those
 *     addresses, so nothing is stripped. Right when mounting one section of a
 *     deploy built for the root, and the shape that lets the rest of the
 *     address space stay free for the platform to answer.
 */
export function scopeForRoute(
  route: string | undefined,
  wholeSite = false,
  section = false,
): 'EXACT' | 'PREFIX' | 'SITE' | 'SITE_SUBTREE' {
  if (!isRootRoute(route)) return section ? 'SITE_SUBTREE' : 'PREFIX';

  return wholeSite ? 'SITE' : 'EXACT';
}

function isRootRoute(route: string | undefined): boolean {
  return route !== undefined && route.replaceAll('/', '').length === 0;
}

export function parseArgs(argv: string[]): Args {
  const [command, directory, ...rest] = argv;

  if (command !== 'deploy' || !directory) {
    throw new UsageError(
      'Usage: teachfluence deploy <directory> --org <slug> [--label <git-sha>]\n' +
        '                                     [--route <path>] [--section] [--site]\n' +
        '                                     [--force] [--publish]\n\n' +
        '  --route  Serve the deploy at this path (e.g. /docs). Without it the\n' +
        '           bundle uploads but receives no traffic. Build with a\n' +
        '           matching base path (Vite base, Next basePath, CRA\n' +
        '           homepage) or every asset will 404. `/` claims the site\n' +
        '           root, serving one URL unless you also pass --site.\n' +
        '  --site   With `--route /`, serve your WHOLE site from the root —\n' +
        '           every path the platform does not own (checkout, sign-in,\n' +
        '           robots.txt keep working). Needs --take-over-site too,\n' +
        '           because it claims every address your organization will\n' +
        '           ever have.\n' +
        '  --section\n' +
        '           With --route, serve the pages this deploy ALREADY publishes\n' +
        '           under that path, instead of republishing the whole deploy\n' +
        '           at it. Use it when the deploy was built for the ROOT and\n' +
        '           you are mounting one section of it; without it the claim\n' +
        '           strips its own segments and looks for files that are not\n' +
        '           there. NOTE: a root-built deploy usually links its assets\n' +
        '           from /assets or /_astro, which a section claim does NOT\n' +
        '           cover — claim those paths too, or the page renders\n' +
        '           unstyled. The section path is also matched case-\n' +
        '           insensitively but fetched case-sensitively, so type it\n' +
        "           exactly as the deploy spells it.\n" +
        '  --rescope\n' +
        '           Confirm changing an EXISTING claim between --section and\n' +
        '           the default. Both serve the same addresses, so nothing is\n' +
        '           given up — but a different file answers each one, so a\n' +
        '           deploy will not do it silently.\n' +
        '  --take-over-site\n' +
        '           Confirm the whole-site scope. Kept apart from --force so\n' +
        '           the first run still SHOWS you which pages the claim would\n' +
        '           hide, instead of assuming you already agreed.\n' +
        '  --force  Publish the route even if it shadows existing pages.\n' +
        '  --publish\n' +
        '           Upload and publish a demo whole-site bundle in one command.\n' +
        '           Requires --route / --site --take-over-site and browser login.\n' +
        '  --allow-project-root\n' +
        '           Deploy a directory that looks like a project root. Only if\n' +
        '           your generator copies a package.json into its output.',
    );
  }

  const flags = new Map<string, string>();
  // Rejected rather than ignored: `--rout /docs` silently deployed with NO
  // route, and the only sign was a success line saying no traffic was served —
  // easy to read past when you believe you just claimed a route.
  const KNOWN_FLAGS = new Set([
    'allow-project-root',
    'force',
    'label',
    'org',
    'publish',
    'rescope',
    'route',
    'section',
    'site',
    'take-over-site',
  ]);
  // `--force` is a boolean, so a strict pair-wise walk would consume whatever
  // followed it as its value and then reject the real next flag.
  const BOOLEAN_FLAGS = new Set([
    'allow-project-root',
    'force',
    'publish',
    'rescope',
    'section',
    'site',
    'take-over-site',
  ]);

  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];

    if (!flag?.startsWith('--')) {
      throw new UsageError(`Malformed option near "${flag ?? ''}".`);
    }

    const name = flag.slice(2);

    if (!KNOWN_FLAGS.has(name)) {
      throw new UsageError(
        `Unknown option "${flag}". Known options: ${[...KNOWN_FLAGS]
          .map((known) => `--${known}`)
          .join(', ')}.`,
      );
    }
    if (BOOLEAN_FLAGS.has(name)) {
      flags.set(name, 'true');

      continue;
    }

    const value = rest[index + 1];

    if (value === undefined || value.startsWith('--')) {
      throw new UsageError(`Option "${flag}" needs a value.`);
    }

    flags.set(name, value);
    index += 1;
  }

  const rawRoute = flags.get('route');

  // Caught here rather than server-side: a leading slash is the difference
  // between claiming `/docs` and claiming nothing, and the error is far
  // clearer before the upload than after it.
  if (rawRoute !== undefined && !rawRoute.startsWith('/')) {
    throw new UsageError(`--route must start with "/" (got "${rawRoute}").`);
  }

  // The site root IS claimable — never at PREFIX, which would match every path
  // in the org and take over the storefront, checkout and the admin bounce in
  // one entry. So `--route /` is accepted and the deploy sends EXACT for one
  // page, or SITE for a whole site; see `scopeForRoute`.
  //
  // Every spelling of the root collapses to one canonical `/` before it is
  // sent. `//` and `///` are the same claim but different strings: stored as
  // separate rows they would both normalize to the empty pattern at the edge,
  // tie on length and priority, and the winner would fall to a lexicographic
  // tiebreak on the bundle prefix — deterministic, but arbitrary. Same argument
  // as normalizing the pattern at parse time, applied to the writing end.
  const route = isRootRoute(rawRoute) ? '/' : rawRoute;

  const organizationSlug = flags.get('org');

  if (!organizationSlug) throw new UsageError('Missing required --org <slug>.');

  const wholeSite = flags.get('site') === 'true';

  // `--site` only means anything at the root: everywhere else PREFIX already
  // serves a whole multi-page site from the claimed path. Refused rather than
  // ignored, for the same reason an unknown flag is — a `--site` that silently
  // did nothing would read as "I asked for the whole site and got one page".
  if (wholeSite && !isRootRoute(route)) {
    throw new UsageError(
      '--site applies to `--route /`. Under a path, the deploy already serves every page below it.',
    );
  }
  // Fail before the upload, not after it: the claim is made once every file has
  // been sent, so an unconfirmed --site would otherwise spend the whole upload
  // to reach a refusal that was knowable from the argv.
  //
  // Gated on --take-over-site rather than --force. Requiring --force here made
  // the refusal unreachable in a different way: --force IS acknowledgeShadowing,
  // so every --site deploy declared the shadowing settled before the server had
  // said what would be shadowed, and the report never printed. The author now
  // sees the report on the first attempt and re-runs with --force.
  if (wholeSite && flags.get('take-over-site') !== 'true') {
    throw new UsageError(
      '--site claims every address your organization will ever have, so it needs --take-over-site as well.',
    );
  }

  const section = flags.get('section') === 'true';

  // `--section` only means anything UNDER a path. At the root, "serve what the
  // deploy already publishes here" is `--site`, which additionally yields
  // checkout and sign-in back to the platform — the yield is the whole reason
  // the root is a separate scope. Refused rather than ignored, so a root
  // `--section` cannot read as "I asked for that and got it".
  if (section && isRootRoute(route)) {
    throw new UsageError(
      '--section applies under a path. At the root, use --site (which keeps checkout and sign-in ours).',
    );
  }
  // A route is what --section modifies; without one there is no claim to
  // modify, and the flag would silently do nothing.
  if (section && route === undefined) {
    throw new UsageError('--section needs --route <path>.');
  }

  const publish = flags.get('publish') === 'true';

  if (publish && (route !== '/' || !wholeSite)) {
    throw new UsageError(
      '--publish needs --route / --site --take-over-site; MCP draft publishing currently supports a demo whole-site mount.',
    );
  }
  if (publish && (section || flags.get('rescope') === 'true')) {
    throw new UsageError('--publish cannot be combined with --section or --rescope.');
  }

  return {
    acknowledgeShadowing: flags.get('force') === 'true',
    allowProjectRoot: flags.get('allow-project-root') === 'true',
    directory: path.resolve(directory),
    organizationSlug,
    publish,
    rescope: flags.get('rescope') === 'true',
    route,
    section,
    sourceLabel: flags.get('label'),
    takeOverSite: flags.get('take-over-site') === 'true',
    wholeSite,
  };
}
