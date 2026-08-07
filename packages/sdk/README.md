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

> **Checkout is not in this release.** The hosted-checkout handoff needs a
> backend mutation that does not exist yet. It will arrive as
> `checkout.createSession()` returning a URL — the Stripe model — and never as
> a payment form in your bundle.

## Keys

Two kinds, and the difference matters.

| | Where it lives | What it grants |
|---|---|---|
| `tf_pk_…` publishable | Your client bundle | Nothing an anonymous visitor could not already do |
| `tf_sk_…` secret | Your server only | Organization-wide reads for build scripts and backends |

A publishable key is **public by construction** — anyone who loads your site can
read it. Treat it as an origin hint, never as a secret.

Passing a `tf_sk_` key to the SDK in a browser throws immediately rather than
shipping to production and being scraped.

## Sessions

Authentication is a bearer token, not a cookie. Your site is a different origin
from ours, so our session cookie is not sent to you — and widening it so that it
would be is exactly the thing we will not do.

```ts
const client = new TeachfluenceClient({
  organizationSlug: 'your-org',
  getAccessToken: () => localStorage.getItem('tf_token'),
});
```

## Errors

Three kinds, because you handle them differently:

- `TeachfluenceTransportError` — the request did not complete. Retryable.
- `TeachfluenceOperationError` — the server rejected the operation. A version
  skew or a bug; retrying will not help.
- `TeachfluenceUserError` — a business rule said no. Show it to the user.

```ts
import { isUserError } from '@teachfluence/sdk';

try {
  await checkout.createSession({ promotionCode, returnUrl });
} catch (error) {
  if (isUserError(error)) {
    setFieldError(error.forField('promotionCode')?.message);
    return;
  }
  throw error;
}
```

Business failures arrive inside a successful HTTP response, so the SDK raises
them as their own error type — a caller that forgets to check cannot silently
treat a declined payment as a success.

## What this SDK will not do

**Payments.** There is no payment form here and there will not be one. Checkout
spans three providers, billing capture, promotions, gifting and Turkish
invoicing rules; reimplementing it in your bundle would duplicate the most
compliance-sensitive code on the platform somewhere neither of us wants it.
When the handoff ships, `createSession()` hands you a URL — you own everything
up to the buy button.

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
