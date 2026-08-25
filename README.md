<p align="center">
  <img src="icon.svg" alt="Bitcoin Knots Logo" width="21%">
</p>

# Bitcoin Knots (RDTS) on StartOS

> Everything not listed in this document should behave the same as upstream
> Bitcoin Knots. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Bitcoin Knots](https://github.com/bitcoinknots/bitcoin) is a derivative of Bitcoin Core with a larger set of policy controls and a built-in wallet surface. **This flavor follows the RDTS chain** — a separate blockchain from the one Bitcoin Core and Bitcoin Knots (pre-RDTS) follow. Read [RDTS Chain Opt-In](#actions) before installing it. Like the other bitcoind flavors it runs with an embedded I2P router beside it and, when pruned, a block-fetching RPC proxy in front.

- **Upstream repo:** <https://github.com/bitcoinknots/bitcoin>
- **Wrapper repo:** <https://github.com/Start9Labs/bitcoin-knots-startos/tree/29.x>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The node binary does not come from a registry. The repo's own `Dockerfile` downloads the upstream release tarball from `bitcoinknots.org`, verifies it, and copies `bitcoind` and `bitcoin-cli` onto a slim Debian base. Three registry images run alongside it.

| Property      | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| Image         | Built from `Dockerfile` — upstream release binaries on `debian:stable-slim` |
| Architectures | x86_64, aarch64, riscv64                                                    |
| Entrypoint    | `bitcoind`                                                                  |

Verification is a signer quorum rather than a single trusted key: `SHA256SUMS.asc` must carry good signatures from a quorum of **distinct** signers holding keys committed under `assets/release-keys/`, counted by primary fingerprint so that one signer's subkeys cannot vote twice, and the keyring is asserted equal to the pinned set so a stray key cannot join the count. Only then is the tarball checked against `SHA256SUMS`. The runtime image adds `curl` (the snapshot download shells out to it), `jq`, `yq`, `tini`, and `e2fsprogs`.

| Subcontainer   | Image                   | Lifetime                 | Purpose                                                                                                                                                                                                                                    |
| -------------- | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bitcoind-sub` | built locally           | the running service      | The `bitcoind` daemon — this is the one to `attach` to                                                                                                                                                                                     |
| `i2pd-sub`     | `purplei2p/i2pd`        | while I2P is enabled     | Embedded I2P router: SAM bridge, SOCKS proxy, I2PControl                                                                                                                                                                                   |
| `proxy-sub`    | `btc-rpc-proxy`         | while the node is pruned | Serves RPC on 8332 and fetches pruned blocks over p2p                                                                                                                                                                                      |
| _temporaries_  | built locally, `python` | seconds to hours         | One per action that shells out — `assumeutxo`, `delete-peers`, `delete-txindex`, `delete-coinstats`, `getnetworkinfo`, `getblockchaininfo`, every Wallet-group action, and `rpc-auth-generator` (the `python` image, running `rpcauth.py`) |

Three oneshots bracket the daemons. `nocow` sets the btrfs no-COW attribute across the data directory and must finish before `bitcoind` starts. `synced-true` and `chain-recovery` run after it, and are described under [Installation and First-Run Flow](#installation-and-first-run-flow).

The i2pd image has no riscv64 build and is declared `emulateMissingAs: 'x86_64'`, so on riscv64 hardware the I2P router runs emulated.

## Volume and Data Layout

Two volumes. Everything the node writes lives in one; the embedded I2P router keeps its own.

| Volume | Mount Point      | Purpose                                                                                                                                       |
| ------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` | `/root/.bitcoin` | The bitcoind data directory — `bitcoin.conf`, `blocks/`, `chainstate/`, `indexes/`, wallets, `peers.dat`, the RPC `.cookie`, and `store.json` |
| `i2pd` | `/home/i2pd`     | i2pd's data directory — `data/i2pd.conf`, the router identity, and its netDb                                                                  |

`store.json` sits inside the bitcoind data directory rather than on a volume of its own; it holds StartOS-side state, not upstream configuration. The Download UTXO Snapshot action additionally mounts the `main` volume's `tmp` subdirectory at `/tmp` inside its own subcontainer, so a part-downloaded snapshot occupies the data volume rather than container storage.

## File Models

Three models, and ownership is decided per key rather than per file: some keys are enforced on every write, some are seeded once and then yours, and one is derived from the addresses StartOS has published.

| File                          | Format | Modelled                | Written by                                                                                                      |
| ----------------------------- | ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/root/.bitcoin/bitcoin.conf` | INI    | Yes — `FileHelper.ini`  | Install, every init, the four config actions, the RPC-user actions, `watchHosts`, and the `synced-true` oneshot |
| `/root/.bitcoin/store.json`   | JSON   | Yes — `FileHelper.json` | Install, every init, `main`, and several actions                                                                |
| `/home/i2pd/data/i2pd.conf`   | INI    | Yes — `FileHelper.ini`  | Init, plus one version migration (the one-time bandwidth raise)                                                 |

**A key the package does not model is left alone.** Both INI models parse loosely, so a setting you add by hand that the schema does not declare rides through every rewrite untouched. Everything below concerns the keys the package _does_ declare.

### bitcoin.conf

**Enforced** — rewritten to a fixed value whenever the package writes the file: `rpcbind`, `rpcallowip`, `rpccookiefile`, `listen`, `whitebind`, and `deprecatedrpc`. The first two are derived from whether the node is pruned; the rest are constants. `rpcuser` and `rpcpassword` are modelled as "must be absent", so a value on disk is discarded on the next write rather than honoured. Unlike Bitcoin Core, `mempoolfullrbf` **is** configurable here.

**Knots exposes far more policy than Core does**, and this package models all of it: parasite and token rejection, bare pubkey, anchor and datacarrier permissions, script and legacy-sigop limits, datacarrier cost, ancestor and descendant limits, dust relay fee, ephemeral and unknown-witness handling, mempool replacement and TRUC policy, coin-age and maturity relay floors, and block template sizing. Each is a plain configurable key with Knots' own default when unset.

Two keys are specific to this flavor:

| Key              | Value                | Why                                                                                                                                                                                                              |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `consensusrules` | `rdts`, when present | Records your consent and silences the binary's hourly warning. It does **not** gate enforcement — this build enforces RDTS either way — so deleting it is a supported choice and the model will not resurrect it |
| `maxtipage`      | 14 days              | Upstream suppresses transaction relay while the tip is older than its default, and the RDTS chain produces a block only every day or two. Any other value is pinned back to this one                             |

**Seeded at install and then yours.** Install overrides these and nothing else:

| Key                                                                                  | Upstream default             | Seeded value                                     | Why                                    |
| ------------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------ | -------------------------------------- |
| `zmqpubrawblock`, `zmqpubhashblock`, `zmqpubrawtx`, `zmqpubhashtx`, `zmqpubsequence` | off                          | ports 28332 (block) and 28333 (transaction)      | Dependent services subscribe to them   |
| `blockfilterindex`                                                                   | off                          | `basic`                                          | Dependents need BIP158 filters         |
| `dbcache`                                                                            | 450 MiB                      | 25% of system RAM, capped at 5120 MiB            | Faster initial sync                    |
| `dbbatchsize`                                                                        | 16 MiB                       | Scaled to system RAM, between 16 and 32 MiB      | Faster initial sync                    |
| `prune`                                                                              | 0 (archival)                 | The 550 MiB floor, on disks below roughly 900 GB | Fit the chain to the disk              |
| `i2psam`                                                                             | off                          | The embedded I2P router's SAM address            | I2P peering without a separate service |
| `assumevalid`                                                                        | A hash built into the binary | A hash pinned by this package                    | —                                      |

These are starting points, not assertions: nothing re-imposes them, so changing one in the config forms sticks. The two sync-boost values are the exception, and they are removed rather than re-asserted — see below.

**Derived**: `externalip` is written by `watchHosts` from the addresses actually published on the peer interface — onion addresses contributed by the Tor plugin, plus public IPv4 — and re-asserted whenever that list changes. Editing it by hand does not stick.

**Cleared automatically**: `dbcache` and `dbbatchsize` are an initial-sync boost. The `synced-true` oneshot deletes both keys from the file when sync completes, freeing the RAM. Set them again afterwards if you want the larger values permanently.

Two timing details decide when a hand edit is corrected. The enforced keys are repaired whenever the package writes the file **at all** — every init (install, update, restore) and every config action — but not on a plain restart, so an edit can survive until one of those happens. And because `main` watches the whole parsed file, any write that actually changes a value restarts the service; a form submitted unchanged is not written and does not restart.

Three values are coerced rather than enforced: a `prune` target between 1 and the 550 MiB floor is raised to the floor, a `maxconnections` below 40 is raised to 40, and `i2p` is dropped from `onlynet` while `i2psam` is absent, because bitcoind refuses to start restricted to a network it has no proxy for. That drop never empties `onlynet`: an empty list is no restriction at all, so where `i2p` is the only entry the `i2psam` address is restored instead, and a node confined to I2P is never handed clearnet. For the same reason `onlynet` is the one field whose invalid values are not repaired — an entry the package does not offer, `cjdns` or a typo, is written back untouched, and bitcoind refusing to start on it beats the package quietly deleting the restriction.

### i2pd.conf

Written at init, which is what makes most of it yours. `merge` fills in missing keys from their defaults and repairs invalid ones; a valid value you set survives — `bandwidth` accepts `L`, `O`, `P`, `X`, or a number in KB/s. The one exception, once: the release that raised the shipped bandwidth default from `L` to `O` also raises an existing `bandwidth = L` in a single migration write, because the package cannot tell its own old default from a hand-set `L`. That release's notes disclose it; any value set afterwards, `L` included, sticks.

The exceptions are literals, repaired at the next init: `log=stdout` and `loglevel=warn` (pinned at `critical` in earlier revisions, which is how a failing SAM bridge left no trace at all), and the loopback addresses for the SOCKS proxy and I2PControl, neither of which may be exposed beyond the service's own network namespace. Everything else — bandwidth class, transit share and tunnel limits, the listen port, the web console — is a default only, and is the supported way to tune i2pd, since none of it is in the StartOS UI. Two of those defaults are policy rather than tuning: `bandwidth=O` and `notransit=true`. i2pd's bandwidth, share and transit-tunnel limits all cap **transit** — traffic relayed for other I2P users — and none of them touches the node's own, so refusing transit is what takes relayed traffic to zero while `O` keeps the advertised capacity that makes this router's own LeaseSet publication land. Setting `notransit=false` turns relaying back on, bounded by `bandwidth` and `share`. Enabling `http.enabled` is what publishes the I2P console interface.

### store.json

StartOS-side state, none of it upstream configuration. `reindexBlockchain` and `reindexChainstate` are one-shot flags: the next start converts each into a bitcoind argument and clears it. `fullySynced` gates the Sync Complete notification, `snapshotInUse` records that a UTXO snapshot is loaded, and `reconsiderInvalidTips` and `rdtsEnforcedLastRun` drive chain-split recovery. `selectedWallet` records which wallet the Wallet-group actions operate on.

`rdtsAcknowledged` records the RDTS opt-in, and is **deliberately not declared by the other flavors**, whose shapes strip it — so switching away and back is a fresh opt-in to a separate network and prompts again.

The store is shared across bitcoind flavors along with the rest of the volume, which is why every flavor declares all of these keys — including ones it never acts on.

## Dependencies

One, optional and conditional on how the node is configured.

| Dependency | Kind      | Health checks | Mounts | Why                                                                  |
| ---------- | --------- | ------------- | ------ | -------------------------------------------------------------------- |
| Tor        | `running` | none          | none   | Outbound peer connections over Tor, and advertising an onion address |

It becomes a running dependency only when the node is actually set up for onion connectivity — an `externalip` containing a `.onion`, or an `onlynet` that includes `onion`. Otherwise the package declares nothing and starts without Tor.

Tor's SOCKS address is resolved over the service bridge with a fallback port, so `-onion` is passed on **every** start whether or not Tor is installed. A missing Tor is a connection refused, not an error, and the fallback keeps the address stable across Tor being installed, updated, or removed, so those events do not restart Bitcoin.

## Network Access and Interfaces

Two interfaces always, two more when ZeroMQ is enabled, and one more when the I2P web console is. A sixth binding exists with no interface attached to it at all.

| Interface          | Id            | Type | Port                   | Present                                         |
| ------------------ | ------------- | ---- | ---------------------- | ----------------------------------------------- |
| RPC                | `rpc`         | api  | 8332                   | always                                          |
| Peer               | `peer`        | p2p  | 8333 (container 58333) | always                                          |
| ZeroMQ Block       | `zmq-block`   | api  | 28332                  | when ZeroMQ is enabled                          |
| ZeroMQ Transaction | `zmq-tx`      | api  | 28333                  | when ZeroMQ is enabled                          |
| I2P Daemon Console | `i2p-console` | ui   | 7070                   | when `i2psam` is set and the i2pd console is on |

Block and transaction notifications are two interfaces rather than one because bitcoind publishes them on separate ports, so a dependent that needs only one of them (LND, for instance) can resolve it independently.

**Port 8332 does not always belong to bitcoind.** Unpruned, bitcoind binds `0.0.0.0:8332` directly. Pruned, it binds `127.0.0.1:58332` and `btc-rpc-proxy` takes 8332 and forwards to it, additionally fetching blocks the node has pruned from the p2p network on demand and verifying them against their hash, merkle root, and witness commitment before answering. The switch is automatic, and the interface, port, and credentials are identical either way.

**`peer-local` is a binding, not an interface, and dependents have to know the difference.** bitcoind plain-`bind`s container port 58333 and `whitebind`s 58334. The `peer` interface maps onto the first; the `peer-local` host publishes the second with no exported interface, which keeps it on loopback and the LXC bridge — never the LAN, never the internet. A dependent that pulls historical blocks over p2p (electrs, NBXplorer) resolves it with `sdk.host.getBridgeAddress({ hostId: peerLocalHostId, internalPort: peerPortLocal })` and connects with `noban`, `download`, and `mempool` permissions, exempt from inbound eviction and from the upload-target cutoff. Both exemptions presuppose an inbound slot to take. bitcoind reserves 11 connections for its own outbound peers, so below 12 there is no inbound capacity at all; and because Core protects up to 28 candidates before it will evict any of them, a full node cannot evict one to seat a whitelisted arrival either until it holds roughly 29 inbound peers — under that the connection is dropped at accept whatever its permissions. The config field floors at 40, the smallest value that leaves those 29 slots. Pointed at `peer` instead, it lands on the plain bind with no permissions, in the same pool as anonymous inbound peers.

## Installation and First-Run Flow

There is no setup wizard, no credential to enter, and no task raised at install — the node begins its Initial Block Download as soon as it is started. What install does do is size two settings to the hardware it landed on.

1. **Disk-aware sizing.** On a disk below roughly 900 GB, `prune` is seeded to the 550 MiB floor and the Transaction Index field is disabled in the form; above it, the node is archival. Pruning also forces `txindex` off whenever it is on.
2. **Seeded divergences.** The ZeroMQ publishers and `blockfilterindex` are switched on because dependent services need them, `i2psam` points at the embedded router, `dbcache` and `dbbatchsize` are scaled to system RAM for the duration of the sync, and `assumevalid` is pinned.
3. **Every init repairs all three models.** Install, update, and restore each merge `store.json`, `i2pd.conf`, and `bitcoin.conf`, which fills in missing keys and corrects invalid ones. An update is therefore how a new enforced value reaches an existing install.
4. **`externalip` is derived, not asked for.** It follows whatever addresses are published on the peer interface, so adding a Tor address there is what makes the node advertise it and what turns Tor into a running dependency.
5. **Every start** runs `nocow` and `clean-chainstate-old` before bitcoind, and `chain-recovery` immediately after RPC answers.
6. **When sync completes**, `synced-true` posts a Sync Complete notification and clears the two cache settings. It fires once per data directory; a reindex resets the flag, so it fires again when that finishes.

### First start after a flavor switch

Bitcoin Core and the Bitcoin Knots flavors share the `bitcoind` package id, and therefore one data directory — switching between them keeps the synced chain. bitcoind also persists a validity verdict for every block it has evaluated, trusts those verdicts verbatim at startup, and does not record which consensus rules produced them. Around a BIP-110 (RDTS) chain split that inheritance is a hazard in both directions; only one direction lands here, because Bitcoin Core never enforces RDTS.

`store.json` carries `rdtsEnforcedLastRun`, which every flavor writes on every start and this one always writes `false`. Finding anything else — `true` from the enforcing flavor, or no marker at all on a data directory last advanced by a package version predating it — is read as a change of enforcement regime, and the `chain-recovery` oneshot then runs `reconsiderblock` on every invalid chain tip so those branches are re-evaluated under this binary's rules. Reconnection is a full validation, so a genuinely invalid branch re-flags itself, and with no invalid tips the pass is a no-op.

The oneshot depends only on `bitcoind`, so it never holds up the service, and every consequential outcome posts a notification. Two things it cannot do. A tip whose fork point lies below the prune horizon is skipped, because reorganizing onto it would need blocks the node no longer stores; the notification for that points at Reindex Blockchain, which on a pruned node means re-downloading the chain. And clearing a verdict only lets the node _accept_ a chain — actually following it still requires peers serving it.

## Actions

Twenty-six actions, twenty-four of them user-facing. The OS already carries each one's name, description, warning, visibility, permitted statuses, and input schema; what follows is what it cannot. One thing applies to all of them that write `bitcoin.conf`: `main` watches the whole file, so a write that changes any value restarts the node, while a form submitted unchanged is not written and does not restart.

### Mempool, Peer, RPC, and Other Settings

The four configuration actions. Each writes only the fields it presents, and each costs seconds plus a restart. All are safe to re-run; the form is pre-filled from the current file, so re-running without editing is a no-op.

- **Other Settings** carries the two consequential ones. Turning pruning **off** sets the reindex flag, so the next start rebuilds the databases from the blocks already on disk. Turning it **on** moves RPC behind the proxy and forces `txindex` off.
- **Peer Settings** is where the embedded I2P router is switched on and off; turning the SAM proxy off here stops the router, swaps the I2P health check for a disabled placeholder, and drops `i2p` from Onlynet if it was selected. It refuses the submission outright when `i2p` is the only network in Onlynet, the one case where dropping it would widen the node rather than narrow it.
- **Mempool Settings** and **RPC Settings** are plain field edits with no side effects beyond the restart.

### Generate RPC User Credentials, Delete RPC Users

Run **Generate RPC User Credentials** to give an external wallet or app its own login; dependent StartOS services do not need it. It appends an `rpcauth` entry to `bitcoin.conf` and returns the generated password once, masked and copyable — only a hash is stored, so a lost password cannot be recovered. Re-running with a username that already exists returns an error rather than replacing it, so it is safe to retry.

**Delete RPC Users** removes selected entries and is disabled when there are none. Deleting a user immediately breaks anything still authenticating as it.

### Reindex Blockchain, Reindex Chainstate

Both set a flag in `store.json` and then restart the node if it is running, or take effect at the next start if it is not; the reindex itself happens inside bitcoind. Both also clear `fullySynced`, so the Sync Complete notification fires again at the end.

**Reindex Blockchain** rebuilds the block and chainstate databases from genesis. On an archival node it re-uses the blocks on disk; on a pruned node it is equivalent to syncing from scratch, which can take weeks on modest hardware. **Reindex Chainstate** rebuilds only the chainstate and is strictly faster, and is hidden on pruned nodes, where it does not apply. Reach for either only for suspected corruption — they are safe to repeat, but each costs a full rebuild.

### Delete Peer List, Delete Transaction Index, Delete Coinstats Index

Three recovery actions for a corrupted file, each requiring the service to be stopped because bitcoind holds these open while running. Each deletes one thing and nothing else; the node recreates it on the next start.

| Action                   | Removes                  | Cost of the rebuild                          |
| ------------------------ | ------------------------ | -------------------------------------------- |
| Delete Peer List         | `peers.dat`              | None — peers are rediscovered                |
| Delete Transaction Index | `indexes/txindex`        | A full re-index over the chain on next start |
| Delete Coinstats Index   | `indexes/coinstatsindex` | A full re-index over the chain on next start |

All three are idempotent: deleting a file that is already gone succeeds.

### Download UTXO Snapshot (assumeutxo)

Bootstraps a new node from a UTXO snapshot instead of waiting out a full sync. Run it on a node that is still syncing; it is hidden once the node is fully synced, and disabled while a download is running or a snapshot is already loaded.

- **What it changes:** downloads the snapshot into `tmp/` on the `main` volume, loads it with `loadtxoutset` as the active chainstate, and sets `snapshotInUse` in `store.json`.
- **Cost:** hours. The download is bounded by a transfer-speed floor rather than a deadline, and it then waits — up to six hours — for the node's headers to reach the snapshot height before loading. Background sync from genesis continues underneath and eventually validates up to that height.
- **What happens next:** the action returns as soon as the download starts, so the work outlives the request. Success is visible as the chainstate jumping forward; failure arrives as a [task](#tasks).
- **Repeat safety:** safe to re-run, but not resumable across attempts. The temporary file is deleted whether the attempt succeeded or failed — `loadtxoutset` consumes it — so a retry downloads from scratch.
- **Trust:** the snapshot is checked against a hash compiled into bitcoind, but the URL is fetched before that check, so only use a source you trust. A file you serve yourself over the LAN is a good one.

### Runtime Information

A read-only snapshot for diagnosis: peer counts split inbound and outbound, block height against synced height, sync percentage, and soft-fork and BIP9 signalling state. Requires the service to be running, changes nothing, and is free to repeat.

### Wallet — Select Wallet, Get Balance, Get Address, Send Coins, Send All Coins, Sign Message, Backup wallet, Restore wallet, Remove wallet

Knots' built-in wallet, surfaced as actions. All nine are grouped under **Wallet**, all are **only available while the service is running**, and **all nine disappear entirely when `disablewallet` is on** — so a node configured without a wallet shows none of them.

- **Select Wallet** decides which wallet every other action in the group operates on, and its description names the current selection. The default is the historical hardcoded wallet name, so an existing install is unchanged.
- **Get Balance** and **Get Address** read; Get Address returns a new segwit address each time.
- **Send Coins** and **Send All Coins** spend. Both are irreversible once broadcast.
- **Sign Message** signs with one of the wallet's addresses.
- **Backup wallet** writes the wallet to a file **so that StartOS's own backup captures it** — the wallet's live database is not otherwise in a backup-safe state. **Restore wallet** reads that file back, and **Remove wallet** deletes the selected wallet from the node.

**On the RDTS chain, spending needs extra care.** The two chains share no replay protection, so a transaction broadcast here can be replayed on the other chain and spend the same coins there.

### Prioritize Transaction

Raises or lowers a transaction's effective fee in this node's own mempool, using a fee delta.

- **Cost:** seconds. No restart, and only while running.
- **It affects this node only.** The delta is local mempool bookkeeping — it changes what your node prefers to include or relay, not what the network charges.

### Hidden: RDTS Chain Opt-In, Auto-Configure, Create RPC Credentials

All three are `visibility: 'hidden'` — not user-facing, and never something to tell a user to run. **RDTS Chain Opt-In** is surfaced only by the `critical` task below; it carries the full warning about what following the RDTS chain means and records your acknowledgement. **Auto-Configure** is how a dependent service requests configuration; the surface it can reach is deliberately narrow (block filters, `blocknotify`, coinstats index, bloom filters, pruning, `txindex`, ZeroMQ), and `raw` — with `rpcauth`, `whitelist`, `externalip`, and the peer lists — is unreachable from it. **Create RPC Credentials** lets a dependent register an `rpcauth` user with a password it already holds, subject to a minimum length the user cannot override.

## Tasks

Two tasks. One blocks on a decision you have to make before this node is meaningful; the other reports a failure that happens after the action causing it has already returned.

| Task                   | Severity    | Raised when                                                       | Cleared when            |
| ---------------------- | ----------- | ----------------------------------------------------------------- | ----------------------- |
| RDTS Chain Opt-In      | `critical`  | The RDTS opt-in has not been acknowledged                         | The action runs         |
| Download UTXO Snapshot | `important` | A snapshot download or load fails; the error is the task's reason | The action is run again |

**The opt-in is `critical` because installing this flavor is not an update — it moves the node onto a different blockchain and a different network.** The action's warning states the two consequences in full: the RDTS chain kept Bitcoin's difficulty but attracted a small fraction of its hashpower, so blocks arrive roughly once every day or two and the node will look healthy while standing still; and the two chains share no replay protection, so a transaction broadcast on one can be replayed on the other.

The opt-in lives in `store.json`, not in `consensusrules` — that option is pinned by the file model and says nothing about what you agreed to. It is checked on every init, so clearing it prompts again.

The snapshot task is `important` rather than `critical`, deliberately: a node without a snapshot syncs normally, so nothing should be blocked. It can return — a second failed attempt raises it again with the new error.

## Health Checks

Seven checks at most, and three of them can never report a failure: they describe the node's reachability posture rather than its health.

| Check           | Displayed       | Probes                                                                                       | Grace       | Present                                    |
| --------------- | --------------- | -------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------ |
| `bitcoind`      | RPC             | Waits for `.cookie` to appear, then that the RPC port is listening                           | SDK default | always                                     |
| `sync-progress` | Blockchain Sync | `getblockchaininfo` plus `getchaintips`, every 30 s (5 s while starting or failing)          | —           | always                                     |
| `index-sync`    | Index Sync      | `getindexinfo`, plus `getblockchaininfo` only while an index is behind, on the same schedule | —           | always                                     |
| `i2pd`          | I2P             | i2pd's I2PControl `RouterInfo` on loopback                                                   | 5 minutes   | while I2P is enabled                       |
| `i2p`           | I2P             | nothing — a `disabled` placeholder in place of the daemon check                              | —           | while I2P is off, or excluded by `onlynet` |
| `tor`           | Tor             | Tor's installed and running state, and whether an onion address is published                 | —           | always                                     |
| `clearnet`      | Clearnet        | Whether a non-onion address is published                                                     | —           | always                                     |
| `proxy`         | RPC Proxy       | That the proxy's port is listening                                                           | —           | while the node is pruned                   |

**`bitcoind` failing** means the RPC port never opened. The cookie is deleted at the start of every run and recreated by bitcoind itself, so a check still waiting on it is one where bitcoind is not reaching the point of serving RPC — read the service logs for a startup or database error rather than looking for a networking fault.

**`sync-progress` is a progress meter, not a fault indicator.** It reports a percentage for the whole of the Initial Block Download, which legitimately runs for hours to days. `initialblockdownload` alone is not trusted here: `-maxtipage` is pinned to 14 days for this chain, so the flag clears while a fresh sync is still far from the tip. Success therefore needs either that flag clear _and_ fewer than ten blocks in flight, or `getchaintips` reporting no non-invalid tip above the active one. It reports `starting` whenever the RPC call fails, which is normal while the node is coming up; when the failure is RPC warmup (`-28`) the message carries bitcoind's own account of what it is doing, so a long `Verifying blocks…` or the `Replaying blocks…` that follows an unclean stop is visible rather than indistinguishable from a hang. Before the first block connects it reports the height of the header chain rather than a block percentage that would sit at 0.00% for the whole of that phase. The two chain checks share one probe for their RPC calls, so both separate a node that is not answering yet — `starting` — from a call that could not be run at all or a reply that could not be parsed, which is the only condition under which either reports `failure`.

**`index-sync` is separate from `sync-progress` because the indexes are.** `getindexinfo` lists only the indexes actually enabled, so the check reports `disabled` when there are none and success when every one of them sits at the tip — the normal state throughout IBD, where an index follows block connection rather than trailing it. It goes to `loading` when one falls behind, naming the furthest behind and its height as a percentage of the chain tip. The case it exists for is enabling an index on a node that is already synced: that starts a backfill from the first block, during which `getrawtransaction`, `getblockfilter`, and `gettxoutsetinfo` answer for only the part of the chain the index has reached, while `sync-progress` reports the node fully synced. An index that is behind is working, not broken, so that reads as `loading`; the only thing that reddens this check is bitcoind failing to answer or answering with something unreadable.

**`i2pd` is the one check written to distinguish "slow" from "never".** Everything reads as starting during the five-minute grace period. Past it, an empty network database means the router never reached a reseed server and will not recover on its own; a reported router error status is surfaced with its number; and a router that has reseeded but built no tunnels yet reports `starting`, because that one does resolve itself.

**It fails closed.** A reply the router cannot answer properly — a JSON-RPC error object rather than a result — carries no numbers, and every comparison above is false against nothing, so such a reply used to fall through to success on a router that had told it nothing. It now reports `starting` until there is a real answer. That matters because the check queries `RouterInfo` without authenticating, which i2pd accepts only because it never validates the token it issues; if it ever starts validating, every reply becomes an error object.

The empty-network-database case is usually not an I2P fault. Reseeding resolves hostnames over the container's resolver, which is the only thing on the node that does — bitcoind resolves through Tor's SOCKS proxy — so a server whose resolver is not answering breaks I2P alone and looks like an I2P bug. `start-cli package attach bitcoind -- sh -c 'getent hosts start9.com'` separates the two: an instant failure is a resolver that is not there, a slow one is upstream servers that are not answering. The same fault shows up in the service logs as bitcoind repeating `Couldn't listen: Cannot connect to 127.0.0.1:7656`, which is the SAM bridge, not the resolver, but the same root cause — i2pd logs at `warn`, so its own account of the failure is in those logs too.

**The i2pd stream is filtered before it reaches the service log.** At `warn` a healthy router also narrates its routine network weather at ~25 lines a minute, burying bitcoind's roughly one line a minute. The daemon's stdout and stderr pass through `startos/i2pdLogFilter.ts`, which drops exactly the measured weather families: transport-session timeouts and handshake failures (`Transports`/`NTCP2`/`SSU2`), peer-database maintenance (`Profiling`/`NetDbReq`), per-stream retry mechanics (`Streaming` resends, statuses, missing remote LeaseSets), tunnel build-and-test churn (`Tunnels`/`Tunnel`/`TransitTunnel`/`TunnelMessage`), SAM per-stream teardown from bitcoind's own abandoned dials (read errors, failed naming lookups), lookups for departed peers (`Destination`/`LeaseSet`), and undecryptable garlic records (`Garlic`/`ElGamal`). Every pattern is anchored to one complete known message, so any line the list has never seen still passes, and each start logs `i2pd log filter active: N known-weather families` — the way to confirm filtering is engaged. Kept on purpose, because each is failure evidence rather than weather: everything about reseeding, binding, clock skew, and router status; `SAM: Accept error` and `SAM: I2P acceptor has been reset`, the router-side signature of a SAM bridge that stopped serving; and both LeaseSet-publication complaints — `Destination: Publish confirmation was not received` and `Streaming: LeaseSet was not confirmed` — whose persistence signals real inbound-reachability trouble. Surviving router lines carry an `[i2pd] ` prefix. Dropped lines are not retained anywhere, and a dying partial line is flushed after two seconds rather than lost, so the router's last words survive a crash.

**`tor` and `clearnet` cannot fail.** Each reports `disabled` when its transport is off or excluded by `onlynet`, and otherwise success, with the message distinguishing inbound-and-outbound (an address of that kind is published on the peer interface) from outbound-only. A node with no published address is healthy; it simply cannot receive connections.

## Backups and Restore

Both volumes are copied wholesale — `sdk.Backups.ofVolumes('main', 'i2pd')`. There is no dump step and no database engine involved. What makes the backup small is the exclude list, and what it excludes is everything the node can rebuild for itself.

- **Excluded from `main`:** `blocks/`, `chainstate/`, `indexes/`, the RPC `.cookie` (regenerated every start), and any `*-journal`. That is the entire chain, so a backup is megabytes rather than hundreds of gigabytes.
- **Excluded from `i2pd`:** the router's `netDb/`, `peerProfiles/`, `addressbook/`, `tags/`, `certificates/`, and pidfile — all re-derived by reseeding. `router.info` is derived too but is kept: restoring `router.keys` without it lands i2pd on a "malformed, creating new" path that emits one `Identity` parse error per netDb entry before it recovers.
- **Included:** `bitcoin.conf`, `store.json`, wallet files, `peers.dat`, and i2pd's own `i2pd.conf` and router keys.

**A restore does not restore a synced node.** It restores the configuration, the wallets, and the package's own state; the node then performs a full Initial Block Download, rebuilding whichever indexes are enabled as it goes, and the I2P router reseeds from nothing. Download UTXO Snapshot is the supported way to shorten that wait. Until the sync finishes, a restored wallet's balance is only as complete as the chain the node has actually verified.

## Limitations and Differences

1. **Blockchain data is never backed up.** A restore re-syncs the chain from the network.
2. **`rpcuser` and `rpcpassword` are not supported.** They are removed from `bitcoin.conf` on every write; authentication is the `.cookie` file or an `rpcauth` user created through the action.
3. **`mempoolfullrbf` cannot be set** — it is modelled as must-be-absent and is deleted like the credential pair above.
4. **Pruning is chosen by disk size**, not asked for, and pruning forces `txindex` off.
5. **`getblock` verbosity 2 still fails for a pruned block.** The proxy intercepts verbosity 0 and 1 only. Verbosity 2 could not be answered faithfully anyway: its per-input fee fields need undo data a pruned node no longer holds.
6. **CJDNS is unavailable.** StartOS provides no CJDNS transport, so it is not offered as an `onlynet` option — though one hand-written into `bitcoin.conf` is preserved rather than dropped. Clearnet, Tor, and I2P are all fully supported.
7. **i2pd tuning is not in the StartOS UI.** Log level, bandwidth class, transit share, tunnel limits, and the web console are edited in `i2pd.conf` on the `i2pd` volume. The embedded router relays nothing for the I2P network (`notransit=true`); run the standalone i2pd service if you want to contribute transit capacity.
8. **Shutdown is allowed five minutes** to flush the databases before SIGKILL.
9. **The I2P router is emulated on riscv64**, which has no upstream i2pd image.
10. **This flavor follows the RDTS chain**, which is not the chain Bitcoin Core and Bitcoin Knots (pre-RDTS) follow. Blocks arrive roughly once every day or two, and the two chains share no replay protection.
11. **`consensusrules` does not gate enforcement.** This build enforces RDTS whether or not the option is present; the option only records consent and silences an hourly warning.
12. **`maxtipage` is pinned to 14 days** so transaction relay is not suppressed by the chain's slow block production.
13. **Every Wallet action disappears when `disablewallet` is on**, and all of them require the service to be running.
14. **The repo maintains one branch per flavor**, each published as the same `bitcoind` package. Release notes and pinned upstream versions differ between them.

---

## Quick Reference for AI Consumers

```yaml
package_id: bitcoind
image: ./Dockerfile # upstream release binaries on debian:stable-slim
architectures:
  - x86_64
  - aarch64
  - riscv64
subcontainers:
  - bitcoind-sub # the bitcoind daemon; the one to attach to
  - i2pd-sub # purplei2p/i2pd; only while I2P is enabled
  - proxy-sub # btc-rpc-proxy; only while the node is pruned
volumes:
  main: /root/.bitcoin
  i2pd: /home/i2pd
file_models:
  - /root/.bitcoin/bitcoin.conf
  - /root/.bitcoin/store.json
  - /home/i2pd/data/i2pd.conf
startos_managed_env_vars: []
dependencies:
  - tor # optional; a running dependency only when onion connectivity is configured
interfaces:
  rpc: { type: api, port: 8332 }
  peer: { type: p2p, port: 8333 } # container 58333; 58334 is bridge-only, no interface
  zmq-block: { type: api, port: 28332 } # only when ZeroMQ is enabled
  zmq-tx: { type: api, port: 28333 } # only when ZeroMQ is enabled
  i2p-console: { type: ui, port: 7070 } # only when the i2pd web console is enabled
actions:
  - activate-rdts # hidden; surfaced by the critical opt-in task
  - mempool-config
  - peers-config
  - rpc-config
  - other-config
  - generate-rpcuser
  - delete-rpcauth
  - reindex-blockchain
  - reindex-chainstate # hidden while pruned
  - delete-peers
  - delete-txindex
  - delete-coinstats-index
  - assumeutxo # hidden once fully synced
  - runtime-info
  - autoconfig # hidden; driven by dependents
  - generate-rpc-dependent # hidden; driven by dependents
  - select-wallet # Wallet group; only-running, hidden when disablewallet
  - get-balance # Wallet group; only-running, hidden when disablewallet
  - get-address # Wallet group; only-running, hidden when disablewallet
  - send-coin # Wallet group; only-running, hidden when disablewallet
  - send-all-coin # Wallet group; only-running, hidden when disablewallet
  - sign-message # Wallet group; only-running, hidden when disablewallet
  - backup-wallet # Wallet group; only-running, hidden when disablewallet
  - restore-wallet # Wallet group; only-running, hidden when disablewallet
  - remove-wallet # Wallet group; only-running, hidden when disablewallet
  - prioritise-transaction # only-running
tasks:
  - { action: activate-rdts, severity: critical }
  - { action: assumeutxo, severity: important }
health_checks:
  - bitcoind # the daemon's ready check, displayed "RPC"
  - sync-progress # displayed "Blockchain Sync"
  - index-sync # displayed "Index Sync"
  - i2pd # displayed "I2P"; only while I2P is enabled
  - i2p # displayed "I2P"; the disabled placeholder otherwise
  - tor
  - clearnet
  - proxy # displayed "RPC Proxy"; only while pruned
```
