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
  fetch?: typeof globalThis.fetch;
  /**
   * Called when a request is made without a session. Lets a host app supply a
   * token it manages itself (SSR forwarding a visitor's token, for example).
   */
  getAccessToken?: () => Promise<string | null> | string | null;
}

const DEFAULT_BASE_URL = 'https://api.teachfluence.com';

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

export class TeachfluenceClient {
  private readonly baseUrl: string;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly options: TeachfluenceClientOptions;

  constructor(options: TeachfluenceClientOptions) {
    assertKeyIsSafeForEnvironment(options.apiKey);

    this.options = options;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

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
