# Updating the upstream version

The `bitcoind` image is built locally from `Dockerfile`: it downloads the Knots release tarball from `bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/` and verifies `SHA256SUMS.asc` against a pinned 3-of-5 quorum of Knots release signers (keys in `assets/release-keys/`, fingerprints in `PINNED_FINGERPRINTS`). There is no `dockerTag` — the version lives in `buildArgs`. This branch is the **pre-RDTS variant**: it is pinned to the last Bitcoin Knots release without RDTS (`29.3.knots20260507`) and does **not** track newer Knots releases — every release from `29.3.knots20260508` on includes RDTS and belongs on the `29.x` sibling, not here.

## Determining the upstream version

This branch does **not** follow the latest Knots tag. The pin is `29.3.knots20260507` — the final release before RDTS shipped in `29.3.knots20260508`. Do not bump `VERSION` to a newer tag; the pin only moves if upstream ever publishes another non-RDTS release (not expected).

- Current pin: `VERSION` build-arg under `images.bitcoind.source.dockerBuild.buildArgs` in `startos/manifest/index.ts` (paired with `PATH_VERSION = '29.x'`).

## Applying the bump

1. In `startos/manifest/index.ts`, bump the `bitcoind` image `buildArgs`:
   - `VERSION` — the full release string (e.g. `29.3.knots20260507`).
   - `PATH_VERSION` — the major track folder (e.g. `29.x`); only changes when the series rolls.
2. If upstream rotated release signers, update `PINNED_FINGERPRINTS` in `Dockerfile` and refresh the keys in `assets/release-keys/`.
3. Knots' `version` string stays put; `.satisfies('29.4:N')` in the current version file tracks Bitcoin Core 29.x's current `:N`. When Core 29.x bumps `:N`, update the `satisfies` argument here to match. The current version file also carries `.satisfies('28.4:N')` against Core 28.x — the baseline line every dependent's `versionRange` is written against — so bump that in the same pass.
4. Cross-flavor migrations with `bitcoin-core-startos` are declared inline in the current Knots version file's `migrations.other` map, keyed by Core version strings. When Bitcoin Core bumps its `:N`, add the matching entries here so the migration path runs.

> Sibling Knots branches (`29.x`, `29.x-prerdts`) share the Bitcoin Core revision suffix tracked by `.satisfies('29.4:N')` — bump one, bump the other in tandem. They do **not** share the upstream release: `29.x` tracks current Knots releases; this branch stays pinned to `29.3.knots20260507`.
