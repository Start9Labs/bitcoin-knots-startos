# Updating the upstream version

**There will be no further upstream version.** Bitcoin Knots ships RDTS from
`29.3.knots20260508` on, and the Knots developers have confirmed no further
non-RDTS release will be cut. `29.3.knots20260507` is the last one, and this
package is pinned to it permanently.

Nothing below is a bump procedure. It is what a rebuild of the pinned release
still depends on.

## The pin

`VERSION` build-arg under `images.bitcoind.source.dockerBuild.buildArgs` in
`startos/manifest/index.ts`, paired with `PATH_VERSION = '29.x'`.

The `bitcoind` image is built locally from `Dockerfile`: it downloads the
release tarball from `bitcoinknots.org/files/${PATH_VERSION}/${VERSION}/` and
verifies `SHA256SUMS.asc` against a pinned 3-of-5 quorum of Knots release
signers (keys in `assets/release-keys/`, fingerprints in
`PINNED_FINGERPRINTS`). There is no `dockerTag` — the version lives in
`buildArgs`. If upstream retires that download path or rotates those keys, a
rebuild breaks and needs `PINNED_FINGERPRINTS` and `assets/release-keys/`
refreshed.

## The frozen `satisfies` values

The current version file carries `.satisfies('29.4:15')` and
`.satisfies('28.4:28')` — the Bitcoin Core revisions this package stands in for
when a dependent's `versionRange` is evaluated. They no longer track Core.

The consequence is worth knowing: as Bitcoin Core keeps bumping its `:N`, a
dependent that raises its floor past those two revisions stops being
satisfiable by this package. Dependents drop off one at a time rather than all
at once, and nothing short of a release fixes it.

## The i2pd image

The service-log filter's drop list (`startos/i2pdLogFilter.ts`) is transcribed
verbatim from the pinned i2pd image's message wording. Bumping the `i2pd` image
tag can reword those messages; that fails open — a reworded family passes the
filter and the log flood returns — rather than dropping evidence, but it means
an i2pd bump owes a re-validation: run `npm test`, then watch a few hours of
live service logs and fold any reworded families back into the list (and its
test corpus). The same filter and test ship in `bitcoin-core-startos`, which
maintains its own copy.
