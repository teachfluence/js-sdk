# @teachfluence/cli

Deploy your own frontend to Teachfluence. Build a static bundle however you
like, then claim a path on your organization's site and serve it there.

```bash
npx @teachfluence/cli deploy ./dist --org your-org --route /docs
```

Pairs with [`@teachfluence/sdk`](https://www.npmjs.com/package/@teachfluence/sdk),
which is how that bundle reads catalog, session and cart data at runtime.

## Authentication

The CLI reads a secret key from the environment:

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
| `--label <git-sha>` | Records which source revision produced the bundle. |
| `--force` | Publish a route even if it would hide pages you already publish. |
| `--allow-project-root` | Deploy a directory that looks like a project root. |

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

## Claiming the site root is not supported

`--route /` is refused. The edge matcher resolves claims against slash-stripped
path segments, so a root pattern matches nothing and a request for `/` exits
before any claim is considered. Claim a real path and point your domain's
landing page at it.

## Shadowing

A route that would hide pages you already publish is refused, with a report of
what it would hide. `--force` accepts that deliberately.

`--allow-project-root` is separate from `--force` on purpose. Overloading one
flag meant the project-root refusal — whose own message tells you to re-run
with `--force` — also suppressed the shadow report. Two risks, two
confirmations.

## License

MIT. Use of the Teachfluence API is governed separately by the terms attached
to your API keys.
