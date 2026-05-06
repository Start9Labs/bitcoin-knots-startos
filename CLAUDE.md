## How the upstream version is pulled

- Image `bitcoind` is built by `Dockerfile`, which downloads the upstream Knots release from `bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/` (e.g. `PATH_VERSION=29.x`, `VERSION=29.3.knots20260210`)
- Bumping upstream: update `VERSION` and `PATH_VERSION` in `startos/manifest/index.ts` buildArgs and rename the version file `startos/versions/v<X.Y>_<N>.ts` in place
- Cross-flavor migrations with `bitcoin-core-startos` are declared inline in the current Knots version file's `migrations.other` map, keyed by Core version strings (e.g. `'28.3:9'`, `'31.0:10'`). When Bitcoin Core bumps `:N`, add corresponding entries here

> Fork of Retropex/knots-startos. Has cross-flavor migrations with Bitcoin Core.

> Has sidecar images (btc-rpc-proxy, python, i2pd) with their own version tags in manifest.
