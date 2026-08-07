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
  route?: string;
  sourceLabel?: string;
}

export function parseArgs(argv: string[]): Args {
  const [command, directory, ...rest] = argv;

  if (command !== 'deploy' || !directory) {
    throw new UsageError(
      'Usage: teachfluence deploy <directory> --org <slug> [--label <git-sha>]\n' +
        '                                     [--route <path>] [--force]\n\n' +
        '  --route  Serve the deploy at this path (e.g. /docs). Without it the\n' +
        '           bundle uploads but receives no traffic. Build with a\n' +
        '           matching base path (Vite base, Next basePath, CRA\n' +
        '           homepage) or every asset will 404.\n' +
        '  --force  Publish the route even if it shadows existing pages.\n' +
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
    'route',
  ]);
  // `--force` is a boolean, so a strict pair-wise walk would consume whatever
  // followed it as its value and then reject the real next flag.
  const BOOLEAN_FLAGS = new Set(['allow-project-root', 'force']);

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

  const route = flags.get('route');

  // Caught here rather than server-side: a leading slash is the difference
  // between claiming `/docs` and claiming nothing, and the error is far
  // clearer before the upload than after it.
  if (route !== undefined && !route.startsWith('/')) {
    throw new UsageError(`--route must start with "/" (got "${route}").`);
  }
  // A ROOT claim cannot resolve, so reject it here rather than let the deploy
  // succeed and serve nothing. `parsePublishedRoutes` drops an empty pattern,
  // `matches()` compares against slash-stripped segments so `/` equals nothing,
  // and `selectBundleRoute` returns null for an empty normalized path — three
  // independent reasons, none of which the author can see from the CLI.
  if (route !== undefined && route.replaceAll('/', '').length === 0) {
    throw new UsageError(
      'A claim on the site root is not supported: the edge matcher resolves ' +
        'claims against path segments, so a root pattern matches nothing. ' +
        'Claim a real path (e.g. --route /docs).',
    );
  }

  const organizationSlug = flags.get('org');

  if (!organizationSlug) throw new UsageError('Missing required --org <slug>.');

  return {
    acknowledgeShadowing: flags.get('force') === 'true',
    allowProjectRoot: flags.get('allow-project-root') === 'true',
    directory: path.resolve(directory),
    organizationSlug,
    route,
    sourceLabel: flags.get('label'),
  };
}
