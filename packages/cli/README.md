# @teachfluence/cli

Deploy your own frontend to Teachfluence. Build a static bundle however you
like, then claim a path on your organization's site and serve it there.

```bash
npx @teachfluence/cli deploy ./dist --org your-org --route /docs
```

Pairs with [`@teachfluence/sdk`](https://www.npmjs.com/package/@teachfluence/sdk),
which is how that bundle reads catalog, session and cart data at runtime.

## Authentication

For a demo organization, `--publish` opens a browser consent page. Sign in to
the intended organization and approve `mcp.read` and `mcp.write`. The CLI keeps
the refresh grant in `~/.config/teachfluence/cli-credentials.json` (or under
`XDG_CONFIG_HOME`), restricted to the current OS user; no secret key is pasted
into a shell or chat. The API must allow the CLI's loopback OAuth callback
(`http://127.0.0.1:*/callback`) in its MCP redirect URI configuration.

```bash
npx @teachfluence/cli deploy ./dist --org your-demo --route / --site --take-over-site --publish
```

`--publish` builds one ZIP, uploads it with a short-lived target, has the server
verify every file hash, and publishes the draft. It accepts demo organizations
and whole-site root mounts only. The connected OAuth organization must exactly
match `--org`. An authored `site.json` must declare a SITE mount with no asset
prefix; when absent, the CLI adds that declaration to the ZIP. The CLI reports
pending propagation instead of claiming that an unverified version is live.

Exit code `0` means the fresh public probe path was confirmed. Exit code `2`
means the draft was accepted but that path was not verified within 45 seconds;
check `site_serving_status` before sharing it. Exit code `1` means the command
failed before verification (including a scan timeout). The draft ID is printed
after creation so a failed attempt can be inspected or cleaned up.

For CI and ordinary `deploy --route` use, the existing secret-key path remains:

```bash
export TEACHFLUENCE_SECRET_KEY=tf_sk_…
```

Deliberately not a flag. A key passed on the command line lands in your shell
history and in the process list, where anything else on a CI runner can read it.

## Options

| Option | |
|---|---|
| `--org <slug>` | **Required.** The organization to deploy into. |
| `--route <path>` | Serve the bundle at this path. Without it the bundle uploads but receives no traffic. |
| `--site` | With `--route /`, serve your whole site from the root. Requires `--take-over-site`. |
| `--take-over-site` | Confirm the whole-site scope. Separate from `--force`. |
| `--label <git-sha>` | Records which source revision produced the bundle. |
| `--force` | Publish a route even if it would hide pages you already publish. |
| `--allow-project-root` | Deploy a directory that looks like a project root. |
| `--publish` | Publish a demo whole-site bundle through browser OAuth and the verified MCP ZIP workflow. Requires `--route / --site --take-over-site`. |

An unrecognized option is rejected rather than ignored — `--rout /docs` would
otherwise deploy with no route at all, and the only sign would be a success
line saying no traffic is served.

## Build with a matching base path

A route claim serves your bundle at that path and nothing above it. A default
build whose `index.html` references `/assets/app.js` absolutely will render a
page with every asset 404ing. Set the base to the route you are claiming:

| Tool | Setting |
|---|---|
| Vite | `base: '/docs/'` |
| Next (static export) | `basePath: '/docs'` |
| CRA | `"homepage": "/docs"` |

## Serving your whole site from the root

`--route / --site` claims the root as a **whole site**: every path your
organization does not already own is served from your bundle, so `/about`,
`/pricing` and `/blog/hello` all resolve to the matching file.

```bash
teachfluence deploy ./dist --org acme --route / --site --take-over-site
```

Build with **no** base path (Vite `base: '/'`, Next `basePath` unset, CRA
`"homepage": "/"`) — the deployed URLs are the ones your generator already
emits.

The platform keeps the addresses it owns (checkout, sign-in, the admin bounce,
`robots.txt`, `sitemap.xml`), and any narrower claim you hold still wins: a
`/docs` PREFIX claim keeps serving `/docs` after the site lands.

`--take-over-site` confirms the scope. A whole-site claim covers every address
your organization has now **or adds later**, which is more than any report can
list, so it is always a deliberate act. It is deliberately NOT `--force`: the
first run still prints which existing pages the claim would hide, and you
re-run with `--force` once you have read that list.

### If your assets live under their own path

A generator that emits its assets under `/_next/...` cannot be served this way
— those URLs belong to the platform and never reach your bundle. Build with an
asset path the platform does not own and claim it separately:

```bash
teachfluence deploy ./dist --org acme --route / --site --take-over-site
teachfluence deploy ./dist --org acme --route /static
```

with the build pointing at that path (`base: '/static/'`). A PREFIX claim
strips its own segment before looking inside the bundle, so `/static/app.js`
resolves to `app.js` at the bundle root — and PREFIX outranks a whole-site
claim, so it wins for exactly those URLs.

Redeploying **re-points** an existing claim, so keep the same routes every
time — you do not accumulate `/static-v2`, `/static-v3`. What you must not do
is redeploy only one of them: each route is activated against the bundle from
the deploy that claimed it, so updating one alone leaves the other serving the
previous deploy's JavaScript against your new `index.html`. That fails at
runtime while every URL still returns 200. Deploy both, every time.

### What a whole-site claim does not do yet

- **Deep links need real files.** A path resolves to `<path>/index.html` in your
  bundle, which is what directory-style static output already emits. A
  client-routed single-page app (Vite/CRA with one `index.html` and history
  routing) will 404 on every URL except `/` — there is no SPA fallback.
- **Unmatched URLs return an empty 404.** Your bundle's own `404.html` is not
  used, and neither is the platform's not-found page. Under a narrower claim
  that affected one subtree; a whole-site claim makes it your whole site's
  404 experience.
- **`/favicon.ico` is not served from the bundle.** Reference your icon at
  another path from your HTML.
- **The addresses the platform keeps are product paths, and they win.** A
  whole-site claim yields every first path segment the platform owns — among
  them `dersler`, `derslerim`, `etkinlikler`, `abonelik`, `topluluk`,
  `hediye`, `birebir`, `dijital-urunler`, `sepet`, `siparis`, `giris`,
  `ayarlar`, `davet`, `form`. If your site has a page at one of those, the
  platform answers it **200 with the platform's own page**, not a 404 — so the
  failure looks like a styling bug rather than a routing one. Rename those
  pages before you deploy.
- **Redirect rules saved in the platform stop firing.** They are resolved by
  the page a whole-site claim now answers first, so a rule an admin created
  stays listed as enabled and never runs. Move those redirects into your own
  site.

## Claiming a single URL at the root

Without `--site`, `--route /` deploys at **EXACT** scope and owns exactly one
URL: your `index.html` is served at `/`, and nothing else is — `/assets/app.js`
and `/style.css` are different URLs the claim does not match, so they fall
through to the platform. That is the right shape for a one-page site, and it is
all the root could be before `--site` existed.

## Your organization's structured data

Every production page of a deployed bundle states your organization to search
engines and AI assistants: one schema.org `EducationalOrganization` node (name,
logo, canonical URL, social profiles), the same node the platform's own pages
state, spliced into the page right after `<head>`. It is left out on a demo
organization and on preview links.

If your site already states its own Organization markup, opt out in
`site.json` so crawlers see one node, not two:

```json
{"mount": {"scope": "SITE"}, "organizationJsonLd": false}
```

Only a literal `false` opts out; an absent key (every bundle deployed before
the key existed) keeps the node. The key is read from the bundle itself, so it
takes effect with the deploy that carries it.

## Shadowing

A route that would hide pages you already publish is refused, with a report of
what it would hide. `--force` accepts that deliberately.

`--allow-project-root` is separate from `--force` on purpose. Overloading one
flag meant the project-root refusal — whose own message tells you to re-run
with `--force` — also suppressed the shadow report. Two risks, two
confirmations.

`--take-over-site` is separate for the same reason, and it matters most there.
A whole-site claim hides more pages than any other, so it is the one claim
whose report you most need to read — and requiring `--force` to make the claim
at all would have meant that report never printed.

## License

MIT. Use of the Teachfluence API is governed separately by the terms attached
to your API keys.
