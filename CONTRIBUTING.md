# Contributing

This repo packages [Bitcoin Knots](https://github.com/bitcoinknots/bitcoin) for StartOS. This branch (`29.x-prerdts`) builds the `#knotsprerdts` flavor — the same Bitcoin Knots release as the `#knots` flavor (built from `29.x`), without the "Activate RDTS" critical-task gate. It's a fork of `Retropex/knots-startos` and shares the `bitcoind` package id with [bitcoin-core-startos](https://github.com/Start9Labs/bitcoin-core-startos) and the other Knots flavors, so users can switch flavors with chain data preserved.

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

This package has one primary upstream (Bitcoin Knots) plus three pinned sidecar images.

### Bitcoin Knots

The `bitcoind` image is built locally from `Dockerfile`, which downloads the Knots release tarball from `bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/`. There is no dockerTag — the version lives in `buildArgs`.

1. In `startos/manifest/index.ts`, bump the `bitcoind` image `buildArgs`:
   - `VERSION` — the full release string (e.g. `29.3.knots20260508`).
   - `PATH_VERSION` — the major track folder (e.g. `29.x`).
2. Rename the version file under `startos/versions/v<X.Y>_<N>.ts` in place and update `version` and `releaseNotes`.
3. Cross-flavor migrations with `bitcoin-core-startos` are declared inline in the current Knots version file's `migrations.other` map, keyed by Core version strings. When Bitcoin Core bumps its `:N`, add the matching entries here so the migration path runs.
4. Sibling Knots branches (`29.x`, `29.x-prerdts`) share the upstream Knots release and the Bitcoin Core revision suffix tracked by `.satisfies('29.3:N')` — bump one, bump the other in tandem.
5. Rebuild (`make`), sideload the `.s9pk`, and confirm it starts.
6. Review `README.md` and `instructions.md` for anything the bump changed.

### Sidecar images

Each sidecar has its own `dockerTag` in the manifest:

- `proxy` — `ghcr.io/start9labs/btc-rpc-proxy` (RPC proxy used when the node is pruned).
- `python` — `python:<tag>` (runs `rpcauth.py` for RPC credential generation).
- `i2pd` — `purplei2p/i2pd:release-<version>` (embedded I2P daemon).

To bump any sidecar, change the `dockerTag` line, rebuild, and verify the affected behavior still works (RPC proxy on a pruned install; `Generate RPC User Credentials`; the I2P Daemon Console).

## How to contribute

1. Fork the repository and create a branch from `29.x-prerdts`.
2. Make your changes — including the doc updates above.
3. Open a pull request.
