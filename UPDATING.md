# Updating the upstream version

The `bitcoind` image is built locally from `Dockerfile`: it downloads the Knots release tarball from `bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/` and verifies `SHA256SUMS.asc` against a pinned 3-of-5 quorum of Knots release signers (keys in `assets/release-keys/`, fingerprints in `PINNED_FINGERPRINTS`). There is no `dockerTag` — the version lives in `buildArgs`. This branch tracks **Bitcoin Knots 29.x** releases only.

## Determining the upstream version

- **Bitcoin Knots 29.x** — [bitcoinknots/bitcoin](https://github.com/bitcoinknots/bitcoin)
  - Latest 29.x release tag:
    ```sh
    gh release list -R bitcoinknots/bitcoin --limit 50 --json tagName -q '.[].tagName' | grep -E '^v29\.' | head -1
    ```
    Knots' tag format is `v29.<x>.knots<YYYYMMDD>`; strip the leading `v` for the `VERSION` build-arg.
  - Current pin: `VERSION` build-arg under `images.bitcoind.source.dockerBuild.buildArgs` in `startos/manifest/index.ts` (paired with `PATH_VERSION = '29.x'`).

## Applying the bump

1. In `startos/manifest/index.ts`, bump the `bitcoind` image `buildArgs`:
   - `VERSION` — the full release string (e.g. `29.3.knots20260508`).
   - `PATH_VERSION` — the major track folder (e.g. `29.x`); only changes when the series rolls.
2. If upstream rotated release signers, update `PINNED_FINGERPRINTS` in `Dockerfile` and refresh the keys in `assets/release-keys/`.
3. Knots' `version` string stays put; `.satisfies('29.4:N')` in the current version file tracks Bitcoin Core 29.x's current `:N`. When Core 29.x bumps `:N`, update the `satisfies` argument here to match. The current version file also carries `.satisfies('28.4:N')` against Core 28.x — the baseline line every dependent's `versionRange` is written against — so bump that in the same pass.
4. Cross-flavor migrations with `bitcoin-core-startos` are declared inline in the current Knots version file's `migrations.other` map, keyed by Core version strings. When Bitcoin Core bumps its `:N`, add the matching entries here so the migration path runs.

> Sibling Knots branches (`29.x`, `29.x-prerdts`) share the Bitcoin Core revision suffix tracked by `.satisfies('29.4:N')` — bump one, bump the other in tandem. They do **not** share the upstream release: this branch tracks current Knots releases; `29.x-prerdts` stays pinned to `29.3.knots20260507`, the last pre-RDTS release.
