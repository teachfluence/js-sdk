/**
 * Following a `SCOPE_CHANGE_REQUIRES_UPDATE` refusal, for `deploy`.
 *
 * The server refuses to widen a live claim through `create` — it returns
 * CONFLICT and tells the caller to update the claim instead. That is the right
 * refusal, but until this existed the CLI printed the sentence and exited, so
 * the one upgrade the SITE scope was built for ("my one-page root deploy should
 * become my whole site") had no path through the tool that performs deploys.
 *
 * Extracted rather than inlined for the same reason as `claim-refusal.ts`:
 * `index.ts` exports nothing, so a branch left in there has no seam and no test.
 */

/** The subset of a claim this module needs. Mirrors the published read. */
export interface RouteClaim {
  id: string;
  isActive: boolean;
  pathPattern: string;
  scope: 'EXACT' | 'PREFIX' | 'SITE' | 'SITE_SUBTREE';
  targetKind: 'CDN_BUNDLE' | 'INTERNAL_MODULE';
}

export interface UserError {
  message: string;
  code?: string | null;
  field?: readonly string[] | null;
}

/**
 * Normalize a `--route` the way the server normalizes `pathPattern`.
 *
 * The read returns stored patterns — no leading slash, lowercased, root as the
 * empty string — while `--route` is what the operator typed. Comparing the two
 * raw makes `/Preview/` miss `preview`, which would read as "no claim exists"
 * and send the caller down the create path again.
 */
export function normalizeRoute(route: string): string {
  return route
    .split('/')
    .filter((segment) => segment.length > 0)
    .join('/')
    .toLowerCase();
}

/**
 * True when this refusal is the one that update, and only update, can resolve.
 *
 * NOT keyed on `SCOPE_CHANGE_REQUIRES_UPDATE`. That is the server's INTERNAL
 * outcome name and never reaches the wire: the resolver maps it to
 * `code: 'CONFLICT'` with `field: ['input', 'scope']`. An earlier version of
 * this function compared against the internal name, so it matched nothing and
 * the auto-follow never ran — the deploy died on exactly the conflict this was
 * written to follow, which is how it was caught: by running a real deploy, not
 * by a type error.
 *
 * `PATH_TAKEN` ("another claim already owns that path") answers CONFLICT too
 * and is NOT followable, so the code alone cannot discriminate. The field is
 * what separates them — `scope` for the one an update fixes, `pathPattern` for
 * the one it does not.
 */
export function isScopeChangeRefusal(errors: readonly UserError[]): boolean {
  return errors.some(
    (error) =>
      error.code === 'CONFLICT' && error.field?.at(-1) === 'scope',
  );
}

/**
 * The claim a `--route` deploy is about to re-point, or null.
 *
 * `targetKind` is checked, not just the path: a path can also be owned by an
 * `INTERNAL_MODULE` claim, which belongs to the page builder rather than to any
 * deploy. Rescoping one of those from the CLI would take a platform surface off
 * the customer's own site, so an unmatched kind returns null and the caller
 * falls back to reporting the original refusal.
 */
export function findClaimForRoute(
  claims: readonly RouteClaim[],
  route: string,
): RouteClaim | null {
  const wanted = normalizeRoute(route);

  return (
    claims.find(
      (claim) =>
        claim.pathPattern === wanted &&
        claim.targetKind === 'CDN_BUNDLE' &&
        // The backend's update resolves through `findLiveEntryById`, so a
        // deactivated row returned ahead of the live one at the same path would
        // hand `update` a dead id and answer NOT_FOUND — after the whole bundle
        // had uploaded, at exactly the step this path exists to rescue.
        claim.isActive,
    ) ?? null
  );
}

/**
 * How much of the URL space each scope covers, narrowest first.
 *
 * PREFIX and SITE_SUBTREE tie, because they cover the SAME addresses — they
 * differ only in which file answers. So a flip between them is neither a
 * widening nor a narrowing, and the auto-follow below correctly refuses to
 * perform it on its own: it changes what visitors see at every address under
 * the claim, which is a decision, not a scope upgrade to carry through.
 */
const SCOPE_BREADTH: Record<RouteClaim['scope'], number> = {
  EXACT: 0,
  PREFIX: 1,
  SITE: 2,
  SITE_SUBTREE: 1,
};

/**
 * Whether moving a live claim from `from` to `to` gives up ground.
 *
 * The auto-follow exists to carry an UPGRADE through — a one-page deploy that
 * grew into a whole site. It must not carry the reverse. `--site` is refused
 * off the root and refused without `--take-over-site` on every run, so a CI
 * step that loses its flags computes `EXACT` for `/`, hits the same refusal,
 * and would silently rescope a live SITE claim down to a single address: every
 * other path stops being served by the customer's bundle. Narrowing shadows
 * nothing, so no shadow report comes back and no `--force` gate is reached —
 * one log line and exit 0.
 *
 * Widening stays automatic; narrowing becomes an explicit act, symmetric with
 * the `--take-over-site` gate the parser already enforces.
 */
export function isWideningScope(
  from: RouteClaim['scope'],
  to: RouteClaim['scope'],
): boolean {
  return classifyScopeChange(from, to) === 'WIDEN';
}

/**
 * Which KIND of scope change this is, for the refusal to describe honestly.
 *
 * `isWideningScope` answers one bit, and one bit cannot tell a NARROWING from a
 * LATERAL move. PREFIX and SITE_SUBTREE cover identical addresses, so a flip
 * between them gives up no ground at all — but under a single boolean it read
 * as narrowing, and the refusal told the operator their deploy "serves less"
 * and to re-run with `--site --take-over-site`, which the parser refuses off
 * the root two functions away. That is the PREFIX → SITE_SUBTREE migration:
 * the exact move the fourth scope exists to make possible.
 *
 * Still refused, deliberately — a lateral flip changes which file answers at
 * every address under the claim, which is a decision, not an upgrade to carry
 * through silently. Only the sentence changes.
 */
export function classifyScopeChange(
  from: RouteClaim['scope'],
  to: RouteClaim['scope'],
): 'LATERAL' | 'NARROW' | 'SAME' | 'WIDEN' {
  if (from === to) return 'SAME';

  const fromBreadth = SCOPE_BREADTH[from];
  const toBreadth = SCOPE_BREADTH[to];

  // A scope this CLI predates reads as `undefined`, and both comparisons below
  // are then false — so it would fall through to LATERAL, the one branch that
  // asserts the two scopes cover the SAME addresses. That is a claim about a
  // scope we have never heard of. NARROW is the honest answer: it refuses the
  // same way and promises nothing.
  if (fromBreadth === undefined || toBreadth === undefined) return 'NARROW';

  if (toBreadth > fromBreadth) return 'WIDEN';
  if (toBreadth < fromBreadth) return 'NARROW';

  return 'LATERAL';
}
