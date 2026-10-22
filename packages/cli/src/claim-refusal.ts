/**
 * Render the server's refusal of a route claim into the lines the CLI prints.
 *
 * Extracted from the deploy flow so it can be tested: `index.ts` exports
 * nothing, so the branch below — which decides whether the operator is told how
 * to proceed — had no seam and no test.
 */
export interface ClaimRefusal {
  shadowReport: { count: number; sampleUrls: string[] } | null;
  userErrors?: { message: string }[] | null;
}

export function formatClaimRefusal(
  refusal: ClaimRefusal,
  route: string,
): string[] {
  const messages =
    refusal.userErrors?.map((error) => error.message).join('; ') ?? '';

  // Keyed on the report EXISTING, not on it being non-empty.
  //
  // A whole-site claim is refused even when it shadows nothing TODAY — it
  // covers every address the organization adds later, which no report can list
  // — so an org with no page-builder pages gets `count: 0` on the very first
  // `--site` run. Keyed on `count > 0`, that fell through to the generic arm,
  // which prints the server's sentence and exits without ever saying `--force`:
  // the feature's most likely first run ended in a dead end.
  //
  // Every other refusal (unknown bundle, bad pattern, reserved segment) carries
  // no `shadowReport` at all, so presence is the discriminator that separates
  // "confirm this" from "you got something wrong".
  if (!refusal.shadowReport) {
    return [messages || 'The route claim was refused.'];
  }

  const { count, sampleUrls } = refusal.shadowReport;

  const head =
    count > 0
      ? [
          `\nRoute "${route}" would shadow ${count} existing page(s):`,
          ...sampleUrls.map((url) => `  ${url}`),
        ]
      : [`\n${messages || 'This claim needs confirming.'}`];

  return [...head, '\nRe-run with --force to publish it anyway.'];
}
