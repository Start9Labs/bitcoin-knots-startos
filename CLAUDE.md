## How the upstream version is pulled
- Git submodule `bitcoin/` → checkout new tag
- Image `bitcoind` is `dockerBuild` from root (no dockerTag to update)
- Cross-version migrations with `bitcoin-core-startos` are declared inline in `startos/versions/` using the Core version strings (e.g. `'28.3:7'`, `'29.3:7'`, `'30.2:7'`) — keep these in sync when Bitcoin Core publishes new revisions

> Fork of Retropex/knots-startos. Has cross-version migrations with Bitcoin Core.
