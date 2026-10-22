import type {
  SdkAddCartOrderableMutationVariables,
  SdkAddCouponCodeMutationVariables,
  SdkAttachmentWatermarkJobQueryVariables,
  SdkCartQueryVariables,
  SdkCatalogQueryVariables,
  SdkCoachingSessionQueryVariables,
  SdkCommunityCommentRepliesQueryVariables,
  SdkCommunityEventsQueryVariables,
  SdkCommunityFeedQueryVariables,
  SdkCommunityMemberDirectoryQueryVariables,
  SdkCommunityPostCommentsQueryVariables,
  SdkCommunityPostQueryVariables,
  SdkCommunityReactorsQueryVariables,
  SdkCommunitySpaceGroupsQueryVariables,
  SdkCommunitySpacePostsQueryVariables,
  SdkCommunitySpacesQueryVariables,
  SdkCompleteFreeOrderMutationVariables,
  SdkContentBlogQueryVariables,
  SdkCourseCustomFieldsQueryVariables,
  SdkCourseItemDetailQueryVariables,
  SdkCourseQueryVariables,
  SdkCreateCommunityAttachmentUploadMutationVariables,
  SdkCreateCommunityCommentMutationVariables,
  SdkCreateCommunityPostMutationVariables,
  SdkCreateDraftAssignmentSubmissionMutationVariables,
  SdkCreateForumPostCommentMutationVariables,
  SdkCreateForumPostMutationVariables,
  SdkCreateOrderMutationVariables,
  SdkCurriculumQueryVariables,
  SdkDeleteCommunityCommentMutationVariables,
  SdkDeleteCommunityPostMutationVariables,
  SdkDigitalProductQueryVariables,
  SdkFormQueryVariables,
  SdkForumPostQueryVariables,
  SdkForumQueryVariables,
  SdkGetAttachmentUrlMutationVariables,
  SdkJoinCommunitySpaceMutationVariables,
  SdkLeaveCommunitySpaceMutationVariables,
  SdkLiveEventQueryVariables,
  SdkLoginWithOtpMutationVariables,
  SdkLoginWithPasswordMutationVariables,
  SdkMarkCartItemAsGiftMutationVariables,
  SdkMarkCommunitySpaceReadMutationVariables,
  SdkOrderQueryVariables,
  SdkOrgSubscriptionProductsQueryVariables,
  SdkPublicCommunityEventQueryVariables,
  SdkPublicCommunityEventSeriesQueryVariables,
  SdkRemoveCartOrderableMutationVariables,
  SdkRemoveCouponCodeMutationVariables,
  SdkReportCommunityContentMutationVariables,
  SdkRequestPasswordResetMutationVariables,
  SdkResetPasswordMutationVariables,
  SdkRsvpToCommunityEventMutationVariables,
  SdkSendLoginOtpMutationVariables,
  SdkSetCommunityCommentReactionMutationVariables,
  SdkSetCommunityPostReactionMutationVariables,
  SdkSubmitAssignmentSubmissionMutationVariables,
  SdkSubmitFormQuestionsMutationVariables,
  SdkSubmitQuizMutationVariables,
  SdkSubscribeMailingListMutationVariables,
  SdkUpcomingCommunityEventSeriesQueryVariables,
  SdkUpcomingCommunityEventsQueryVariables,
  SdkUpdateAssignmentSubmissionMutationVariables,
  SdkUpdateCommunityCommentMutationVariables,
  SdkUpdateCommunityPostMutationVariables,
  SdkUpdateCourseItemProgressMutationVariables,
  SdkUpdateForumPostCommentReactionMutationVariables,
  SdkUpdateForumPostReactionMutationVariables,
  SdkUpdateVideoWatchStateMutationVariables,
  SdkVideoPlaybackQueryVariables,
  SdkVideoWatchStateQueryVariables,
  SdkViewerCertificatesQueryVariables,
  SdkViewerOrdersQueryVariables,
  SdkViewerOrgSubscriptionsQueryVariables
} from './__generated__/types.js';

import {
  SdkAddCartOrderable,
  SdkAddCouponCode,
  SdkAttachmentWatermarkJob,
  SdkCart,
  SdkCatalog,
  SdkCoachingSession,
  SdkCommunityCommentReplies,
  SdkCommunityEvents,
  SdkCommunityFeed,
  SdkCommunityMemberDirectory,
  SdkCommunityPost,
  SdkCommunityPostComments,
  SdkCommunityReactors,
  SdkCommunitySpaceGroups,
  SdkCommunitySpacePosts,
  SdkCommunitySpaces,
  SdkCompleteFreeOrder,
  SdkContentBlog,
  SdkCourse,
  SdkCourseCustomFields,
  SdkCourseItemDetail,
  SdkCreateCommunityAttachmentUpload,
  SdkCreateCommunityComment,
  SdkCreateCommunityPost,
  SdkCreateDraftAssignmentSubmission,
  SdkCreateForumPost,
  SdkCreateForumPostComment,
  SdkCreateOrder,
  SdkCurriculum,
  SdkDeleteCommunityComment,
  SdkDeleteCommunityPost,
  SdkDigitalProduct,
  SdkForm,
  SdkForum,
  SdkForumPost,
  SdkGetAttachmentUrl,
  SdkJoinCommunitySpace,
  SdkLeaveCommunitySpace,
  SdkLiveEvent,
  SdkLoginWithOtp,
  SdkLoginWithPassword,
  SdkLogout,
  SdkMarkCartItemAsGift,
  SdkMarkCommunitySpaceRead,
  SdkOrder,
  SdkOrganizationIdBySlug,
  SdkOrgSubscriptionProducts,
  SdkPublicCommunityEvent,
  SdkPublicCommunityEventSeries,
  SdkRemoveCartOrderable,
  SdkRemoveCouponCode,
  SdkReportCommunityContent,
  SdkRequestPasswordReset,
  SdkResetPassword,
  SdkRsvpToCommunityEvent,
  SdkSendLoginOtp,
  SdkSetCommunityCommentReaction,
  SdkSetCommunityPostReaction,
  SdkStartFormSession,
  SdkSubmitAssignmentSubmission,
  SdkSubmitFormQuestions,
  SdkSubmitQuiz,
  SdkSubscribeMailingList,
  SdkUpcomingCommunityEvents,
  SdkUpcomingCommunityEventSeries,
  SdkUpdateAssignmentSubmission,
  SdkUpdateCommunityComment,
  SdkUpdateCommunityPost,
  SdkUpdateCourseItemProgress,
  SdkUpdateForumPostCommentReaction,
  SdkUpdateForumPostReaction,
  SdkUpdateVideoWatchState,
  SdkVideoPlayback,
  SdkVideoWatchState,
  SdkViewerCertificates,
  SdkViewerEnrollments,
  SdkViewerOrders,
  SdkViewerOrgSubscriptions,
  SdkViewerSession
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
   * Where the same-origin proxy lives, for `transport: 'proxy'`. Relative on
   * purpose — an absolute origin here would make the request cross-origin and
   * the cookie would not be sent, which is the whole point of this transport.
   */
  proxyPath?: string;
  /**
   * How requests reach the API.
   *
   * `'direct'` (the default) posts to `baseUrl` and authenticates the visitor
   * with a bearer token from `getAccessToken`. In a browser it works from the
   * organization's own hosts — its platform subdomain and its verified custom
   * domain, which the API answers without credentials — and it is the only one
   * that works on that custom domain. From any other origin the browser is
   * refused; call the API from a server there instead.
   *
   * `'proxy'` posts to a SAME-ORIGIN path — `proxyPath` below — and lets the
   * browser carry the platform's own session cookie. Use it from a site bundle
   * we serve, where the visitor signed in at `/giris` on that very host: the
   * cookie is host-only by design, so it is present there and nowhere else, and
   * no token has to be stored or refreshed by the page.
   *
   * The key is still sent either way. It costs nothing and it holds the page to
   * the published operation list, which is the property that lets a customer's
   * own code share an origin with the platform at all.
   */
  transport?: 'direct' | 'proxy';
  /**
   * Called when a request is made without a session. Lets a host app supply a
   * token it manages itself (SSR forwarding a visitor's token, for example).
   */
  getAccessToken?: () => Promise<string | null> | string | null;
}

const DEFAULT_BASE_URL = 'https://api.teachfluence.com';
const DEFAULT_PROXY_PATH = '/api/proxy';
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
/**
 * `proxyPath` must be RELATIVE, and this refuses rather than documents it.
 *
 * An absolute one makes every call cross-origin, at which point two things
 * happen quietly: `credentials: 'same-origin'` stops sending the session cookie,
 * so the page renders signed-out with nothing on it to explain why — and the
 * publishable key IS still sent, to whatever origin was named. Neither failure
 * announces itself, which is what makes a comment an insufficient guard.
 */
function assertProxyPathIsRelative(proxyPath: string | undefined): void {
  if (proxyPath === undefined) return;

  // A leading-slash test alone is not enough. The WHATWG URL parser treats a
  // backslash as a path separator, and strips leading control characters and
  // whitespace before parsing, so `/\evil.com` and `/<TAB>/evil.com` BOTH resolve
  // to `https://evil.com/...` while passing a `startsWith('/')` check --
  // reaching the exact cross-origin leak the comment above says this refuses.
  // The web app has the same rule in `containsUnsafeUrlChars`; this package
  // cannot import from the app, so the class is restated rather than shared.
  //
  // Char codes rather than a regex: a literal control-character class is what
  // `no-control-regex` exists to flag, and naming the codes says which and why.
  const foldsIntoAuthority = [...proxyPath].some((character) => {
    const code = character.codePointAt(0) ?? 0;

    return character === '\\' || code <= 0x1F || code === 0x7F;
  });

  if (foldsIntoAuthority) {
    throw new TeachfluenceTransportError(
      `\`proxyPath\` must not contain backslashes or control characters (got ${JSON.stringify(proxyPath)}). ` +
        'The URL parser folds both into an authority, so the request would leave this origin: ' +
        'the session cookie is dropped and your publishable key is sent to that host.',
    );
  }
  if (!proxyPath.startsWith('/') || proxyPath.startsWith('//')) {
    throw new TeachfluenceTransportError(
      `\`proxyPath\` must be a relative path beginning with a single "/" (got ${JSON.stringify(proxyPath)}). ` +
        'An absolute origin makes the request cross-origin, which silently drops the session cookie ' +
        'and sends your publishable key to that origin.',
    );
  }
}

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
     * The organization's published content — blog posts, articles, help
     * pages, grouped by category. ACTIVE categories and PUBLISHED pages
     * only; the server never sends a DRAFT or ARCHIVED page to a
     * publishable key, so there is nothing to filter on your side.
     *
     * `renderMode` on each category is the platform's own public chrome
     * for it (`BLOG`, `ARTICLE`, `HELP_CENTER`) — use it to decide how to
     * lay a category out, or to pick out just the one you want:
     *
     * ```ts
     * const { organization } = await client.catalog.contentBlog();
     * const blog = organization?.contentTree.find((c) => c.slug === 'yazilar');
     * ```
     *
     * `body` is Markdown, already the PUBLISHED version — there is no
     * separate render step. A page behind an access gate the viewer has
     * not unlocked comes back with an empty `body`, not an error and not
     * the gated content; nothing here bypasses that.
     *
     * Categories nest, so each one also carries `children` — 4 levels deep
     * here, the same depth `src/content-pages/lib/queries.ts`'s sidebar
     * query in the main app uses ("more than enough for current structure
     * which maxes out at 2"). A category deeper than that is invisible to
     * this read, the same silent-drop this SDK's own README warns about for
     * `upcomingEvents`' `truncated` — if you're building on a category tree
     * that might nest deeper, walk `children` recursively rather than
     * assuming every post is a direct child of the root you asked for.
     */
    contentBlog: (variables: WithoutOrg<SdkContentBlogQueryVariables> = {}) =>
      this.execute(SdkContentBlog, this.withOrg(variables)),
    /**
     * A course is not itself orderable — its ACADEMIC TERMS are, which is why
     * the result carries them with their own prices and availability. Add a
     * term id to the cart, never the course id.
     */
    course: (variables: WithoutOrg<SdkCourseQueryVariables>) =>
      this.execute(SdkCourse, this.withOrg(variables)),
    /**
     * The course's custom fields — the record an admin filled in: publisher,
     * page count, a link out, whatever that organization decided a course has.
     *
     * A SEPARATE round trip from `course`, deliberately. Adding these fields to
     * `SdkCourse` would change that document's bytes, and the id is sha256 of
     * the bytes — every storefront already deployed against the old id would
     * start getting NOT_PERSISTED. Additive costs a request; editing costs an
     * outage on sites we do not control.
     *
     * ONLY PUBLIC FIELDS COME BACK to a publishable key — not by client-side
     * filtering. `OrganizationCustomFieldService.getEntityCustomFieldValues`
     * (backend) picks the definition set from the caller's permissions, and an
     * org-API-key request never carries a session user, so it always resolves
     * to the PUBLIC set; a PRIVATE or HIDDEN field's value is never fetched,
     * let alone sent. That gate is general-purpose and predates this
     * operation — backend#700 allowlisted `courseCustomFields` on the strength
     * of it, the same PR that added a dedicated one for `subscriptionProducts`
     * below. `fieldDefinition.visibility` in the response therefore always
     * reads `PUBLIC` here; it stays selected for parity with the admin-facing
     * shape, not because it can vary in this response.
     */
    courseCustomFields: (
      variables: WithoutOrg<SdkCourseCustomFieldsQueryVariables>,
    ) => this.execute(SdkCourseCustomFields, this.withOrg(variables)),
    digitalProduct: (variables: WithoutOrg<SdkDigitalProductQueryVariables>) =>
      this.execute(SdkDigitalProduct, this.withOrg(variables)),
    /**
     * ONE community event, for an event page on your own site — the same
     * masked preview the platform's public share page renders.
     *
     * Pass the `id` an `upcomingEvents` teaser (or a series' `nextOccurrence` /
     * `upcomingOccurrences` entry) came back with. Masking is done by the
     * SERVER, exactly as for `upcomingEvents`: a members-only event exposes no
     * description, image or address, and `recordingVideo` is null unless the
     * organizer published the recording to visitors. There is no join link at
     * any access level: a signed-in member reads `meetingUrl` from
     * `community.events`, which checks the caller first.
     *
     * Unlike `upcomingEvents` this also answers for an event that has already
     * finished or was cancelled (`isCancelled`), so a link you shared never
     * dead-ends. `null` means the event does not exist, is not published to
     * visitors, or belongs to another organization — answer it with a 404.
     *
     * `series` is set when the event is one date of a recurring series; pass
     * its `id` to `eventSeries` for the rest of the dates.
     */
    event: (variables: WithoutOrg<SdkPublicCommunityEventQueryVariables>) =>
      this.execute(SdkPublicCommunityEvent, this.withOrg(variables)),
    /**
     * ONE recurring community-event series: its rhythm (`recurrence`), its
     * next date, and up to 10 dates ahead (`upcomingOccurrences`), for a
     * "every Wednesday at 20:00" page on your own site.
     *
     * Pass the `id` an `upcomingEventSeries` entry came back with, or an
     * event's `series.id`. The same server-side masking as `event`. A finished
     * series still answers, with `hasEnded: true`, a null `nextOccurrence` and
     * no upcoming dates — say the run is over rather than treating it as
     * missing. `null` means the series does not exist, is not published to
     * visitors, or belongs to another organization.
     *
     * `upcomingOccurrences` stops at 10 dates; `upcomingOccurrenceCount` says
     * how many there are. Each date's `id` opens it with `event`.
     */
    eventSeries: (
      variables: WithoutOrg<SdkPublicCommunityEventSeriesQueryVariables>,
    ) => this.execute(SdkPublicCommunityEventSeries, this.withOrg(variables)),
    /** Courses, bundles, digital products and live events in one round trip. */
    list: (variables: WithoutOrg<SdkCatalogQueryVariables> = {}) =>
      this.execute(SdkCatalog, this.withOrg(variables)),
    liveEvent: (variables: WithoutOrg<SdkLiveEventQueryVariables>) =>
      this.execute(SdkLiveEvent, this.withOrg(variables)),
    /**
     * Membership: the organization's subscription products, their tiers, and
     * what each tier costs per interval.
     *
     * Only ACTIVE products reach a publishable key. DRAFT is unreleased pricing
     * and ARCHIVED is a price deliberately withdrawn; the server decides that
     * from the caller's permissions, so a storefront cannot ask for them and
     * does not have to remember to hide them.
     *
     * A tier is an `Orderable` — `viewerCanOrder` and `salesPaused` tell you
     * whether to render a buy action, and the tier id is what goes in the cart.
     *
     * `first` accepts 1–100. Outside that range the connection validator does
     * not throw — it warns server-side and answers `EMPTY_CONNECTION`, a
     * normal HTTP 200 whose `totalCount` is a hardcoded 0, indistinguishable
     * from "this org has no products." Keep it in range rather than relying on
     * an error to catch a bad value.
     */
    subscriptionProducts: (
      variables: WithoutOrg<SdkOrgSubscriptionProductsQueryVariables> = {},
    ) => this.execute(SdkOrgSubscriptionProducts, this.withOrg(variables)),
    /**
     * Upcoming community events — real-time, not a snapshot.
     *
     * Masked previews: a members-only event never exposes its description or
     * image to a caller who cannot see them, and a subscription-gated one shows
     * enough to justify joining without showing the content itself. That
     * masking happens on the SERVER, so there is nothing to hide client-side.
     *
     * The window is capped at 92 days by the API; ask for a narrower one if you
     * only need this month.
     *
     * `null` means the read could not be answered — an unknown organization, a
     * window wider than the cap, the org's community not switched on, or too
     * many requests — and is DIFFERENT from an empty list, which means nothing
     * is scheduled. Do not treat the two the same, and do not cache a null as
     * "runs nothing".
     *
     * `truncated` is a separate signal from that null/empty distinction, and
     * the API's own schema says a caller MUST act on it: the window can hold
     * more events than `limit`, and when it does, the extra ones are simply
     * absent from `teasers` — `truncated` is the only way to know they exist.
     * Tell the reader when it's true (e.g. "and more — narrow the dates to see
     * them"); do not render `teasers` alone and assume that's everything.
     *
     * Read `hostNames`, not `hostName`. The singular is the FIRST of the list
     * by the schema's own words, so a card built from it advertises one
     * instructor for a co-taught class and drops the rest — the defect this
     * field was added to fix. Join the list with `Intl.ListFormat`, since the
     * conjunction is language-specific — and check the result before rendering
     * it: an event nobody hosts publicly comes back with an empty list, which
     * formats to `''`.
     */
    upcomingEvents: (
      variables: WithoutOrg<SdkUpcomingCommunityEventsQueryVariables>,
    ) => this.execute(SdkUpcomingCommunityEvents, this.withOrg(variables)),
    /**
     * Upcoming recurring community events — one entry per SERIES rather than
     * per date, for a "every Wednesday at 20:00" card beside `upcomingEvents`.
     *
     * Each series carries its rhythm (`recurrence`), its next date
     * (`nextOccurrence`) and how many dates it has in the window
     * (`upcomingOccurrenceCount`). `recurrence` is null when the pattern
     * cannot be described in those terms, and `nextOccurrence` is null once
     * the series has no date left to show — check `hasEnded` rather than
     * reading a null as "not scheduled yet". Clock times are in the
     * organizer's `timezone`.
     *
     * The same contract as `upcomingEvents` otherwise: a window of at most 92
     * days, the same server-side masking, `null` for a read that could not be
     * answered (never the same as an empty list), and `truncated` when the
     * window held more series than `limit` — tell the reader when it is true.
     */
    upcomingEventSeries: (
      variables: WithoutOrg<SdkUpcomingCommunityEventSeriesQueryVariables>,
    ) =>
      this.execute(SdkUpcomingCommunityEventSeries, this.withOrg(variables)),
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
   * The organization's community: its spaces, the posts in them, and the
   * gatherings they hold.
   *
   * NEEDS A SIGNED-IN MEMBER. A key alone is not a person — it carries no
   * identity and no permissions — so every read here answers the anonymous
   * shape (empty, or null) without one. That is not an error: an organization's
   * community is not public, and the server says so by answering nothing rather
   * than by failing.
   *
   * WHICH TRANSPORT. On a page WE serve, use `transport: 'proxy'`: the visitor
   * signed in at `/giris` on that very host, the session cookie is host-only, and
   * the browser carries it for you. Anywhere else, sign in through
   * `session.loginWithOtp` / `loginWithPassword` and let `getAccessToken` supply
   * the bearer token — the API does not grant credentials to an origin it does
   * not serve, so a cookie cannot work there.
   *
   * WHAT A VIEWER MAY DO IS THE SERVER'S ANSWER, not yours. Every space and post
   * carries its own `viewerCan…` fields; render the composer, the reply box and
   * the reaction control from those rather than deciding from a role you
   * inferred. A space can be readable and closed to writing — an archived one
   * always is.
   */
  readonly community = {
    /** Write a comment, or a reply when `parentCommentId` is set. One level deep. */
    comment: (input: SdkCreateCommunityCommentMutationVariables['input']) =>
      this.execute(SdkCreateCommunityComment, { input }),
    /**
     * One comment's replies, a page at a time.
     *
     * SEPARATE from the comment list on purpose. Replies used to ride along
     * inside it, twenty per comment, and the query priced past the server's
     * ceiling and was refused outright above four comments. Call this when a
     * reader opens a thread, not before.
     */
    commentReplies: (variables: SdkCommunityCommentRepliesQueryVariables) =>
      this.execute(SdkCommunityCommentReplies, variables),
    /**
     * Upload a file to attach to a post.
     *
     * Two steps, and this is the first: it returns a one-time `apiUrl` plus the
     * `formFields` to POST the bytes to, and an `s3Key` to pass back inside the
     * post's `attachments`. The file is not readable until it has cleared
     * scanning — `scanStatus` on the attachment says when.
     */
    createAttachmentUpload: (
      input: SdkCreateCommunityAttachmentUploadMutationVariables['input'],
    ) => this.execute(SdkCreateCommunityAttachmentUpload, { input }),
    /**
     * Post to a space.
     *
     * `content` is the rich-text document, not a string: a list of blocks, with
     * a mention written as its own inline node (`{type:'mention', studentId}`) —
     * that node is what turns into a notification for the person named, and no
     * other node does. Refused, never trimmed, past 64 KB / 20 000 characters /
     * 500 blocks / 20 mentions.
     *
     * A space can hold a post for review. Read `status` on what comes back and
     * say so, or the author watches their post fail to appear and writes it
     * again.
     */
    createPost: (input: SdkCreateCommunityPostMutationVariables['input']) =>
      this.execute(SdkCreateCommunityPost, { input }),
    /** Remove a comment. Render the affordance from `viewerCanDelete`, not from authorship. */
    deleteComment: (input: SdkDeleteCommunityCommentMutationVariables['input']) =>
      this.execute(SdkDeleteCommunityComment, { input }),
    /** Remove a post. Render the affordance from `viewerCanDelete`, not from authorship. */
    deletePost: (input: SdkDeleteCommunityPostMutationVariables['input']) =>
      this.execute(SdkDeleteCommunityPost, { input }),
    /**
     * Gatherings the viewer can reach, soonest first.
     *
     * `remainingCapacity` is null both when there is no cap and when this
     * organization does not show turnout to the viewer — read `rsvpLimit` to
     * tell those apart, and `isFull` to say "kontenjan doldu" either way.
     */
    events: (variables: WithoutOrg<SdkCommunityEventsQueryVariables>) =>
      this.execute(SdkCommunityEvents, this.withOrg(variables)),
    /** Posts from every space the viewer can read, newest first by default. */
    feed: async (variables: WithResolvedOrg<SdkCommunityFeedQueryVariables>) =>
      this.execute(SdkCommunityFeed, await this.withOrgId(variables)),
    /** Join a space the viewer may join. Check `viewerCanJoin` first. */
    joinSpace: (input: SdkJoinCommunitySpaceMutationVariables['input']) =>
      this.execute(SdkJoinCommunitySpace, { input }),
    leaveSpace: (input: SdkLeaveCommunitySpaceMutationVariables['input']) =>
      this.execute(SdkLeaveCommunitySpace, { input }),
    /**
     * Move the viewer's read marker, which is what clears the unread count.
     *
     * Send the moment the feed was rendered, not `Date.now()` at the end of a
     * scroll: the marker only ever moves forward, and a later timestamp would
     * swallow posts that arrived while the page was open.
     */
    markSpaceRead: (input: SdkMarkCommunitySpaceReadMutationVariables['input']) =>
      this.execute(SdkMarkCommunitySpaceRead, { input }),
    /** People in a space, for a mention picker. Null when the roster is withheld. */
    memberDirectory: (variables: SdkCommunityMemberDirectoryQueryVariables) =>
      this.execute(SdkCommunityMemberDirectory, variables),
    /**
     * One post — the permalink view. WITHOUT its comments.
     *
     * Comments are `postComments` and replies are `commentReplies`, three
     * operations rather than one, because one query for all three is what
     * priced past the server's ceiling and got refused.
     */
    post: (variables: SdkCommunityPostQueryVariables) =>
      this.execute(SdkCommunityPost, variables),
    /** A post's comments, a page at a time. Replies are `commentReplies`. */
    postComments: (variables: SdkCommunityPostCommentsQueryVariables) =>
      this.execute(SdkCommunityPostComments, variables),
    /**
     * Who reacted to a post, a comment or a chat message, newest first, with
     * the reaction each person left — pass the item's id as `nodeId`, and
     * `kind` to list one reaction only. At most 50 a page.
     *
     * `reactors` is NULL, not empty, when the viewer may not see who reacted —
     * they are not signed in or not a member of the community, the item is
     * deleted or they may not see it yet, or the organization shows member
     * identities to its team only — and when the arguments are invalid, such
     * as asking for more than 50 at once. Show the counts from `reactions`
     * then, and no names. Empty means nobody reacted. The `node` itself is
     * null when the item is gone or no longer visible to the viewer. A null
     * `node` on an edge is a former member. The feed, post and comment reads
     * already carry the newest reactor, for an "Ayşe and 3 others" line.
     */
    reactors: (variables: SdkCommunityReactorsQueryVariables) =>
      this.execute(SdkCommunityReactors, variables),
    /** Flag a post or a comment for a moderator. */
    report: (input: SdkReportCommunityContentMutationVariables['input']) =>
      this.execute(SdkReportCommunityContent, { input }),
    /** Answer a gathering. Check `viewerCanRsvp`, which also covers capacity. */
    rsvp: (input: SdkRsvpToCommunityEventMutationVariables['input']) =>
      this.execute(SdkRsvpToCommunityEvent, { input }),
    /**
     * React to a post or a comment. `active: false` takes the reaction back —
     * that is the toggle-off, not a second opinion.
     */
    setCommentReaction: (
      input: SdkSetCommunityCommentReactionMutationVariables['input'],
    ) => this.execute(SdkSetCommunityCommentReaction, { input }),
    setPostReaction: (
      input: SdkSetCommunityPostReactionMutationVariables['input'],
    ) => this.execute(SdkSetCommunityPostReaction, { input }),
    /** The space groups, for a sidebar that mirrors the organization's own shelf. */
    spaceGroups: async (
      variables: WithResolvedOrg<SdkCommunitySpaceGroupsQueryVariables>,
    ) => this.execute(SdkCommunitySpaceGroups, await this.withOrgId(variables)),
    /**
     * One space with its pinned strip and a page of its posts.
     *
     * `sort: COMMENT_COUNT_DESC` is the "most discussed" tab. Its ordering
     * counts every comment a post has — replies, and comments held for review —
     * which is deliberately more than the number shown on a card, so the order
     * will not always match those numbers read top to bottom.
     *
     * `authorRole: MODERATOR` is the "from the organizers" tab: it covers the
     * organization's team whether or not they joined the space.
     */
    spacePosts: (variables: SdkCommunitySpacePostsQueryVariables) =>
      this.execute(SdkCommunitySpacePosts, variables),
    /** Every space the viewer can see, with their own unread counts. */
    spaces: async (variables: WithResolvedOrg<SdkCommunitySpacesQueryVariables>) =>
      this.execute(SdkCommunitySpaces, await this.withOrgId(variables)),
    /** Edit a comment. Render the affordance from `viewerCanEdit`, not from authorship. */
    updateComment: (input: SdkUpdateCommunityCommentMutationVariables['input']) =>
      this.execute(SdkUpdateCommunityComment, { input }),
    /** Edit a post. Render the affordance from `viewerCanEdit`, not from authorship. */
    updatePost: (input: SdkUpdateCommunityPostMutationVariables['input']) =>
      this.execute(SdkUpdateCommunityPost, { input }),
    /**
     * The viewer's memberships of this organization — tier, status, whether
     * each one grants access, and the add-a-card notice.
     *
     * Empty for a visitor who is not signed in, and empty for one who holds no
     * membership; both mean "not a member". The list also carries memberships
     * that grant nothing (one awaiting its first payment, one past due with no
     * grace period running — such as a trial whose first charge failed), so a
     * gated page counts only those with `grantsAccess` — the answer the
     * platform's own gates give — and never decides from `status`. Read the
     * tier rather than a price to decide what to show.
     *
     * `renewalCardNotice` is non-null while a membership will not renew on its
     * own and the member can keep it going by adding a card: show it from
     * `showFrom` until `endsAt`, and offer a dismiss only when `dismissible`.
     * The platform has already applied the organization's setting and timing,
     * so a site shows the notice whenever it is present rather than re-deriving
     * when. `canConvertToPaid` says whether subscribing to a paid plan of the
     * same product would carry what is left of the period over as a free trial.
     */
    viewerSubscriptions: (
      variables: WithoutOrg<SdkViewerOrgSubscriptionsQueryVariables>,
    ) => this.execute(SdkViewerOrgSubscriptions, this.withOrg(variables)),
  };

  /**
   * The customer's own forms — reading one, and answering it.
   *
   * ANONYMOUS BY DESIGN. A contact or lead-capture form is filled by someone
   * who has no account, so `submit` never requires a signed-in viewer.
   *
   * THE SESSION TOKEN IS NOT YOURS TO CARRY. `startFormSession` mints a
   * high-entropy `anonAccessToken`, and every later call against that session
   * must present it as `x-form-session-token` — without it the session id stops
   * being a bearer token and the backend refuses. `submit` starts the session
   * and answers it in one call, holding the token in a local for the duration,
   * so it never reaches the caller, a store, or a log. That is also why there is
   * no public `startSession`: handing out a session id without its token gives
   * the caller something that looks usable and is not.
   */
  readonly forms = {
    /** A form and its questions, by slug. Public — no session, no viewer. */
    get: (variables: WithoutOrg<SdkFormQueryVariables>) =>
      this.execute(SdkForm, this.withOrg(variables)),

    /**
     * Answer a form in one call: start a session, submit, done.
     *
     * `submissions` are `{ formQuestionId, answer }` — take the ids from
     * `forms.get`, never hard-code them, since a question edited in the admin
     * gets a new id and a stale id is silently dropped rather than refused.
     */
    submit: async (input: {
      formId: string;
      submissions: SdkSubmitFormQuestionsMutationVariables['input']['submissions'];
      /**
       * Where the visitor came from, passed straight through to the session.
       *
       * Optional, but on a lead-capture form it is the half marketing actually
       * reports on — and with no public `startSession`, there would otherwise
       * be no route to these fields short of dropping to `execute`.
       */
      attribution?: {
        browsingSessionId?: string;
        referrer?: string;
        utmCampaign?: string;
        utmMedium?: string;
        utmSource?: string;
      };
      sendResponseCopyToEmail?: string;
    }) => {
      const started = await this.execute(SdkStartFormSession, {
        input: {
          ...input.attribution,
          formId: input.formId,
          organizationId: await this.organizationId(),
        },
      });

      const session = started.startFormSession?.formSession;

      if (!session) {
        // No `throwIfUserErrors` here: `execute` already ran it on this
        // result, and it scans one level deep — exactly where
        // `startFormSession.userErrors` sits. A refusal has therefore already
        // surfaced as a `TeachfluenceUserError` carrying the server's own
        // message. Reaching this line means the mutation returned neither a
        // session nor an error.
        throw new TeachfluenceOperationError(
          'startFormSession returned no session.',
          { errors: [], operationId: SdkStartFormSession.id },
        );
      }

      const token = started.startFormSession?.anonAccessToken;

      return this.execute(
        SdkSubmitFormQuestions,
        {
          input: {
            formSessionId: session.id,
            sendResponseCopyToEmail: input.sendResponseCopyToEmail,
            submissions: input.submissions,
          },
        },
        // Absent for a SIGNED-IN viewer, whose own credential already
        // authorises the session — so this is conditional, not guaranteed.
        token ? { formSessionToken: token } : undefined,
      );
    },
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
   * The organization's mailing lists — a newsletter or waitlist signup.
   *
   * ANONYMOUS BY DESIGN, like `forms`: the visitor gives an address and
   * nothing else, and needs no account.
   *
   * WHICH LIST. Only a PUBLIC, ACTIVE list of the organization your key
   * belongs to accepts a subscriber. Any other id — a private list, another
   * organization's list, a deleted one, a typo — is refused with the same
   * `NOT_FOUND`, deliberately indistinguishable, so do not try to tell them
   * apart; check the list's settings instead. A public list that has been
   * switched off answers `UNAUTHORIZED` ("not active"). The id may be the
   * list's GraphQL id or the plain id the Teachfluence tools hand you when
   * they create it.
   *
   * CONSENT. `legalDocumentIds` are the published legal documents (a privacy
   * notice, marketing consent) the visitor accepted beside the address —
   * recorded against them, with the time and their IP. Only send ids the
   * visitor actually ticked; a box you pre-tick is not consent. An id that is
   * not a PUBLISHED document of the list's organization refuses the whole
   * signup (`NOT_FOUND`, field `legalDocumentIds` and its index) rather than
   * subscribing the address with no consent on record.
   *
   * RESOLVES WITH NOTHING. A signup is answered by whether it threw: a refusal
   * is a `TeachfluenceUserError`, and resolving means the address is on the
   * list. Nothing about the subscription comes back — not an id, not a date —
   * because this runs for any address anyone types, and "already subscribed,
   * since March" is exactly what a stranger should not be able to learn.
   *
   * ONE ADDRESS AT A TIME, and throttled per address and per visitor IP: a
   * `RATE_LIMITED` refusal carries when to try again. Nothing here imports a
   * list — that is the admin's job, not a page's.
   *
   * No `customFields`, although the schema declares them: the server does not
   * record them yet, so accepting them here would drop a visitor's answers
   * while reporting success. When the signup needs more than an address, use a
   * form (`forms.submit`) whose submission adds the respondent to the list.
   */
  readonly mailingLists = {
    subscribe: async (
      input: Pick<
        SdkSubscribeMailingListMutationVariables['input'],
        'email' | 'legalDocumentIds' | 'mailingListId'
      >,
    ): Promise<void> => {
      // `execute` throws on any `userErrors`, which is the only thing the
      // operation selects — so reaching the end of this call IS the success.
      await this.execute(SdkSubscribeMailingList, {
        // Rebuilt field by field rather than spread: a caller's object that
        // carries extra keys (an untyped form handler, `customFields` among
        // them) would otherwise ride through to the server unchecked.
        input: {
          email: input.email,
          legalDocumentIds: input.legalDocumentIds,
          mailingListId: input.mailingListId,
        },
      });
    },
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

  /**
   * Where the signed-in viewer stopped in a video, so a player can resume
   * there on the next visit.
   *
   * For a video OUTSIDE a course — a community event's recording, a video on a
   * page. A lesson's video is tracked per course item by
   * `learn.updateProgress`, and `updateWatchState` refuses one, so a video
   * never carries two progress numbers.
   *
   * SIGNED-IN ONLY. The state is private to its owner: `watchState` answers
   * `viewerWatchState: null` for a visitor who is not signed in, for a video
   * they have never played or may not watch, and for a lesson's video — so
   * null alone does not tell those apart (`session.viewer` says whether
   * anyone is signed in). `node` is null only for an id that does not exist.
   * `updateWatchState` refuses with a `TeachfluenceUserError`: UNAUTHENTICATED,
   * NOT_FOUND (no such video, or not theirs to watch), INVALID (a lesson's
   * video, or input out of range) or RATE_LIMITED.
   *
   * `progress` is a 0–1 fraction, not a percentage, and `completed: true`
   * reports reaching the end. A lower `progress` is taken as a correction: a
   * video that counts as watched only because its position crossed the
   * completion threshold goes back to IN_PROGRESS. So once a video counts as
   * watched — COMPLETED when the player opened, or in a write's answer — a
   * player should report nothing partial for it until it ends again, and
   * should send `completed: true` rather than a bare `progress: 1` near the
   * end.
   *
   * Pass `{ keepalive: true }` for the report sent as the visitor leaves the
   * page, so the write is not cancelled with it. It covers the request only:
   * an asynchronous `getAccessToken` still runs first, and a page closed
   * during it sends nothing.
   */
  readonly videos = {
    /**
     * A video's playable address for this visitor: `url` (HLS), or
     * `externalUrl` for an external source, with `posterUrl` and `source`.
     * `url` is null while the video is not ready, for a protected video, and
     * for a visitor the platform does not let watch it; `node` is null for no
     * such video.
     */
    playback: (variables: SdkVideoPlaybackQueryVariables) =>
      this.execute(SdkVideoPlayback, variables),
    updateWatchState: (
      input: SdkUpdateVideoWatchStateMutationVariables['input'],
      init?: { keepalive?: boolean },
    ) => this.execute(SdkUpdateVideoWatchState, { input }, init),
    watchState: (variables: SdkVideoWatchStateQueryVariables) =>
      this.execute(SdkVideoWatchState, variables),
  };

  constructor(options: TeachfluenceClientOptions) {
    assertKeyIsSafeForEnvironment(options.apiKey);

    assertCheckoutOriginIsResolvable(options);
    assertProxyPathIsRelative(options.proxyPath);

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
    init?: {
      /**
       * The anonymous form-session token, for a call against a session started
       * by `forms.submit`.
       *
       * A NAMED FIELD, not a headers bag. An arbitrary `Record<string, string>`
       * merged into the header object had two problems: the spread's position
       * decided whether a caller could displace `X-Teachfluence-Org`, and
       * object keys are case-SENSITIVE while header names are not — so a
       * lowercase `x-org-api-key` would survive as a second key and `Headers`
       * would join the two with `", "`. One typed field has neither failure
       * mode, and the token is the only thing that ever needed to pass through.
       */
      formSessionToken?: string;
      /**
       * Let the request outlive the page — for a write sent as the visitor
       * leaves it, such as `videos.updateWatchState` on `visibilitychange`.
       * Applies to the fetch, not to an asynchronous `getAccessToken` awaited
       * before it.
       */
      keepalive?: boolean;
      signal?: AbortSignal;
    },
  ): Promise<TResult> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Teachfluence-Org': this.options.organizationSlug,
    };

    // Set, not spread: nothing a caller passes can collide with a fixed header
    // because the only thing they can pass is this.
    if (init?.formSessionToken) {
      headers['x-form-session-token'] = init.formSessionToken;
    }
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
      const viaProxy = this.options.transport === 'proxy';

      response = await this.doFetch(
        viaProxy
          ? `${(this.options.proxyPath ?? DEFAULT_PROXY_PATH).replace(/\/+$/, '')}/graphql`
          : `${this.baseUrl}/graphql`,
        {
          body: JSON.stringify({
            documentId: operation.id,
            variables,
          }),
          // Only on the proxy transport, and `same-origin` rather than
          // `include`: the proxy path is relative, so `include` could only ever
          // matter if someone made it absolute — at which point the request is
          // cross-origin, the API strips the credential on the way out, and the
          // page would look signed-out for reasons nothing on it explains.
          ...(viaProxy ? { credentials: 'same-origin' as const } : {}),
          headers,
          // Only when asked: an injected fetch may test for the key, not its value.
          ...(init?.keepalive ? { keepalive: true } : {}),
          method: 'POST',
          signal: init?.signal,
        },
      );
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
