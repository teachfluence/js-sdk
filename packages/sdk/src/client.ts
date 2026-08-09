import type {
  SdkAddCartOrderableMutationVariables,
  SdkAddCouponCodeMutationVariables,
  SdkAttachmentWatermarkJobQueryVariables,
  SdkCartQueryVariables,
  SdkCatalogQueryVariables,
  SdkCoachingSessionQueryVariables,
  SdkCompleteFreeOrderMutationVariables,
  SdkCourseItemDetailQueryVariables,
  SdkCourseQueryVariables,
  SdkCreateDraftAssignmentSubmissionMutationVariables,
  SdkCreateForumPostCommentMutationVariables,
  SdkCreateForumPostMutationVariables,
  SdkCreateOrderMutationVariables,
  SdkCurriculumQueryVariables,
  SdkDigitalProductQueryVariables,
  SdkForumPostQueryVariables,
  SdkForumQueryVariables,
  SdkGetAttachmentUrlMutationVariables,
  SdkLiveEventQueryVariables,
  SdkLoginWithOtpMutationVariables,
  SdkLoginWithPasswordMutationVariables,
  SdkMarkCartItemAsGiftMutationVariables,
  SdkOrderQueryVariables,
  SdkRemoveCartOrderableMutationVariables,
  SdkRemoveCouponCodeMutationVariables,
  SdkRequestPasswordResetMutationVariables,
  SdkResetPasswordMutationVariables,
  SdkSendLoginOtpMutationVariables,
  SdkSubmitAssignmentSubmissionMutationVariables,
  SdkSubmitQuizMutationVariables,
  SdkUpdateAssignmentSubmissionMutationVariables,
  SdkUpdateCourseItemProgressMutationVariables,
  SdkUpdateForumPostCommentReactionMutationVariables,
  SdkUpdateForumPostReactionMutationVariables,
  SdkViewerCertificatesQueryVariables,
  SdkViewerOrdersQueryVariables,
} from './__generated__/types.js';

import {
  SdkAddCartOrderable,
  SdkAddCouponCode,
  SdkAttachmentWatermarkJob,
  SdkCart,
  SdkCatalog,
  SdkCoachingSession,
  SdkCompleteFreeOrder,
  SdkCourse,
  SdkCourseItemDetail,
  SdkCreateDraftAssignmentSubmission,
  SdkCreateForumPost,
  SdkCreateForumPostComment,
  SdkCreateOrder,
  SdkCurriculum,
  SdkDigitalProduct,
  SdkForum,
  SdkForumPost,
  SdkGetAttachmentUrl,
  SdkLiveEvent,
  SdkLoginWithOtp,
  SdkLoginWithPassword,
  SdkLogout,
  SdkMarkCartItemAsGift,
  SdkOrder,
  SdkOrganizationIdBySlug,
  SdkRemoveCartOrderable,
  SdkRemoveCouponCode,
  SdkRequestPasswordReset,
  SdkResetPassword,
  SdkSendLoginOtp,
  SdkSubmitAssignmentSubmission,
  SdkSubmitQuiz,
  SdkUpdateAssignmentSubmission,
  SdkUpdateCourseItemProgress,
  SdkUpdateForumPostCommentReaction,
  SdkUpdateForumPostReaction,
  SdkViewerCertificates,
  SdkViewerEnrollments,
  SdkViewerOrders,
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
 * What a GraphQL `ID` accepts, mirroring the generated inputs exactly
 * (`organizationId: string | number`).
 *
 * Deliberately NOT narrowed to `string` even though the client's own fill-in
 * only ever produces one: the field is a caller-facing input, and an
 * integrator holding a numeric id should not be forced to stringify it for a
 * type we invented rather than the schema.
 */
type OrganizationId = number | string;

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

/**
 * An input whose `organizationId` the client can fill in.
 *
 * Nearly every mutation needs the organization's id, but a client is
 * constructed from its SLUG — so without this a caller had to resolve the id
 * themselves and thread it through every call site, which is a round trip and
 * a footgun for a value that never changes. Still accepted explicitly, so
 * anything already passing it keeps working.
 */
type WithResolvedOrg<T extends { organizationId: OrganizationId }> = Omit<
  T,
  'organizationId'
> & { organizationId?: OrganizationId };

export class TeachfluenceClient {
  private readonly baseUrl: string;
  private readonly checkoutBaseUrl: string;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly options: TeachfluenceClientOptions;
  /**
   * Resolved once and reused. The slug→id mapping cannot change for the life
   * of a client, so re-resolving it per call would be a round trip spent on a
   * constant. Cached as the PROMISE so concurrent first calls share one
   * request rather than racing.
   */
  private organizationIdPromise: Promise<string> | null = null;

  /**
   * Assessed work.
   *
   * An assignment is a THREE-step flow, and the shape is deliberate: create a
   * draft, update it as the student writes, then submit. Nothing is graded
   * until submit, so a student can leave and come back — build the autosave
   * around `update`, not around `submit`.
   *
   * Exam operations are not published yet. They are pending a backend audit of
   * whether a timed exam's clock is the server's or the client's; publishing
   * them before that answer would hand a custom frontend the time limit.
   */
  readonly assess = {
    assignmentDraft: (
      input: SdkCreateDraftAssignmentSubmissionMutationVariables['input'],
    ) => this.execute(SdkCreateDraftAssignmentSubmission, { input }),
    saveAssignment: (
      input: SdkUpdateAssignmentSubmissionMutationVariables['input'],
    ) => this.execute(SdkUpdateAssignmentSubmission, { input }),
    submitAssignment: (
      input: SdkSubmitAssignmentSubmissionMutationVariables['input'],
    ) => this.execute(SdkSubmitAssignmentSubmission, { input }),
    /**
     * Answer a lesson quiz. The payload carries `selectedOption.isCorrect` —
     * the verdict on the option they picked — so a result can be rendered
     * without a second round trip, and without the whole answer key.
     *
     * `startedAt` is when the student opened the question; the server records
     * it as time-spent. `submission` is the answer shaped for the quiz type.
     */
    submitQuiz: (input: SdkSubmitQuizMutationVariables['input']) =>
      this.execute(SdkSubmitQuiz, { input }),
  };

  /**
   * The cart, which works for a signed-out visitor.
   *
   * Pass `cartId` for an anonymous shopper and persist what comes back —
   * without it every call starts a new cart. A signed-in visitor's cart is
   * keyed on their session instead, so `cartId` is ignored there.
   */
  readonly cart = {
    add: async (
      input: WithResolvedOrg<SdkAddCartOrderableMutationVariables['input']>,
    ) =>
      this.execute(SdkAddCartOrderable, { input: await this.withOrgId(input) }),
    addCoupon: async (
      input: WithResolvedOrg<SdkAddCouponCodeMutationVariables['input']>,
    ) => this.execute(SdkAddCouponCode, { input: await this.withOrgId(input) }),
    get: (variables: WithoutOrg<SdkCartQueryVariables> = {}) =>
      this.execute(SdkCart, this.withOrg(variables)),
    markAsGift: async (
      input: WithResolvedOrg<SdkMarkCartItemAsGiftMutationVariables['input']>,
    ) =>
      this.execute(SdkMarkCartItemAsGift, { input: await this.withOrgId(input) }),
    remove: async (
      input: WithResolvedOrg<SdkRemoveCartOrderableMutationVariables['input']>,
    ) =>
      this.execute(SdkRemoveCartOrderable, {
        input: await this.withOrgId(input),
      }),
    removeCoupon: async (
      input: WithResolvedOrg<SdkRemoveCouponCodeMutationVariables['input']>,
    ) =>
      this.execute(SdkRemoveCouponCode, { input: await this.withOrgId(input) }),
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
    createOrder: async (
      input: WithResolvedOrg<
        SdkCreateOrderMutationVariables['input'] & { organizationId: string }
      >,
    ) => this.execute(SdkCreateOrder, { input: await this.withOrgId(input) }),
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

  /**
   * Discussion attached to a course's forum item.
   *
   * MODERATION IS VISIBLE IN THE RESULT. A forum can require approval
   * (`effectiveSettings.autoApprovePosts`), in which case a newly created post
   * comes back `PENDING` rather than approved — it exists, but no one else can
   * see it yet. Read `status` on what you get back and say so, or the author
   * watches their post fail to appear and writes it again.
   */
  readonly forum = {
    comment: (input: SdkCreateForumPostCommentMutationVariables['input']) =>
      this.execute(SdkCreateForumPostComment, { input }),
    /** A forum with a page of its posts, newest first. */
    get: (variables: SdkForumQueryVariables) =>
      this.execute(SdkForum, variables),
    post: (input: SdkCreateForumPostMutationVariables['input']) =>
      this.execute(SdkCreateForumPost, { input }),
    /** One post and a page of its comments — the thread view. */
    postDetail: (variables: SdkForumPostQueryVariables) =>
      this.execute(SdkForumPost, variables),
    /**
     * Vote on a post or a comment. `isPositive: null` REMOVES the reaction —
     * that is the toggle-off, not a third opinion.
     *
     * Whether a forum shows up/down or a single like is
     * `effectiveSettings.reactionType`; render from that rather than assuming,
     * and check `viewerCanReact` before showing the control at all.
     */
    reactToComment: (
      input: SdkUpdateForumPostCommentReactionMutationVariables['input'],
    ) => this.execute(SdkUpdateForumPostCommentReaction, { input }),
    reactToPost: (
      input: SdkUpdateForumPostReactionMutationVariables['input'],
    ) => this.execute(SdkUpdateForumPostReaction, { input }),
  };

  /**
   * Taking the course, once they own it.
   *
   * ACCESS IS THE SERVER'S DECISION, not yours. Every item carries
   * `viewerHasAccess`, and a gated item's payload comes back NULL — a video
   * item whose `video` is null means "not entitled", not "no video". Render
   * from those fields rather than deciding entitlement yourself; the API will
   * not hand you content the viewer has not earned, whatever your UI asks for.
   */
  readonly learn = {
    /**
     * Mint a download URL for an attachment. Items list their attachments by
     * name and size only — the file itself is never a static URL, because the
     * link is short-lived and minted per viewer.
     *
     * When the organization watermarks downloads, `url` comes back null and
     * `watermarkJob` is `PROCESSING` instead: the personalized copy is still
     * being made. Poll `attachmentWatermarkJob` until it is `READY` and use
     * the url it carries.
     */
    attachmentUrl: (input: SdkGetAttachmentUrlMutationVariables['input']) =>
      this.execute(SdkGetAttachmentUrl, { input }),
    /** Poll a watermark job started by `attachmentUrl`. */
    attachmentWatermarkJob: (
      variables: SdkAttachmentWatermarkJobQueryVariables,
    ) => this.execute(SdkAttachmentWatermarkJob, variables),
    /** Sections and their items for a term — the lesson list, one round trip. */
    curriculum: (variables: SdkCurriculumQueryVariables) =>
      this.execute(SdkCurriculum, variables),
    /** One item with its type-specific payload. */
    item: (variables: SdkCourseItemDetailQueryVariables) =>
      this.execute(SdkCourseItemDetail, variables),
    /**
     * Record progress. `progress` is a 0–1 fraction; `completed` marks the
     * item done regardless. Returns the updated record so a UI can re-render
     * without refetching the curriculum.
     */
    updateProgress: (
      input: SdkUpdateCourseItemProgressMutationVariables['input'],
    ) => this.execute(SdkUpdateCourseItemProgress, { input }),
  };

  /**
   * What the signed-in visitor owns. Needs a token via `getAccessToken` — with
   * none, `viewer` is null and both of these come back empty rather than
   * failing, because an anonymous visitor having no orders is not an error.
   */
  readonly me = {
    /**
     * Earned certificates, for the signed-in student.
     *
     * `status` defaults to ACTIVE when omitted, and `null` means ALL — which is
     * backwards from the guess. Omit it and a REVOKED certificate does not come
     * back as revoked, it simply disappears from the list, so the two fields
     * that describe that state (`status`, `revokedAt`) can never vary.
     */
    certificates: (variables: SdkViewerCertificatesQueryVariables = {}) =>
      this.execute(SdkViewerCertificates, variables),
    /** Enrolled course terms, with access source, expiry and progress. */
    enrollments: () => this.execute(SdkViewerEnrollments, {}),
    orders: (variables: SdkViewerOrdersQueryVariables = {}) =>
      this.execute(SdkViewerOrders, variables),
  };

  /**
   * Who the visitor is, and how they become someone.
   *
   * A successful login returns an ACCESS TOKEN — the SDK does not store it.
   * Persist it however your site persists sessions and hand it back through
   * the `getAccessToken` option; that separation is deliberate, because where
   * a token is kept is a decision only the host application can make safely.
   *
   * Pass `cartId` on either login and the anonymous cart the visitor filled
   * before signing in is carried onto their account, rather than disappearing
   * at the moment they commit to buying.
   */
  readonly session = {
    loginWithOtp: async (
      input: WithResolvedOrg<SdkLoginWithOtpMutationVariables['input']>,
    ) => this.execute(SdkLoginWithOtp, { input: await this.withOrgId(input) }),
    loginWithPassword: async (
      input: WithResolvedOrg<SdkLoginWithPasswordMutationVariables['input']>,
    ) =>
      this.execute(SdkLoginWithPassword, { input: await this.withOrgId(input) }),
    logout: () => this.execute(SdkLogout, {}),
    /** Sends the reset mail. Succeeds whether or not the address exists. */
    requestPasswordReset: async (
      input: WithResolvedOrg<SdkRequestPasswordResetMutationVariables['input']>,
    ) =>
      this.execute(SdkRequestPasswordReset, {
        input: await this.withOrgId(input),
      }),
    /** Completes a reset with the token from the mail, and signs them in. */
    resetPassword: (input: SdkResetPasswordMutationVariables['input']) =>
      this.execute(SdkResetPassword, { input }),
    /** Emails or texts a one-time code. No password required anywhere. */
    sendLoginOtp: async (
      input: WithResolvedOrg<SdkSendLoginOtpMutationVariables['input']>,
    ) => this.execute(SdkSendLoginOtp, { input: await this.withOrgId(input) }),
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
   * Fills in `organizationId` unless the caller supplied one.
   *
   * Generic over the ARGUMENT rather than the result: `Omit` is not
   * invertible, so a signature taking `WithResolvedOrg<T>` gives TypeScript
   * nothing to infer `T` from and every call collapses to the constraint.
   */
  private async withOrgId<T extends { organizationId?: OrganizationId }>(
    input: T,
  ): Promise<T & { organizationId: OrganizationId }> {
    return {
      ...input,
      organizationId: input.organizationId ?? (await this.organizationId()),
    };
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

  /**
   * The organization's id, resolved from the slug the client holds.
   *
   * Exposed because a few things genuinely need the raw id — building an
   * input by hand for `execute()`, for instance — and making callers
   * rediscover the lookup is how the id ended up threaded through every call
   * site in the first place.
   */
  async organizationId(): Promise<string> {
    this.organizationIdPromise ??= this.execute(SdkOrganizationIdBySlug, {
      slug: this.options.organizationSlug,
    })
      .then((result) => {
        if (!result.organization) {
          throw new TeachfluenceTransportError(
            `No organization is published at "${this.options.organizationSlug}". ` +
              'Check the slug, and that the key belongs to that organization.',
          );
        }

        return result.organization.id;
      })
      .catch((error: unknown) => {
        // Uncache on EVERY failure, not just the not-found one.
        //
        // `??=` never reassigns a slot that already holds a promise, so a
        // rejected one cached here is replayed for the life of the client —
        // and this lookup sits in front of `cart.*`, `checkout.createOrder`
        // and every `session.*` sign-in. A client is typically built once at
        // module scope in a customer's SPA, so a single network blip at page
        // load would leave the visitor unable to add to cart, sign in, or
        // check out until they hard-reloaded the tab.
        this.organizationIdPromise = null;

        throw error;
      });

    return this.organizationIdPromise;
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
