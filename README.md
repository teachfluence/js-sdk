# Teachfluence JavaScript packages

| Package | |
|---|---|
| [`@teachfluence/sdk`](./packages/sdk) | Build your own frontend on Teachfluence — catalog, sessions, cart. |
| [`@teachfluence/cli`](./packages/cli) | Deploy that frontend to your organization's site. |

```bash
npm install @teachfluence/sdk
npx @teachfluence/cli deploy ./dist --org your-org --route /docs
```

Both are MIT licensed. That covers the client code only — access to the
Teachfluence API is governed separately by the terms attached to your API keys.

## About this repository

This is a **mirror**. The packages are developed in Teachfluence's application
repository, where the GraphQL operations they call are generated and checked
against the live schema by a contract test — the SDK ships operation *ids*, and
those ids have to match what the API will actually execute. Splitting the
packages out entirely would mean reproducing that check across a repository
boundary, so instead the source is snapshotted here on each release.

What that means in practice:

- **Releases are published from this repository**, so every tarball on npm
  carries a provenance attestation pointing at a public workflow run you can
  inspect. That is the reason the mirror exists.
- **Pull requests here cannot be merged as-is** — changes have to land upstream
  or the next sync overwrites them. Open one anyway if you have a fix; we will
  carry it across and credit you.
- **Issues are welcome and are the right place for them.** They are read.
- **Tests are not included.** They run upstream against the schema the
  operations are generated from, which is where a failure is meaningful.

## Verifying a release

```bash
npm view @teachfluence/sdk --json | jq .dist.attestations
```

Every published version is built by the `publish` workflow in this repository.
