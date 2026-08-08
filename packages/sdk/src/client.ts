import type {
  SdkAddCartOrderableMutationVariables,
  SdkAddCouponCodeMutationVariables,
  SdkCartQueryVariables,
  SdkCatalogQueryVariables,
  SdkCoachingSessionQueryVariables,
  SdkCompleteFreeOrderMutationVariables,
  SdkCourseQueryVariables,
  SdkCreateOrderMutationVariables,
  SdkDigitalProductQueryVariables,
  SdkLiveEventQueryVariables,
  SdkMarkCartItemAsGiftMutationVariables,
  SdkOrderQueryVariables,
  SdkRemoveCartOrderableMutationVariables,
  SdkRemoveCouponCodeMutationVariables,
} from './__generated__/types.js';

import {
  SdkAddCartOrderable,
  SdkAddCouponCode,
  SdkCart,
  SdkCatalog,
  SdkCoachingSession,
  SdkCompleteFreeOrder,
  SdkCourse,
  SdkCreateOrder,
  SdkDigitalProduct,
  SdkLiveEvent,
  SdkMarkCartItemAsGift,
  SdkOrder,
  SdkRemoveCartOrderable,
  SdkRemoveCouponCode,
  SdkViewerSession,
} from './__generated__/operations.js';
import {
  type UserError,
  TeachfluenceOperationError,
  TeachfluenceTransportError,
  TeachfluenceUserError,
} from './errors.js';

/**
 * Transport for the Teachfluence SDK (PI-1511 Phase 4).
 *
 * Deliberately zero-dependency and `fetch`-based: an SDK that drags in a
 * GraphQL client forces its version on every consumer, and this one has to run
 * unchanged in a browser bundle, a Node build script, and an edge runtime.
 */

/** An operation published by an SDK release. Callers never construct these. */
export interface PersistedOperation<TResult, TVariables> {
  /** sha256 of the operation document, resolved server-side. */
  readonly id: string;
  readonly operationName: string;
  /** Phantom types — erased at runtime, they only carry inference. */
  readonly __result?: TResult;
  readonly __variables?: TVariables;
}

export interface TeachfluenceClientOptions {
  /**
   * The organization this client speaks for. Explicit rather than inferred from
   * the host, because a customer's build script runs on no host at all.
   */
  organizationSlug: string;
  /**
   * Publishable key (`tf_pk_…`). Safe to ship in a client bundle — it grants
   * nothing an anonymous visitor could not already do. NEVER put a `tf_sk_` key
   * here; see the runtime guard below.
   */
  apiKey?: string;
  /** Override the API origin. Defaults to production. */
  baseUrl?: string;
  /**
   * Origin of the HOSTED checkout page, which is not the API origin — payment
   * is a page a buyer is sent to, not a request this SDK makes. Override when
   * running against a non-production environment.
   */
  checkoutBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  /**
   * Called when a request is made without a session. Lets a host app supply a
   * token it manages itself (SSR forwarding a visitor's token, for example).
   */
  getAccessToken?: () => Promise<string | null> | string | null;
}

const DEFAULT_BASE_URL = 'https://api.teachfluence.com';
const DEFAULT_CHECKOUT_BASE_URL = 'https://teachfluence.com';

/**
 * A secret key must never reach a browser. This catches the single most likely
 * catastrophic misuse — copying the server key into client config — at the
 * moment it happens rather than after it has shipped to production and been
 * scraped. Server-side callers are unaffected because `window` is undefined
 * there.
 */
function assertKeyIsSafeForEnvironment(apiKey: string | undefined): void {
  if (!apiKey) return;

  const inBrowser = typeof window !== 'undefined';

  if (inBrowser && apiKey.startsWith('tf_sk_')) {
    throw new TeachfluenceTransportError(
      'A secret key (tf_sk_…) was passed to the Teachfluence SDK in a browser. ' +
        'Secret keys grant organization-wide access and must stay on your server. ' +
        'Use a publishable key (tf_pk_…) in client code.',
    );
  }
}

/**
 * The checkout page is a different origin from the API, and the SDK cannot
 * derive one from the other — `api.teachfluence.com` maps to
 * `teachfluence.com` in production, but nothing about `http://localhost:4000`
 * says where its checkout lives.
 *
 * So an integrator who points `baseUrl` at staging and forgets
 * `checkoutBaseUrl` would place orders on staging and then redirect real
 * buyers to the PRODUCTION payment page, for an order id that does not exist
 * there. Silently defaulting is what makes that possible; refusing to guess is
 * the fix.
 */
function assertCheckoutOriginIsResolvable(
  options: TeachfluenceClientOptions,
): void {
  if (options.baseUrl && !options.checkoutBaseUrl) {
    throw new TeachfluenceTransportError(
      'A custom `baseUrl` was given without a `checkoutBaseUrl`. The hosted ' +
        'checkout page is a separate origin from the API and cannot be derived ' +
        'from it, so `paymentUrl()` would send buyers to production while your ' +
        'orders were created somewhere else. Set `checkoutBaseUrl` too.',
    );
  }
}

/**
 * Variables minus the org slug, which the client already knows.
 *
 * The slug is REMOVED, not made optional. `execute()` always sends the
 * constructor's slug in the `X-Teachfluence-Org` header, so letting a caller
 * pass a different one in the variables would put two different tenants in one
 * request — and which of them the server honours is not something the caller
 * could reason about. One client speaks for one organization.
 */
type WithoutOrg<T> = Omit<T, 'organizationSlug'>;

export class TeachfluenceClient {
  private readonly baseUrl: string;
  private readonly checkoutBaseUrl: string;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly options: TeachfluenceClientOptions;

  /**
   * The cart, which works for a signed-out visitor.
   *
   * Pass `cartId` for an anonymous shopper and persist what comes back —
   * without it every call starts a new cart. A signed-in visitor's cart is
   * keyed on their session instead, so `cartId` is ignored there.
   */
  readonly cart = {
    add: (input: SdkAddCartOrderableMutationVariables['input']) =>
      this.execute(SdkAddCartOrderable, { input }),
    addCoupon: (input: SdkAddCouponCodeMutationVariables['input']) =>
      this.execute(SdkAddCouponCode, { input }),
    get: (variables: WithoutOrg<SdkCartQueryVariables> = {}) =>
      this.execute(SdkCart, this.withOrg(variables)),
    markAsGift: (input: SdkMarkCartItemAsGiftMutationVariables['input']) =>
      this.execute(SdkMarkCartItemAsGift, { input }),
    remove: (input: SdkRemoveCartOrderableMutationVariables['input']) =>
      this.execute(SdkRemoveCartOrderable, { input }),
    removeCoupon: (input: SdkRemoveCouponCodeMutationVariables['input']) =>
      this.execute(SdkRemoveCouponCode, { input }),
  };

  /**
   * Reading published content. Everything here is anonymous-safe — a
   * publishable key grants nothing a visitor could not already see.
   */
  readonly catalog = {
    coachingSession: (variables: WithoutOrg<SdkCoachingSessionQueryVariables>) =>
      this.execute(SdkCoachingSession, this.withOrg(variables)),
    /**
     * A course is not itself orderable — its ACADEMIC TERMS are, which is why
     * the result carries them with their own prices and availability. Add a
     * term id to the cart, never the course id.
     */
    course: (variables: WithoutOrg<SdkCourseQueryVariables>) =>
      this.execute(SdkCourse, this.withOrg(variables)),
    digitalProduct: (variables: WithoutOrg<SdkDigitalProductQueryVariables>) =>
      this.execute(SdkDigitalProduct, this.withOrg(variables)),
    /** Courses, bundles, digital products and live events in one round trip. */
    list: (variables: WithoutOrg<SdkCatalogQueryVariables> = {}) =>
      this.execute(SdkCatalog, this.withOrg(variables)),
    liveEvent: (variables: WithoutOrg<SdkLiveEventQueryVariables>) =>
      this.execute(SdkLiveEvent, this.withOrg(variables)),
  };

  /**
   * Turning a cart into an order, then handing the buyer to the hosted
   * payment page.
   *
   * There is no payment form here and there will not be one — see the README.
   * `createOrder` accepts `cartId` for a signed-out buyer, and the payment page
   * admits an anonymous visitor while the order is still pending, so the whole
   * flow works without the buyer ever signing in.
   */
  readonly checkout = {
    completeFreeOrder: (
      input: SdkCompleteFreeOrderMutationVariables['input'],
    ) => this.execute(SdkCompleteFreeOrder, { input }),
    createOrder: (input: SdkCreateOrderMutationVariables['input']) =>
      this.execute(SdkCreateOrder, { input }),
    /**
     * Read an order back — a confirmation page, or polling for the payment to
     * settle after the buyer returns from the hosted page.
     *
     * Readable by an anonymous buyer while the order is still pending, which
     * is what makes a confirmation page work without an account. That window
     * closes once the order settles, so a long-lived "my orders" view needs a
     * signed-in viewer.
     */
    order: (variables: SdkOrderQueryVariables) =>
      this.execute(SdkOrder, variables),
    /**
     * Where to send the buyer once an order exists. Send them to the returned
     * URL; do not fetch it.
     *
     * `iframe` asks the page for its embeddable form — only useful if you are
     * embedding it, and the page's frame-ancestors policy governs whether your
     * origin may.
     */
    paymentUrl: (orderSlug: string, options?: { iframe?: boolean }) =>
      `${this.checkoutBaseUrl}/odeme/${encodeURIComponent(orderSlug)}` +
      (options?.iframe ? '?iframe=true' : ''),
  };

  /** Who the current visitor is, if anyone. */
  readonly session = {
    viewer: () => this.execute(SdkViewerSession, {}),
  };

  constructor(options: TeachfluenceClientOptions) {
    assertKeyIsSafeForEnvironment(options.apiKey);

    assertCheckoutOriginIsResolvable(options);

    this.options = options;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.checkoutBaseUrl = (
      options.checkoutBaseUrl ?? DEFAULT_CHECKOUT_BASE_URL
    ).replace(/\/+$/, '');

    const fetchImpl = options.fetch ?? globalThis.fetch;

    if (typeof fetchImpl !== 'function') {
      throw new TeachfluenceTransportError(
        'No fetch implementation available. Pass one via the `fetch` option.',
      );
    }

    // Bind so a runtime that requires `fetch` be called on its global (undici,
    // some edge runtimes) does not throw an illegal-invocation error.
    this.doFetch = fetchImpl.bind(globalThis);
  }

  /** Fills in the organization slug the client was constructed with. */
  private withOrg<T>(variables: T): T & { organizationSlug: string } {
    return { ...variables, organizationSlug: this.options.organizationSlug };
  }

  /**
   * Execute a published operation.
   *
   * Only `documentId` is ever sent — the SDK cannot express an arbitrary query
   * by design, which is what keeps the public surface equal to what we chose to
   * publish rather than to the whole schema.
   */
  // `extends object` rather than `Record<string, unknown>`: variables are only
  // ever JSON-serialized, so the index signature buys nothing — and a plain
  // interface (which is what every caller writes) does not satisfy it, so the
  // stricter constraint would force every input type to be a type alias.
  async execute<TResult, TVariables extends object>(
    operation: PersistedOperation<TResult, TVariables>,
    variables: TVariables,
    init?: { signal?: AbortSignal },
  ): Promise<TResult> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Teachfluence-Org': this.options.organizationSlug,
    };

    // `X-Org-Api-Key`, not `X-Api-Key`: the latter is the platform's INTERNAL
    // service credential. Two trust domains must not share a header name.
    if (this.options.apiKey) headers['X-Org-Api-Key'] = this.options.apiKey;

    const token = await this.options.getAccessToken?.();

    // Bearer, not a cookie. The SDK runs cross-origin from the customer's own
    // domain, where our host-only session cookie is not sent — and widening
    // that cookie to make it work would hand the session to every subdomain.
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;

    try {
      response = await this.doFetch(`${this.baseUrl}/graphql`, {
        body: JSON.stringify({
          documentId: operation.id,
          variables,
        }),
        headers,
        method: 'POST',
        signal: init?.signal,
      });
    } catch (error) {
      throw new TeachfluenceTransportError(
        `Request for ${operation.operationName} failed to complete.`,
        { cause: error },
      );
    }

    if (!response.ok) {
      // Include the BODY. The server explains itself here — an operation the
      // deployed API does not publish comes back as `UNKNOWN_OPERATION` with a
      // sentence naming the likely cause — and reporting only the status threw
      // that away, leaving the caller with a number.
      let detail = '';

      try {
        const problem = (await response.json()) as {
          errors?: { extensions?: { code?: unknown }; message?: unknown }[];
        };

        detail =
          problem.errors
            ?.map((error) => String(error.message))
            .filter(Boolean)
            .join('; ') ?? '';
      } catch {
        // A proxy returning HTML, or a truncated body. The status still says
        // something useful, so do not replace it with a JSON parse error.
      }

      throw new TeachfluenceTransportError(
        `Request for ${operation.operationName} failed with HTTP ${response.status}.` +
          (detail ? ` ${detail}` : ''),
        { status: response.status },
      );
    }

    let body: { data?: unknown; errors?: unknown[] };

    try {
      body = (await response.json()) as typeof body;
    } catch (error) {
      throw new TeachfluenceTransportError(
        `Response for ${operation.operationName} was not valid JSON.`,
        { cause: error },
      );
    }

    if (Array.isArray(body.errors) && body.errors.length > 0) {
      throw new TeachfluenceOperationError(
        `Server rejected ${operation.operationName}.`,
        { errors: body.errors, operationId: operation.id },
      );
    }

    const data = body.data as TResult;

    throwIfUserErrors(data);

    return data;
  }
}

/**
 * Turn a mutation's `userErrors` into a typed throw.
 *
 * The platform returns business failures inside a 200 response, so without this
 * every caller has to remember to check a field that is absent on most
 * operations — and the one that forgets silently treats a declined payment as a
 * success. Scans one level deep, which is where every payload puts it.
 */
function throwIfUserErrors(data: unknown): void {
  if (!data || typeof data !== 'object') return;

  for (const value of Object.values(data as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;

    const candidate = (value as { userErrors?: unknown }).userErrors;

    if (Array.isArray(candidate) && candidate.length > 0) {
      throw new TeachfluenceUserError(candidate as UserError[]);
    }
  }
}
