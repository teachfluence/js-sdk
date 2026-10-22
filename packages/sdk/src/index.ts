/**
 * `@teachfluence/sdk` — build your own frontend on Teachfluence.
 *
 * SCOPE TODAY. Session reads and the site-deploy operations the CLI uses.
 *
 * CHECKOUT IS NOT HERE YET. An earlier draft of this package exported a
 * `CheckoutApi` naming a `createCheckoutSession` mutation — which does not
 * exist on the backend and never did. Shipping a headline API against a
 * resolver nobody wrote is worse than shipping without it: the types compile,
 * the docs read well, and the first customer to call it gets an opaque server
 * error. It returns when the mutation does.
 *
 * When it lands it will still be a HANDOFF, never a payment surface: checkout
 * spans three providers plus billing capture, promotions, gifting and Turkish
 * invoicing, and that is the most compliance-sensitive code on the platform.
 * The customer owns everything up to the buy button.
 *
 * OPERATIONS. Every call names a published operation by id. The SDK cannot
 * express an arbitrary query, which is what keeps our public API surface equal
 * to what we chose to publish rather than to the whole schema — and lets the
 * schema keep evolving behind it.
 */
// The operations themselves. Without these `execute()` is uncallable — it takes
// a `PersistedOperation`, and a consumer has no other way to obtain one: the
// documents live in the API's manifest, and the ids are content hashes nobody
// should be transcribing by hand. Every identifier here is `Sdk`-prefixed so
// importing them into a storefront's scope collides with nothing.
export * from './__generated__/operations.js';

export { TeachfluenceClient } from './client.js';
export type {
  PersistedOperation,
  TeachfluenceClientOptions,
} from './client.js';

export {
  isUserError,
  TeachfluenceOperationError,
  TeachfluenceTransportError,
  TeachfluenceUserError,
} from './errors.js';
export type { UserError } from './errors.js';

// Structured data, built by the SAME pure functions the platform's own product
// pages use (copied from the web app at generation time), so a storefront or a
// bundle render module states a product exactly as the platform would: an
// Offer only while the public can buy it, an Event only when it can be placed,
// every node pointing at the org's one `@id`. No network, no clock unless you
// pass none: feed `orderableNodeFacts` the `node` of `SdkOrderableJsonLdFacts`,
// add the page's own facts, and serialize what `buildOrderableJsonLd` returns.
export {
  buildOrderableJsonLd,
  buildOrderableOffer,
  hasOrderableEventEnded,
} from './__generated__/seo/orderable-jsonld.js';
export type {
  OrderableJsonLdFacts,
  OrderableOffer,
  OrderableSchemaType,
} from './__generated__/seo/orderable-jsonld.js';
export {
  orderableInstructorFacts,
  orderableNodeFacts,
} from './__generated__/seo/orderable-jsonld-node.js';
export type {
  OrderableFactsNode,
  OrderableInstructorEntry,
} from './__generated__/seo/orderable-jsonld-node.js';
export { organizationJsonLdId } from './__generated__/seo/organization-jsonld-id.js';
export type { EventLocationParts } from './__generated__/seo/event-location-jsonld.js';
export type { OrderablePublicSaleState } from './__generated__/seo/orderable-public-sale-state.js';
