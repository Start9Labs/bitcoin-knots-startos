## How the upstream version is pulled
- Git submodule `bitcoin/` → checkout new tag
- Image `bitcoind` is `dockerBuild` from root (no dockerTag to update)
- Cross-flavor migrations with `bitcoin-core-startos` and `bitcoind-knots` are declared inline in `startos/versions/` using the hardcoded version strings (e.g. `'28.3:7'`, `'29.3:7'`, `'30.2:7'`, `'#knots:29.3:4'`) — keep these in sync when Core or Knots publishes new revisions

> Fork of Retropex/knots-startos. Has cross-version migrations with Bitcoin Core and Knots.
