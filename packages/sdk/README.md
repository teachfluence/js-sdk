# @teachfluence/sdk

Build your own frontend on Teachfluence — with the platform still handling
payments, access control and product pages.

```bash
npm install @teachfluence/sdk
```

```ts
import { TeachfluenceClient } from '@teachfluence/sdk';

const client = new TeachfluenceClient({
  organizationSlug: 'your-org',
  apiKey: process.env.TEACHFLUENCE_PUBLISHABLE_KEY, // tf_pk_…
});
```

## Keys

Two kinds, and the difference matters.

| | Where it lives | What it grants |
|---|---|---|
| `tf_pk_…` publishable | Your client bundle | Nothing an anonymous visitor could not already do |
| `tf_sk_…` secret | Your server only | Organization-wide reads **and site deploys** — it can replace what your website serves |

A publishable key is **public by construction** — anyone who loads your site can
read it. Treat it as an origin hint, never as a secret.

Passing a `tf_sk_` key to the SDK in a browser throws immediately rather than
shipping to production and being scraped.

## Where it runs

In a browser, the API answers pages on your organization's own hosts: its
Teachfluence subdomain (`your-org.teachfluence.com`, including bundle previews)
and its verified custom domain. A page on any other origin (`localhost`, a
preview deployment elsewhere, a domain still being verified) is refused by the
browser. From there, call the API from your server, or work against a bundle
deployed with the CLI.

## Catalog

```ts
const { organization } = await client.catalog.list({ first: 20 });

for (const { node } of organization?.courses.edges ?? []) {
  console.log(node.title, node.slug);
}
```

One round trip returns courses, bundles, digital products and live events.
Detail lookups take a slug:

```ts
const { course } = await client.catalog.course({ slug: 'react-101' });
```

**A course is not the thing you sell.** Its *academic terms* are — that is what
carries a price, a capacity and its own availability, and it is a term id you
put in the cart:

```ts
const term = course?.academicTerms[0];

if (term?.viewerCanOrder) {
  console.log(term.sellingPrice?.amount, term.sellingPrice?.currency);
}
```

`client.catalog` also has `digitalProduct`, `liveEvent` and `coachingSession`.
The organization slug comes from the client, so you never repeat it — and
neither is the organization **id** something you need to fetch and thread
through every call. The client resolves it once from the slug and reuses it.
Pass `organizationId` explicitly if you already have it.

### The course's own record

Whatever your organization decided a course has — publisher, page count, a link
out, a level — lives in custom fields, and `courseCustomFields` reads them.

```ts
const { course } = await client.catalog.courseCustomFields({ slug: 'odysseia' });

const record = Object.fromEntries(
  (course?.customFieldValues ?? []).map((f) => [f.fieldDefinition.title, f.value]),
);

console.log(record['Yayınevi'], record['Sayfa Sayısı']);
```

**Only fields marked `PUBLIC` come back to a publishable key.** The server picks
the definition set from the caller's permissions — an API-key request never
carries a session user, so it always resolves to the `PUBLIC` set — and a
`PRIVATE` or `HIDDEN` field is not filtered out on your side, it is never sent.
You do not have to remember to hide anything. That gate is general-purpose and
predates this operation; `backend#700` allowlisted `courseCustomFields` on the
strength of it, the same PR that added a dedicated gate for the subscription
products read below. `fieldDefinition.visibility` in the response above will
therefore always read `PUBLIC` — kept selected for parity with the
admin-facing shape, not because it can vary here.

It is a **separate round trip** from `catalog.course`, which is a deliberate
trade rather than an oversight: an operation's id is the hash of its text, so
adding these fields to the `course` document would retire the id every already
deployed storefront has baked into its bundle. Run the two in parallel when you
need both.

```ts
const [{ course }, { course: record }] = await Promise.all([
  client.catalog.course({ slug: 'odysseia' }),
  client.catalog.courseCustomFields({ slug: 'odysseia' }),
]);
```

### Blog and content pages

```ts
const { organization } = await client.catalog.contentBlog();

const blog = organization?.contentTree.find((category) => category.slug === 'yazilar');

for (const page of blog?.pages ?? []) {
  console.log(page.title, page.publishedAt, page.body);
}
```

Every category on the tree is `ACTIVE` and every page on it is `PUBLISHED` —
the server never sends a `DRAFT` or `ARCHIVED` page to a publishable key, so
there's nothing to filter for on your side. `renderMode` (`BLOG`, `ARTICLE`,
`HELP_CENTER`) is the platform's own public chrome for that category; use it
to decide how to lay a section out, or just to pick the one you want, as
above.

`body` is Markdown, already the published version. A page behind an access
gate the viewer hasn't unlocked comes back with an **empty** `body`, not an
error and not the gated content — that's enforced on the server, so render an
empty body as "you don't have access" rather than treating it as a loading
state or a missing page.

**Categories nest, and a post can live under a subcategory.** Each category
carries `children`, populated 4 levels deep — the same depth the platform's
own admin sidebar query uses. A category nested deeper than that comes back
empty, silently: no error, just missing posts. `blog?.pages` above only
covers direct children of the category you found; walk `children`
recursively if you're not certain every post is a direct child of the root.

## Membership

Subscription products, their tiers, and what each tier costs per interval.

```ts
const { organization } = await client.catalog.subscriptionProducts();

for (const { node: product } of organization?.orgSubscriptionProducts.edges ?? []) {
  for (const tier of product.tiers) {
    const monthly = tier.pricing.find((p) => p.interval === 'MONTHLY');

    console.log(product.name, tier.name, monthly?.sellingPrice, monthly?.currency);
  }
}
```

**Only ACTIVE products reach a publishable key.** DRAFT is pricing you have not
announced and ARCHIVED is pricing you withdrew; the server decides that from the
caller's permissions, so your storefront cannot ask for them by mistake and does
not have to remember to hide them.

A tier is an `Orderable`, so `viewerCanOrder` and `salesPaused` tell you whether
to render a buy action — and the **tier** id is what goes in the cart, never the
product id.

```ts
await client.cart.add({ orderableId: tier.id });
```

Reading this rather than hardcoding the amount is the point: a price typed into
your own source keeps quoting the old number after you change it in admin, and
nothing tells you.

`first` accepts 1–100. Outside that range the connection validator does not
throw — it warns server-side and answers `EMPTY_CONNECTION`, a normal HTTP 200
whose `totalCount` is a hardcoded 0, indistinguishable from "this org has no
products." Keep it in range rather than relying on an error to catch a bad
value.

## Upcoming community events

```ts
const now = new Date();
const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

const { publicCommunityEventTeaserWindow: eventWindow } = await client.catalog.upcomingEvents({
  from: now.toISOString(),
  to: in90Days.toISOString(),
});

if (eventWindow === null) {
  // Could not be answered — an unknown organization, a window past the cap,
  // the organization's community not switched on, or too many requests. NOT
  // "nothing scheduled" — do not cache this as an empty calendar.
} else {
  for (const event of eventWindow.teasers) {
    console.log(event.title, event.startAt, event.accessType);

    // `hostNames` is EVERY host, in the order the organization set. `hostName`
    // is only the FIRST of them, so a card built from it advertises one
    // instructor for a co-taught class and silently drops the rest.
    //
    // Join with `Intl.ListFormat`, not `join(', ')` — the conjunction is
    // language-specific ("A and B" / "A und B" / "A ve B").
    //
    // The list can be EMPTY: an event nobody hosts publicly has every host
    // left out, and `format([])` is `''`. Render the host line only when the
    // formatted string is non-empty, or the card grows a blank row.
    const hosts = new Intl.ListFormat('tr', {
      style: 'long',
      type: 'conjunction',
    }).format(event.hostNames);

    if (hosts) console.log(hosts);
  }
  if (eventWindow.truncated) {
    // The window holds more than `eventWindow.limit` events; the rest are
    // simply absent from `teasers`. Tell the reader, e.g. "and more — narrow
    // the dates to see them."
  }
}
```

The window is capped at 92 days by the API — ask for what you need rather than
the widest range that compiles.

**`null` and an empty list mean different things.** `null` is "this request could
not be answered" — an unknown organization, a window past the cap, the
organization's community not switched on, or too many requests. An empty
`teasers` array is an honest "nothing scheduled." Render them differently;
caching a `null` as "runs no events" is exactly the bug the API's own docs warn
about.

**`truncated` is a third, independent signal.** The window can hold more events
than `limit` (currently 100); when it does, the extra ones are not returned at
all, and `truncated` is the only way to know they exist — it can be `true`
even when `teasers` came back shorter than `limit`, since a paid event dropped
from the answer still counts toward the total the window held. The API's
schema says a storefront **must** surface this; silently rendering `teasers`
alone hides events the visitor should know are there.

A members-only event's `description` and `image` come back `null` to a caller
who cannot see them, and a subscription-gated one shows just enough to justify
joining. That masking happens on the server — there is nothing for your code to
hide.

### Recurring gatherings

`catalog.upcomingEventSeries` answers the same window with one entry per
**series** rather than per date — "every Wednesday at 20:00" instead of eight
Wednesdays:

```ts
const { publicCommunityEventSeriesTeaserWindow: seriesWindow } =
  await client.catalog.upcomingEventSeries({
    from: now.toISOString(),
    to: in90Days.toISOString(),
  });

if (seriesWindow !== null) {
  for (const series of seriesWindow.series) {
    console.log(
      series.title,
      series.nextOccurrence?.startAt,
      series.upcomingOccurrenceCount,
    );
  }
}
```

`recurrence` is `null` when the pattern cannot be described in those terms, and
`nextOccurrence` is `null` once the series has no date left to show — check
`hasEnded` rather than reading a null as "not scheduled yet". Clock times are in
the organizer's `timezone`. Everything above about the 92-day cap, `null` versus
an empty list, `truncated` and server-side masking applies unchanged.

### One event or series

`catalog.event` and `catalog.eventSeries` read a single gathering, for an event
page on your own site instead of a link out to the platform's share page. Pass
the `id` a teaser above came back with:

```ts
const { publicCommunityEventTeaser: event } = await client.catalog.event({
  eventId: teaser.id,
});

if (event === null) {
  // Unknown, unpublished, or another organization's: answer with a 404.
} else if (event.series !== null) {
  const { publicCommunityEventSeriesTeaser: series } =
    await client.catalog.eventSeries({ seriesId: event.series.id });

  for (const date of series?.upcomingOccurrences ?? []) {
    console.log(date.startAt, date.isCancelled);
  }
}
```

Both carry the same server-side masking as the window reads, and both still
answer for a gathering that has finished: an event keeps `isCancelled` and its
`recordingVideo` (null unless the organizer published it to visitors), and a
series says `hasEnded`. Neither carries a join link. `upcomingOccurrences`
stops at 10 dates; `upcomingOccurrenceCount` says how many there are.

## Cart

The cart works for a signed-out visitor. Keep the `cartId` you get back —
without it, every call starts a new cart.

```ts
const { addCartOrderable } = await client.cart.add({
  orderableId: term.id,
  cartId: localStorage.getItem('cartId'), // null on a first visit
});

localStorage.setItem('cartId', addCartOrderable.cart!.id);
```

Read it back, apply a coupon, mark a line as a gift:

```ts
const { organization: cart } = await client.cart.get({ cartId });

await client.cart.addCoupon({ couponCode: 'SPRING', cartId });
await client.cart.remove({ orderableId: term.id, cartId });
```

A signed-in visitor's cart is keyed on their session instead, and `cartId` is
ignored.

## Checkout

Create an order, then send the buyer to the hosted payment page. You own
everything up to the buy button.

```ts
const { createOrder } = await client.checkout.createOrder({ cartId });
const order = createOrder.order!;

window.location.href = client.checkout.paymentUrl(order.slug);
```

That is the whole handoff. **The buyer never needs an account** — an order
placed from an anonymous cart is readable at its own URL while payment is
pending, which is what makes the redirect work.

A free order skips payment entirely:

```ts
await client.checkout.completeFreeOrder({ orderId: order.id });
```

## Sessions

Authentication is a bearer token, not a cookie. Your site is a different origin
from ours, so our session cookie is not sent to you — and widening it so that it
would is exactly the thing we will not do.

```ts
const client = new TeachfluenceClient({
  organizationSlug: 'your-org',
  getAccessToken: () => localStorage.getItem('tf_token'),
});

const { viewer } = await client.session.viewer();

if (viewer?.__typename === 'User') console.log(viewer.email);
```

### Signing someone in

```ts
const { loginWithPassword } = await client.session.loginWithPassword({
  email,
  password,
  cartId, // the anonymous cart carries onto their account
});

save(loginWithPassword.credentials?.accessToken);
```

Passing `cartId` is the difference between a shopper who signs in at checkout
keeping their basket and one who watches it vanish at the moment they commit.

Passwordless works the same way, in two steps:

```ts
await client.session.sendLoginOtp({ channel: 'EMAIL', identifier: email });
const { loginWithOtp } = await client.session.loginWithOtp({
  channel: 'EMAIL', identifier: email, otp, cartId,
});
```

`channel` also accepts `SMS` and `WHATSAPP`. Forgotten passwords go through
`session.requestPasswordReset({ email })` and then
`session.resetPassword({ token, newPassword })`, where the token comes from the
mail; a successful reset signs them in.

**The SDK does not store the token.** It hands you one and reads it back
through `getAccessToken`. Where a session lives — cookie, memory, storage — is
a decision only your application can make safely, so it stays yours.

### What they own

```ts
const { viewer } = await client.me.enrollments();

if (viewer?.__typename === 'OrganizationStudent') {
  for (const e of viewer.enrollments) {
    console.log(e.courseAcademicTerm?.title, e.progress?.overallProgress);
  }
}

const orders = await client.me.orders({ first: 10 });

// `status: null` means ALL. Omitting it defaults to ACTIVE — so a revoked
// certificate simply vanishes from the list rather than rendering as revoked.
const certificates = await client.me.certificates({ first: 10, status: null });

for (const edge of certificates.studentCertificates.edges) {
  // Share links come from `publicUrl` — never build one from `id`
  console.log(edge.node.publicUrl, edge.node.linkedInAddUrl, edge.node.revokedAt);
}
```

Pass `status: 'REVOKED'` for just those, or omit the argument entirely to keep
the ACTIVE-only default.

Both return empty for an anonymous visitor rather than failing — having no
orders is not an error.

## Teaching the course

Selling is half of it. Once someone owns a course, the lesson list, the content
and their progress are all yours to design.

```ts
const { node } = await client.learn.curriculum({ termId });

if (node?.__typename === 'CourseAcademicTerm') {
  for (const section of node.sections) {
    for (const item of section.items) {
      console.log(item.title, item.viewerHasAccess, item.viewerProgress?.progress);
    }
  }
}
```

One round trip returns every section and item with access, drip state and the
viewer's progress — enough to render a whole syllabus without a request per row.

Then one item at a time:

```ts
const { node: item } = await client.learn.item({ itemId });

if (item?.__typename === 'VideoCourseItem') {
  // null here means NOT ENTITLED, not "no video" — see below
  if (item.video) <MyPlayer src={item.video.url} poster={item.video.posterUrl} />;
}
```

`learn.item` narrows across all fourteen item types — video, audio, article,
document, question, quiz, assignment, exam, embed, live, form, forum, SCORM and
cmi5 — so a `switch` on `__typename` gets you a typed payload for each.

**`chaptersVttUrl` is a RELATIVE path**, unlike `url` and `posterUrl`. It points
at the Teachfluence app origin, not yours — resolving it against your own site
gives a 404. Prefix it with your organization's Teachfluence origin:

```ts
const chapters = item.video?.chaptersVttUrl
  ? new URL(item.video.chaptersVttUrl, 'https://your-org.teachfluence.com').href
  : undefined;
```

It is also access-checked per viewer, so it needs the visitor's session to be
carried on that request — a cross-origin `<track>` fetch does not send one by
default.

### Access is ours to decide, not yours to enforce

Every item carries `viewerHasAccess`, and **a gated item's payload comes back
`null`**. A `VideoCourseItem` whose `video` is null means the viewer has not
earned it — drip has not unlocked, the item is hidden, or they do not own the
course. It does not mean the lesson has no video.

This is deliberate, and it is what makes building your own learning UI safe: you
cannot leak content by getting your own permission check wrong, because the API
will not hand you what the viewer has not earned, whatever your UI asks for.
Render from `viewerHasAccess` and a null payload; do not compute entitlement
yourself.

### Progress

```ts
await client.learn.updateProgress({ itemId, progress: 0.75 });
await client.learn.updateProgress({ itemId, completed: true });
```

`progress` is a 0–1 fraction. The mutation returns the updated record, so a
lesson page can re-render without refetching the curriculum.

### Downloadable files

Items list their attachments by name and size, but never as a static URL — the
link is minted per viewer and expires. Ask for one when they click:

```ts
const { getAttachmentUrl } = await client.learn.attachmentUrl({
  attachmentId,
  itemId,
});

if (getAttachmentUrl.url) window.location.href = getAttachmentUrl.url;
```

When the organization watermarks downloads, `url` is null and `watermarkJob`
comes back `PROCESSING` instead — a personalized copy is being made. Poll until
it is ready:

```ts
const { node: job } = await client.learn.attachmentWatermarkJob({ jobId });

if (job?.__typename === 'AttachmentWatermarkJob' && job.status === 'READY') {
  // job.url is now the download
}
```

## Assigned work and discussion

An assignment is three steps, and the order matters: **nothing is graded until
submit**, so autosave belongs on `saveAssignment`, not `submitAssignment`.

**Read the item first.** `assignmentDraft` is a mutation, not a lookup —
calling it unconditionally on page load REOPENS a submission the student has
already sent, which is why our own product puts it behind a "start" button and
a confirm dialog. Resume the existing one when there is one:

```ts
const { node: item } = await client.learn.item({ itemId });
const existing =
  item?.__typename === 'AssignmentCourseItem'
    ? item.viewerLatestAssignmentSubmission
    : null;

// DRAFT is theirs to keep editing; anything else has been handed in.
let submissionId = existing?.status === 'DRAFT' ? existing.id : null;

if (existing?.status === 'DRAFT') {
  editor.setValue(existing.freeResponseAnswer);  // rehydrate their draft
}

if (!submissionId) {
  const { createDraftAssignmentSubmission } =
    await client.assess.assignmentDraft({ itemId });

  submissionId = createDraftAssignmentSubmission.assignmentSubmission!.id;
}

// `freeResponseAnswer` is a WRAPPER, not the answer: omitting it leaves the
// field untouched, so an autosave can send only what changed.
await client.assess.saveAssignment({
  submissionId,
  freeResponseAnswer: { value: editorValue },  // as they type
});
await client.assess.submitAssignment({ submissionId });  // once, deliberately
```

The item carries the whole submission — `status`, `grade`, `gradeFeedback`,
`attachments` — so a graded assignment renders its feedback from the same read,
with no extra call.

Lesson quizzes come back whole — the question, and the shape the answer takes
for each of the seven quiz types — and are answered with one call:

```ts
const { submitQuiz } = await client.assess.submitQuiz({
  quizId,
  itemId,
  startedAt: openedAt.toISOString(),
  submission: { selectedChoiceIndex: 2 },
});

// The verdict on the option they picked, not the whole answer key
const wasRight = submitQuiz.quizSubmission?.selectedOption?.isCorrect;
```

`submission` is an untyped `JSONObject` because its shape follows the quiz type:
`{ selectedChoiceIndex }` for multiple choice, `{ freeResponseAnswer }` for free
response, and a `structuredAnswer` payload for the ordering, matching,
categorization, phrase-selection and fill-in-blank types. Read
`quiz.__typename` and send the matching shape.

`isCorrect` on the other options stays `null` until the student has answered —
the key is the server's to release, so a quiz UI cannot leak it early even by
accident.

Forums read and write. Posts come newest-first with their authors; a post's
comments come with the post itself:

```ts
const { node: forum } = await client.forum.get({ forumId, first: 20 });
const { node: thread } = await client.forum.postDetail({ postId, first: 50 });

await client.forum.post({ forumId, title, content });
await client.forum.comment({ forumPostId, content });
```

`sortOrder` defaults to newest-first for a forum index and oldest-first for a
thread, which is what each surface wants; `ForumPostSortOrder` also has
reaction-ranked options, and `forum.get` takes a `status` filter if you want
approved-only.

**Check `status` on what comes back.** A forum can require approval
(`effectiveSettings.autoApprovePosts` is false), and then a new post is
`PENDING` — it exists, but nobody else can see it yet. Say so in your UI, or the
author watches their post fail to appear and writes it a second time.

Voting, where `isPositive: null` removes the reaction rather than being a third
opinion:

```ts
await client.forum.reactToPost({ forumPostId, isPositive: true });
await client.forum.reactToComment({ forumPostCommentId, isPositive: null });
```

Render the control from `effectiveSettings.reactionType` (up/down vs a single
like) and hide it unless `viewerCanReact`.

Counts come back **per direction** — `positiveReactionCount` and
`negativeReactionCount` — not as one total. A bare total is unusable on an
`UPVOTE_DOWNVOTE` forum, where five up and five down is indistinguishable from
ten up and no score can be derived from it. For a `LIKE` forum, read the
positive one.

A forum index also gets each post's reply count from `comments.totalCount`
without fetching the thread, so "12 replies" costs no extra round trip.

**Rich text is Slate JSON, not a string.** `content` on a post or comment, and
`freeResponseAnswer.value` on an assignment, are all
`[{ type: 'p', children: [{ text: '…' }] }]`. Passing a bare string yields a
record that renders as nothing. To display rich text without walking the
document, read the `<field>Rich { text html }` sibling that these operations
return beside the JSON field: its plain text, and HTML sanitized on the server.
`SdkCommunityFeed`, `SdkCommunitySpacePosts` and `SdkForum` return
`contentRich` on posts (`descriptionRich` on the forum), and
`SdkCreateCommunityPost` on the returned edge's post; the community-event
operations return `descriptionRich`; `SdkCourseItemDetail` returns one for
every rich-text field it selects. The sibling is null exactly when the JSON
field is null, except `hintsRich`: like `hints`, it is never null, and it is
empty when `hints` is. Every other operation (single post, post and forum-post
writes, comments, quiz and assignment submissions) returns the JSON field only
for now.

**Exams are not in this release.** The operations exist server-side but are not
published while their integrity properties are being fixed; publishing them
first would document behaviour we already know is wrong. Send students to the
platform's own exam page until they land.

**Assignment files can be read but not uploaded.** A submission's `attachments`
come back, and `learn.attachmentUrl` downloads them — but the upload itself
goes through a REST endpoint the SDK has no GraphQL equivalent for, so an item
with `allowFileUpload: true` cannot be completed from your own page. Send those
students to the platform's own assignment page until an upload mutation exists.

## Forms

Read one of the organization's forms and answer it. Anonymous throughout — a
contact or lead-capture form is filled by someone with no account.

```ts
const { organization } = await client.forms.get({ slug: 'contact' });
const form = organization?.form;

await client.forms.submit({
  formId: form!.id,
  submissions: [{ answer: 'Hello', formQuestionId: form!.sections[0].questions[0].id }],
  // Optional, and what lead capture is usually for.
  attribution: { utmSource: 'newsletter' },
});
```

`submit` starts the session and answers it in one call. The session's
`anonAccessToken` is held for the duration and never reaches your code — which
is also why there is no public `startSession`: a session id without its token is
something that looks usable and is not.

**What the SDK can render today.** `forms.get` selects every question type the
schema defines, so a text, choice, contact, date, scale, matrix, file or content
question arrives with the fields needed to draw it. Two caveats:

- **`PAYMENT` questions cannot be completed.** Collecting the payment needs
  `paymentSession(formSessionId:)`, which requires a session that does not exist
  when the form is read. Skip that `__typename` rather than rendering a field the
  visitor cannot answer.
- **Check `publishStatus`** before rendering. A form that is not public still
  resolves for a permitted viewer.

## Mailing lists

A newsletter or waitlist signup: one address onto one of the organization's
mailing lists. Anonymous — the visitor needs no account.

```ts
import { isUserError } from '@teachfluence/sdk';

try {
  await client.mailingLists.subscribe({
    email,
    mailingListId: 'cm1a2b3c4d5e6f7g8h9i0j1k2',
    // Only the documents the visitor actually ticked.
    legalDocumentIds: acceptedPrivacyNotice ? [privacyNoticeId] : [],
  });
  showThanks();
} catch (error) {
  if (isUserError(error)) {
    setFieldError(error.forField('email')?.message ?? error.message);
    return;
  }
  throw error;
}
```

`subscribe` resolves with nothing: resolving means the address is on the list,
and a refusal throws. It never says whether the address was already there, or
since when — the call runs for any address anyone types, and that is not a
stranger's to learn.

**The list must be public and active, and your organization's own.** Anything
else — a private list, another organization's, a deleted one — is refused with
the same `NOT_FOUND`, on purpose, so the answer says nothing about lists you
cannot see. A public list that has been switched off answers `UNAUTHORIZED`.
The id may be the list's GraphQL id or the plain id the Teachfluence tools
return when they create it.

**Consent documents must be published.** A `legalDocumentIds` entry that is not
a published document of the list's organization refuses the whole signup
(`NOT_FOUND` on `legalDocumentIds` and that entry's index) rather than
subscribing the address with no consent on record.

**Only an address.** When the signup needs more than that — a name, a
question — build it as a [form](#forms) instead, and have an automation add
each respondent to the list when the form is submitted.

**Never a `mailto:` link** in place of either. It captures nobody: the address
never reaches the list, and nothing tells you it did not.

## Resuming a video

Where the signed-in viewer stopped in a video outside a course (an event's
recording, a video on a page), so your player opens there next time:

```ts
const { node } = await client.videos.watchState({ id: videoId });
const state = node?.__typename === 'Video' ? node.viewerWatchState : null;

// Resume unless they had finished it (or are at its very end).
const resumeAt =
  state && state.status !== 'COMPLETED' && state.progress <= 0.99
    ? state.progress
    : 0;

// A lost report must not interrupt playback, so each one ignores a failure.
const ignore = () => {};

// While it plays, about every 10 seconds and on a pause.
await client.videos.updateWatchState({ progress: 0.4, videoId }).catch(ignore);

// As the visitor leaves the page, so the write is not cancelled with it.
await client.videos
  .updateWatchState({ progress: 0.4, videoId }, { keepalive: true })
  .catch(ignore);

// At the end. Nothing partial after this until it ends again.
await client.videos.updateWatchState({ completed: true, videoId }).catch(ignore);
```

`progress` is a 0–1 fraction. `viewerWatchState` is null for a visitor who is
not signed in, for a video they have never played or may not watch, and for a
lesson's video; ask `session.viewer` to know whether anyone is signed in.
`node` is null only for an id that does not exist.

- **Report about every 10 seconds** while it plays, and on a pause, a seek and
  as the visitor leaves — not on every frame: writes are budgeted per viewer.
  Skip a report while the duration is not yet a finite number above zero, and
  clamp the fraction to 0–1.
- **Once a video counts as watched, report nothing partial for it** until it
  ends again — whether it was COMPLETED when the player opened, or a write
  answered `status: 'COMPLETED'`. A lower position un-watches a video that
  counted as watched by its position alone. Near the end, send
  `completed: true`, which a later lower position does not undo.
- **A refusal is a `TeachfluenceUserError`**: `UNAUTHENTICATED`, `NOT_FOUND`
  (no such video, or not theirs to watch), `INVALID` (a lesson's video — those
  are tracked by `learn.updateProgress` — or input out of range, such as a
  `progress` above 1) or `RATE_LIMITED`. A report can also fail as a
  `TeachfluenceTransportError`, likeliest on the one sent as the page closes.
  A lost position report should not interrupt playback, so catch every
  rejection from one, not only a refusal.
- `keepalive` covers the request, not an asynchronous `getAccessToken` that
  runs before it.

## Errors

Three kinds, because you handle them differently:

- `TeachfluenceTransportError` — the request did not complete. Retryable.
- `TeachfluenceOperationError` — the server rejected the operation. A version
  skew or a bug; retrying will not help.
- `TeachfluenceUserError` — a business rule said no. Show it to the user.

```ts
import { isUserError } from '@teachfluence/sdk';

try {
  await client.cart.addCoupon({ couponCode, cartId });
} catch (error) {
  if (isUserError(error)) {
    setFieldError(error.forField('couponCode')?.message);
    return;
  }
  throw error;
}
```

Business failures arrive inside a successful HTTP response, so the SDK raises
them as their own error type — a caller that forgets to check cannot silently
treat a declined payment as a success.

`forField` takes the name of *your* form field. The API reports a path
(`['input', 'couponCode']`); you should not have to know that the mutation
wraps its arguments in an `input` object, so any segment matches.

## Dropping to the raw operation

Every method above is a thin wrapper over `execute()`, and the operations are
exported. Reach for this when you want a call the namespaces do not wrap yet:

```ts
import { SdkAddCartOrderable } from '@teachfluence/sdk';

await client.execute(SdkAddCartOrderable, { input: { organizationId, orderableId } });
```

Results are fully typed either way — the types are generated from the same
schema the API serves.

## What this SDK will not do

**Payments.** There is no payment form here and there will not be one. Checkout
spans three providers, billing capture, promotions, gifting and Turkish
invoicing rules; reimplementing it in your bundle would duplicate the most
compliance-sensitive code on the platform somewhere neither of us wants it.
`paymentUrl()` hands you a URL — that is the boundary.

**Arbitrary queries.** Every call names an operation we publish. You cannot send
your own GraphQL, which is what lets us keep the public surface equal to what we
chose to support instead of to the entire schema. Need something that is not
exposed yet? Ask, and it ships in a release.

## Deploying

```bash
npx @teachfluence/cli deploy ./dist --org your-org --route /docs
```

**Build with a matching base path.** A route claim serves your bundle at that
path and nothing above it, so a default build whose `index.html` references
`/assets/app.js` absolutely will render a page with every asset 404ing. Set the
base to the route you are claiming:

| Tool | Setting |
|---|---|
| Vite | `base: '/docs/'` |
| Next (static export) | `basePath: '/docs'` |
| CRA | `"homepage": "/docs"` |

Claiming the site root (`--route /`) is supported, at **EXACT** scope only — a
PREFIX claim there would match every URL in the org. An EXACT claim owns exactly
one URL, so a root claim serves your `index.html` at `/` and nothing else: every
asset is a different URL and falls through to the platform. A site at the root
therefore needs a second, PREFIX claim for its assets — and both must be
redeployed together, since each route serves the bundle it was last activated
against. See the CLI README for the worked example.

Without `--route`, the bundle uploads but serves no traffic — useful for
building a deploy you activate later, surprising if you expected a live site.

A route that would hide pages you already publish is refused, with the list of
what it would hide. `--force` accepts it deliberately.

## SEO

A client-fetched site renders empty to crawlers unless you prerender at build
time. The page builder does a lot of SEO work for you — per-org canonicals,
JSON-LD, sitemaps, ISR — and taking your own frontend means taking that on.
Prerender your catalog pages and rebuild on the content-changed webhook.

**Structured data, stated the platform's way.** `buildOrderableJsonLd` is the
builder the platform's own product pages use, shipped here as a pure function
(no network, no React), so your pages state a product exactly as ours would: an
`Offer` while the public can buy it, an `OutOfStock` one for a paused Product or
Course, and none for a paused Event, a members-only (`MEMBERS_ONLY`) or
not-on-sale (`NOT_ON_SALE`) product, or an event that has ended; an `Event` only
when it can be placed; and every node pointing at
your organization's one `@id` (`organizationJsonLdId(yourOrigin)`). Execute
`SdkOrderableJsonLdFacts` for the product's sale, schedule and people facts,
pass its `node` to `orderableNodeFacts`, add the page's own `name`, `url`,
`type` and `organizationId`, and serialize the result into a
`<script type="application/ld+json">` with `<` escaped.

You do not need to state the organization node itself on a bundle the platform
serves: every production page of a deployed bundle gets it, spliced in after
`<head>` (see the CLI README to opt out).

## Versioning

Operations are content-addressed and published per release. Upgrading the SDK
can add operations; removing one is a breaking change and gets a major version.

Content-addressed means the id IS the document's bytes, so **editing** an
operation gives it a new id. The API keeps accepting the old id while clients it
knows about still send it, so the same operation name may be listed with two ids
for a while. Nothing is "removed" and the bump is only minor, but a consumer
pinned to a version whose id the API has stopped accepting loses that one call.
Upgrade the SDK in step with the API, treat the API's own list of accepted
operations as authoritative, and read the release notes for an operation you
depend on.

## License

MIT — this package, its source and the CLI. That covers the client code only.
Access to the Teachfluence API is governed separately by the terms attached to
your API keys; installing this package grants no rights to the service.
