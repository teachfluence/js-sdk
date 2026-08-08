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
The organization slug comes from the client, so you never repeat it.

## Cart

The cart works for a signed-out visitor. Keep the `cartId` you get back —
without it, every call starts a new cart.

```ts
const { addCartOrderable } = await client.cart.add({
  organizationId: organization!.id,
  orderableId: term.id,
  cartId: localStorage.getItem('cartId'), // null on a first visit
});

localStorage.setItem('cartId', addCartOrderable.cart!.id);
```

Read it back, apply a coupon, mark a line as a gift:

```ts
const { organization: cart } = await client.cart.get({ cartId });

await client.cart.addCoupon({ organizationId, couponCode: 'SPRING', cartId });
await client.cart.remove({ organizationId, orderableId: term.id, cartId });
```

A signed-in visitor's cart is keyed on their session instead, and `cartId` is
ignored.

## Checkout

Create an order, then send the buyer to the hosted payment page. You own
everything up to the buy button.

```ts
const { createOrder } = await client.checkout.createOrder({
  organizationId,
  cartId,
});
const order = createOrder.order!;

window.location.href = client.checkout.paymentUrl(order.slug);
```

`organizationId` is required on the cart path even though the schema types it
nullable — an order has to name either an organization or a single orderable,
and a cart order names the organization.

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

**Signing in is not part of this release.** The SDK reads who the visitor is and
sends a token you already hold; it does not yet issue one. Until it does, use
the platform's own login and hand the token across.

## Errors

Three kinds, because you handle them differently:

- `TeachfluenceTransportError` — the request did not complete. Retryable.
- `TeachfluenceOperationError` — the server rejected the operation. A version
  skew or a bug; retrying will not help.
- `TeachfluenceUserError` — a business rule said no. Show it to the user.

```ts
import { isUserError } from '@teachfluence/sdk';

try {
  await client.cart.addCoupon({ organizationId, couponCode, cartId });
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
