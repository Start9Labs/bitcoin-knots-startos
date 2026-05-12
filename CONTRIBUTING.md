# Contributing

This repo packages [Bitcoin Knots plus the BIP-110 patch](https://github.com/dathonohm/bitcoin) for StartOS. It's a fork of `Retropex/knots-startos` and shares the `bitcoind` package id with [bitcoin-core-startos](https://github.com/Start9Labs/bitcoin-core-startos) and the upstream Knots `next` branch, so users can switch flavors with chain data preserved.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (image, volumes, interfaces). For developers and AI assistants.
- **`instructions.md`** — the user-facing instructions packed into the `.s9pk` and shown on the **Instructions** tab in StartOS, for the person running the service.
- **`CONTRIBUTING.md`** — this file.
- **`CLAUDE.md`** — operating rules for AI developers working in this repo.

**Any code change that warrants it must update `README.md` and `instructions.md` in the same change** — a new or renamed action, an added or removed volume / port / interface / dependency, a changed default, a new limitation, any altered user-visible behavior. Don't defer: a package that ships with a stale README or stale instructions is not done, even if the code is perfect. Content rules live in the packaging guide: [Writing READMEs](https://docs.start9.com/packaging/writing-readmes.html) and [Writing Service Instructions](https://docs.start9.com/packaging/writing-instructions.html).

## Building

See the [StartOS Packaging Guide](https://docs.start9.com/packaging/) for environment setup, then:

```bash
npm ci    # install dependencies
make      # build the universal .s9pk
```

## Updating the upstream version

This package has one primary upstream (Bitcoin Knots + BIP-110 patch, from `dathonohm/bitcoin`) plus three pinned sidecar images.

### Bitcoin Knots + BIP-110

The `bitcoind` image is built locally from `Dockerfile`, which downloads the patched release tarball from `github.com/dathonohm/bitcoin/releases/download/v${VERSION}/`. There is no dockerTag — the version lives in `buildArgs`.

1. In `startos/manifest/index.ts`, bump the `bitcoind` image `buildArgs.VERSION` to the new release string (e.g. `29.3.knots20260210+bip110-v0.4.1`).
2. Rename the version file under `startos/versions/v<X.Y>_<N>.ts` in place and update `version` and `releaseNotes`.
3. Cross-flavor migrations with `bitcoin-core-startos` AND `bitcoin-knots-startos` (`next` branch) are declared inline in the current version file's `migrations.other` map — keyed by Core version strings (e.g. `'28.3:9'`) and Knots-prefixed version strings (e.g. `'#knots:29.3:6'`). When Core or Knots bumps its `:N`, add matching entries here so the migration path runs.
4. Sibling Knots branches (`next`, `bip-110/next`) share a Bitcoin Core revision suffix — bump one, bump the others in tandem.
5. Rebuild (`make`), sideload the `.s9pk`, and confirm it starts.
6. Review `README.md` and `instructions.md` for anything the bump changed.

### Sidecar images

Each sidecar has its own `dockerTag` in the manifest:

- `proxy` — `ghcr.io/start9labs/btc-rpc-proxy` (RPC proxy used when the node is pruned).
- `python` — `python:<tag>` (runs `rpcauth.py` for RPC credential generation).
- `i2pd` — `purplei2p/i2pd:release-<version>` (embedded I2P daemon).

To bump any sidecar, change the `dockerTag` line, rebuild, and verify the affected behavior still works (RPC proxy on a pruned install; `Generate RPC User Credentials`; the I2P Daemon Console).

## How to contribute

1. Fork the repository and create a branch from `bip-110/next`.
2. Make your changes — including the doc updates above.
3. Open a pull request to `bip-110/next`.
