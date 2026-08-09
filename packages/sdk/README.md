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
record that renders as nothing.

**Exams are not in this release.** The operations exist server-side but are not
published while their integrity properties are being fixed; publishing them
first would document behaviour we already know is wrong. Send students to the
platform's own exam page until they land.

**Assignment files can be read but not uploaded.** A submission's `attachments`
come back, and `learn.attachmentUrl` downloads them — but the upload itself
goes through a REST endpoint the SDK has no GraphQL equivalent for, so an item
with `allowFileUpload: true` cannot be completed from your own page. Send those
students to the platform's own assignment page until an upload mutation exists.

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

Claiming the site root (`--route /`) is **not supported**. The edge matcher
resolves a claim against slash-stripped path segments, so a root pattern matches
nothing and a request for `/` exits before any claim is considered. Claim a real
path and point your domain's landing page at it.

Without `--route`, the bundle uploads but serves no traffic — useful for
building a deploy you activate later, surprising if you expected a live site.

A route that would hide pages you already publish is refused, with the list of
what it would hide. `--force` accepts it deliberately.

## SEO

A client-fetched site renders empty to crawlers unless you prerender at build
time. The page builder does a lot of SEO work for you — per-org canonicals,
JSON-LD, sitemaps, ISR — and taking your own frontend means taking that on.
Prerender your catalog pages and rebuild on the content-changed webhook.

## Versioning

Operations are content-addressed and published per release. Upgrading the SDK
can add operations; removing one is a breaking change and gets a major version.

## License

MIT — this package, its source and the CLI. That covers the client code only.
Access to the Teachfluence API is governed separately by the terms attached to
your API keys; installing this package grants no rights to the service.
