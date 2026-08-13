# TODO

- **Long `bitcoin-cli` calls in the chain-recovery oneshot get killed mid-flight.** Seen
  twice on a live flavor switch (demo.local, 2026-08-13), in both directions:
  `getdeploymentinfo failed (null)` while RPC was in warmup during the ~65 s RDTS
  re-validation, and `reconsiderblock failed (null)` during the reorg back to Core, which
  surfaced a "Chain Recovery Failed" notification to the user. `exitCode === null` is a
  killed process, not a non-zero exit, so `cli()` in `forkRecovery.ts` reports it as a
  failure even though the work succeeded — the reorg completed either way, only the
  bookkeeping was lost, leaving `reconsiderInvalidTips` set. Two things to fix: whatever
  bounds the exec (`-rpcwait -rpcclienttimeout=0` means the CLI itself never gives up, so
  the kill comes from above), and `isRdtsEnforcing` being called outside the oneshot's
  try/catch, which fails the whole oneshot and skips the `rdtsEnforcedLastRun` write.
  Pre-existing — untouched by the sync-check change.

- **Propagate the sync health check to the other bitcoind flavors.** The logic is correct
  for all of them — on the majority chain, IBD set plus a contender above the active tip
  is exactly a real sync — so `bitcoin-core` `28.x`–`31.x` and `bitcoin-knots`
  `29.x-prerdts` should pick it up. The `maxtipage` override does **not** travel with it:
  24 h is right on a chain that produces a block every ten minutes. Note those flavors
  keep the plain `!initialblockdownload` fast path, without the in-flight-blocks term
  this one needs. One package at a time.
