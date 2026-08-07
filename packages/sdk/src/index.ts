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
