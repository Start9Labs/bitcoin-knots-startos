## How the upstream version is pulled

- Image `bitcoind` is built by `Dockerfile`, which downloads the bip-110 fork release from `github.com/dathonohm/bitcoin/releases/download/v${VERSION}/` (e.g. `VERSION=29.3.knots20260210+bip110-v0.4.1`)
- Bumping upstream: update `VERSION` in `startos/manifest/index.ts` buildArgs and rename the version file `startos/versions/v<X.Y>_<N>.ts` in place
- Cross-flavor migrations with `bitcoin-core-startos` AND `bitcoin-knots-startos` (`next`) are declared inline in the current version file's `migrations.other` map, keyed by Core version strings (e.g. `'28.3:9'`) and Knots-prefixed version strings (e.g. `'#knots:29.3:6'`). When Core or Knots bumps `:N`, add corresponding entries here

> Fork of Retropex/knots-startos. Has cross-flavor migrations with Bitcoin Core and Knots.

> Has sidecar images (btc-rpc-proxy, python, i2pd) with their own version tags in manifest.
