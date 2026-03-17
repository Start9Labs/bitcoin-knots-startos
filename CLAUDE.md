## How the upstream version is pulled
- Git submodule `bitcoin/` → checkout new tag
- Image `bitcoind` is `dockerBuild` from root (no dockerTag to update)
- Version files import from `bitcoin-core-startos` for cross-migration — update those imports when bitcoin-core versions change

> Fork of Retropex/knots-startos. Has cross-version migrations with Bitcoin Core.
