<p align="center">
  <img src="icon.png" alt="Bitcoin Knots Logo" width="21%">
</p>

# Bitcoin Knots (pre-RDTS) on StartOS

> **Upstream docs:** <https://bitcoinknots.org/>
>
> Everything not listed in this document should behave the same as upstream
> Bitcoin Knots. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable.

An enhanced Bitcoin full node implementation with additional policy controls for mempool filtering and spam prevention. See the [upstream repo](https://github.com/bitcoinknots/bitcoin) for general Bitcoin Knots documentation.

This package shares the `bitcoind` package ID with [Bitcoin Core](https://github.com/Start9Labs/bitcoin-core-startos) and the other Knots flavors (`#knots`, the retiring `#knotsrdts`), allowing users to switch between flavors while preserving blockchain data and dependent service connections. This flavor (`#knotsprerdts`) is for users who want to remain on pre-RDTS Knots consensus rules — it ships the last pre-RDTS Bitcoin Knots release (`29.3.knots20260507`), with no "Activate RDTS" critical-task gate. `#knots` tracks current Knots releases, which include RDTS.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Default Networking](#default-networking)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Default Overrides](#default-overrides)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Image         | Custom Dockerfile (multi-stage Alpine build from Bitcoin Knots source)       |
| Architectures | x86_64, aarch64, riscv64                                                     |
| Entrypoint    | `bitcoind`                                                                   |

The custom Dockerfile cross-compiles Bitcoin Knots with ZMQ support and adds runtime utilities (curl, yq, jq, tini).

Three additional containers are used:

| Container | Image                              | Purpose                                       |
| --------- | ---------------------------------- | --------------------------------------------- |
| `proxy`   | `ghcr.io/start9labs/btc-rpc-proxy` | RPC proxy for pruned nodes                    |
| `python`  | `python` (Alpine)                  | Runs `rpcauth.py` to generate RPC credentials |
| `i2pd`    | `purplei2p/i2pd`                   | Embedded I2P daemon (when enabled)            |

## Volume and Data Layout

| Volume | Mount Point      | Purpose                                              |
| ------ | ---------------- | ---------------------------------------------------- |
| `main` | `/root/.bitcoin` | All Bitcoin Knots data (blockchain, config, wallets) |
| `i2pd` | `/home/i2pd`     | I2P daemon data (when embedded I2P is enabled)       |

StartOS-specific files on the `main` volume:

| File         | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `store.json` | Persistent StartOS state (reindex flags, sync status, snapshot tracking) |

Blockchain data directories (`blocks/`, `chainstate/`, `indexes/`) reside on the `main` volume alongside the standard `bitcoin.conf` and `.cookie` files.

## Installation and First-Run Flow

1. On install, StartOS sets the `nocow` attribute on the data directory (btrfs optimization via `chattr -R +C`)
2. Default `bitcoin.conf` and `store.json` are seeded. Only values that **diverge** from upstream Bitcoin Knots defaults are written (see [Default Overrides](#default-overrides)); all other settings are left unset so bitcoind uses its built-in defaults. Knots-specific policy settings (spam filtering) are enabled by default upstream
3. **Disk-aware defaults**: on disks smaller than 900 GB, pruning is automatically enabled (550 MiB target) and `txindex` is disabled; on larger disks, a full archival node is configured
4. **I2P enabled by default**: the embedded I2P daemon starts automatically with `i2pacceptincoming=true`, so the node accepts inbound peer connections over I2P out of the box — no user configuration required
5. **Tor proxy always configured**: the `-onion` flag is set to the StartOS Tor proxy on every start, enabling outbound connections over Tor. Inbound connections are enabled automatically when a public address (clearnet IP or Tor onion) is published on the peer interface
6. Bitcoin Knots begins syncing the blockchain (Initial Block Download)
7. When sync completes, a **Sync Complete** notification is posted to the StartOS notifications panel. The notification fires once after initial sync, and again whenever a reindex (Reindex Blockchain / Reindex Chainstate) completes.

## Default Networking

Out of the box, Bitcoin Knots on StartOS connects to the Bitcoin network over multiple transports with no user configuration required:

| Transport     | Default                                   | Inbound                             | How to change                                       |
| ------------- | ----------------------------------------- | ----------------------------------- | --------------------------------------------------- |
| **I2P**       | Enabled (embedded `i2pd` SAM proxy)       | Accepted (`i2pacceptincoming=true`) | Peer Settings → I2P SAM Proxy → Disabled            |
| **Tor**       | Outbound via StartOS Tor proxy (`-onion`) | No (no onion address advertised)    | Add an onion address on the peer interface           |
| **IPv4/IPv6** | Enabled (clearnet peer discovery)         | No (`externalip` not set)           | Publish an IP address on the peer interface          |
| **BIP324 v2** | Enabled (`v2transport=true`)              | —                                   | Peer Settings → Use V2 P2P Transport Protocol       |

To restrict outbound connections to specific networks only, use the **onlynet** setting in Peer Settings.

Advanced i2pd-daemon tuning (log level, bandwidth class, transit share, floodfill, web console, transit-tunnel limits) is **not** exposed in the StartOS UI. Those values are baked as defaults in the bundled `i2pd.conf` schema; users who need to change them can edit `i2pd.conf` directly on the `i2pd` volume.

## Configuration Management

Bitcoin Knots is configured through **StartOS actions** that write to `bitcoin.conf` (INI format) on the `main` volume.

### Configuration Actions

| Action               | Settings                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mempool Settings** | persistmempool, maxmempool, mempoolexpiry, mempoolfullrbf, permitbaremultisig, OP_RETURN (datacarrier/datacarriersize, permitbaredatacarrier, datacarriercost, acceptnonstddatacarrier), rejectparasites, rejecttokens, mempoolreplacement, mempooltruc, permitbareanchor, permitephemeral, minrelaytxfee, bytespersigop, bytespersigopstrict, maxtxlegacysigops, limitancestorcount/size, limitdescendantcount/size, permitbarepubkey, maxscriptsize, dustrelayfee, acceptunknownwitness, minrelaycoinblocks, minrelaymaturity, blocksonly |
| **Peer Settings**    | onlynet (ipv4/ipv6/onion/i2p), BIP324 v2transport, I2P SAM proxy (enabled/disabled), connect/addnode peers, maxconnections                                                                       |
| **RPC Settings**     | rpcservertimeout, rpcthreads, rpcworkqueue                                                                                                                                                       |
| **Other Settings**   | softwareexpiry, ZMQ, txindex, blocknotify, block template construction (blockmaxsize/blockmaxweight), block reconstruction, coinstatsindex, wallet settings (enable/avoidpartialspends/discardfee), pruning, dbcache, dbbatchsize, BIP158/BIP157 block filters, bloom filters, natpmp, maxuploadtarget |

Settings **not** managed by StartOS (hardcoded):

| Setting         | Value           | Reason                                                           |
| --------------- | --------------- | ---------------------------------------------------------------- |
| `rpccookiefile` | `.cookie`       | Fixed RPC authentication                                         |
| `listen`        | `1`             | Always accepting connections                                     |
| `bind`          | `0.0.0.0:58333` | Internal peer listening port                                     |
| `whitebind`     | `0.0.0.0:8333`  | Required for peer connections                                    |
| `deprecatedrpc` | `create_bdb`    | Required for wallet creation                                     |
| `-onion`        | `10.0.3.1:9050` | Tor SOCKS on the internal bridge (resolved at startup; always set — harmless connection-refused when Tor is absent) |

### Pruned Node Architecture

When pruning is enabled, the RPC architecture changes automatically:

- **Unpruned**: bitcoind binds RPC directly to `0.0.0.0:8332`
- **Pruned**: bitcoind binds RPC to `127.0.0.1:18332` and the `btc-rpc-proxy` container runs on port 8332, proxying requests to bitcoind

This is transparent to dependent services — port 8332 always serves RPC.

## Network Access and Interfaces

| Interface   | Port  | Protocol | Purpose                          | Condition                                  |
| ----------- | ----- | -------- | -------------------------------- | ------------------------------------------ |
| RPC         | 8332  | HTTP     | JSON-RPC commands                | Always                                     |
| Peer        | 8333  | TCP      | Bitcoin peer-to-peer connections | Always                                     |
| ZeroMQ      | 28332 | TCP      | Block notifications (rawblock, hashblock)  | When ZMQ enabled                           |
| ZeroMQ      | 28333 | TCP      | Transaction notifications (rawtx, hashtx, sequence) | When ZMQ enabled                |
| I2P Console | 7070  | HTTP     | I2P daemon web console           | When embedded I2P enabled with web console |

## Actions (StartOS UI)

### Configuration

| Action               | Purpose                                                                  | Availability |
| -------------------- | ------------------------------------------------------------------------ | ------------ |
| **Mempool Settings** | Configure mempool behavior                                               | Any          |
| **Peer Settings**    | Configure networking, I2P, peer connections                              | Any          |
| **RPC Settings**     | Configure RPC server parameters                                          | Any          |
| **Other Settings**   | Configure ZMQ, indexes, wallets, pruning, performance tuning             | Any          |

### RPC Users

| Action                            | Purpose                                        | Availability                   |
| --------------------------------- | ---------------------------------------------- | ------------------------------ |
| **Generate RPC User Credentials** | Create RPC username/password for external apps | Any                            |
| **Delete RPC Users**              | Remove existing RPC user credentials           | Any (disabled when none exist) |

### Wallet

These actions operate on the **selected wallet** (default `coin`). Use **Select Wallet** to point them at a different wallet, including wallets created by dependent services such as BTCPay Server/NBXplorer. The selected wallet is passed to each RPC as `-rpcwallet`, so the actions keep working once more than one wallet is loaded.

| Action             | Purpose                                                  | Availability |
| ------------------ | -------------------------------------------------------- | ------------ |
| **Select Wallet**  | Choose which wallet the Wallet actions operate on        | Running only |
| **Get Address**    | Get a new segwit address from the selected wallet        | Running only |
| **Get Balance**    | Show the selected wallet's balance                       | Running only |
| **Send Coin**      | Send bitcoin from the selected wallet to an address      | Running only |
| **Send All Coin**  | Send the entire selected wallet balance to an address    | Running only |
| **Sign Message**   | Sign a message with an address from the selected wallet  | Running only |
| **Backup Wallet**  | Export a backup file of the selected wallet              | Running only |
| **Restore Wallet** | Restore the selected wallet from a backup file           | Running only |
| **Remove Wallet**  | Remove the selected wallet from the node                 | Running only |

### Mining

| Action                     | Purpose                                        | Availability |
| -------------------------- | ---------------------------------------------- | ------------ |
| **Prioritize Transaction** | Bump a transaction's priority with a fee delta | Running only |

### Maintenance

| Action                       | Purpose                                                           | Availability |
| ---------------------------- | ----------------------------------------------------------------- | ------------ |
| **Reindex Blockchain**       | Full reindex of blocks and chainstate                             | Any          |
| **Reindex Chainstate**       | Rebuild chainstate from existing blocks (hidden for pruned nodes) | Any          |
| **Delete Peer List**         | Delete corrupted `peers.dat`                                      | Stopped only |
| **Delete Transaction Index** | Delete corrupted txindex                                          | Stopped only |
| **Delete Coinstats Index**   | Delete corrupted coinstatsindex                                   | Stopped only |

### Advanced

| Action                                  | Purpose                                                         | Availability |
| --------------------------------------- | --------------------------------------------------------------- | ------------ |
| **Download UTXO Snapshot (assumeutxo)** | Load a UTXO snapshot for fast sync (hidden when fully synced)   | Running only |
| **Runtime Information**                 | Display connections, block height, sync progress, softfork info | Running only |

### Hidden (Dependent Service Automation)

| Action                     | Purpose                                                                            | Availability |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------ |
| **Auto-Configure**         | Automatically configure Bitcoin Knots for dependent services (prefills all config) | Any          |
| **Create RPC Credentials** | Create RPC credentials with a provided username/password for dependent services    | Any          |

## Backups and Restore

**Backed up:** The `main` and `i2pd` volumes, **excluding** `blocks/`, `chainstate/`, `indexes/` (blockchain data) and I2P ephemeral data.

**What is backed up:** `bitcoin.conf`, `store.json`, wallet files, `peers.dat`.

**What is NOT backed up:** Blockchain data must be re-synced after restore.

**Restore warning:** Restoring overwrites current data. Watch-only wallet transactions and hot wallet funds received since the last backup will be lost.

## Health Checks

| Check               | Method                                                                                 | Messages                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **RPC**             | Waits for `.cookie` file, then port-listening check on `8332` (or `58332` when pruned) | Ready: "The Bitcoin RPC Interface is ready"                                                    |
| **Blockchain Sync** | `bitcoin-cli getblockchaininfo` (polled every 30 s; 5 s during startup/failure)        | Shows percentage during IBD; "Bitcoin is fully synced" when complete                           |
| **I2P**             | I2PControl API (auth + router info)                                                    | "Inbound and outbound connections" or "Outbound connections only" based on `i2pacceptincoming` |
| **Tor**             | Tor install/running status                                                             | "Inbound and outbound" when an onion address is published; otherwise "Outbound only"           |
| **Clearnet**        | Checks published IP addresses                                                          | "Inbound and outbound" when an IP address is published; otherwise "Outbound only"              |
| **RPC Proxy**       | Port listening (when pruned)                                                           | Ready: "The Bitcoin RPC Proxy is ready"                                                        |

## Dependencies

| Dependency | Condition                                                                                | Required State              |
| ---------- | ---------------------------------------------------------------------------------------- | --------------------------- |
| **Tor**    | When `externalip` contains `.onion` or `onlynet` includes `onion` | Running |

When a Tor onion address is added to the peer interface, it is automatically set as `externalip` in `bitcoin.conf` and advertised to peers. Other StartOS services (LND, Core Lightning, Electrs, etc.) depend on Bitcoin Knots.

## Default Overrides

Only settings that **diverge from upstream Bitcoin Knots defaults** are seeded into `bitcoin.conf` on install. All other settings are left unset, allowing bitcoind to use its built-in defaults. This keeps `bitcoin.conf` minimal and avoids drift when upstream defaults change between versions.

### Seeded overrides (written to `bitcoin.conf` on install)

| Setting | Upstream Default | Our Default | Reason |
| --- | --- | --- | --- |
| `dbcache` | 450 MiB | 25% of system RAM (max 5120 MiB) | Faster IBD; reset to upstream default automatically after initial sync completes |
| `dbbatchsize` | 16777216 (16 MiB) | RAM-scaled (16–32 MiB) | Faster UTXO writes during sync; reset to upstream default after initial sync |
| `blockfilterindex` | off | `basic` | Required by dependent services (Electrs, etc.) for BIP158 filters |
| `natpmp` | true | false | NAT-PMP disabled to avoid unexpected port mapping on StartOS |
| `datacarriercost` | 4 | 1 | Treat extra data as 1 vbyte per actual byte (more permissive relay) |
| `zmqpubrawblock`, `zmqpubhashblock` | off | `tcp://0.0.0.0:28332` | Required by dependent services (LND, etc.) |
| `zmqpubrawtx`, `zmqpubhashtx`, `zmqpubsequence` | off | `tcp://0.0.0.0:28333` | Required by dependent services (LND, etc.) |
| `i2psam` | off | `127.0.0.1:7656` | Embedded I2P daemon for peer-to-peer privacy |
| `prune` (disk < 900 GB only) | 0 (off) | 550 MiB | Automatic pruning on smaller disks |

### Knots-Specific Mempool Policy Defaults

Bitcoin Knots provides enhanced mempool filtering not available in Bitcoin Core. These settings are **upstream Knots defaults** (not our overrides) and are included here for reference:

| Setting              | Default      | Description                                             |
| -------------------- | ------------ | ------------------------------------------------------- |
| `rejectparasites`    | `true`       | Reject parasite transactions                            |
| `rejecttokens`       | `false`      | Reject token transactions (runes)                       |
| `mempoolreplacement` | `fee,-optin` | Full RBF (always replace by fee)                        |
| `mempooltruc`        | `accept`     | Accept TRUC transactions without enforcing restrictions |
| `permitbaremultisig` | `false`      | Do not relay bare multisig                              |

### Form defaults and footnotes

Every user-exposed field in the configuration actions is optional, including booleans. The pattern:

- **Number / text fields** use `default: null` when our permanent default matches upstream, or `default: <value>` when we override upstream.
- **Boolean fields** use `Value.triState` with `default: null` when our permanent default matches upstream, or `default: true` / `default: false` when we override. The null (middle) state omits the key from `bitcoin.conf` and bitcoind uses its upstream default; explicit `true` / `false` write the option.
- **`footnote: 'Default: <val>'`** — every field annotates its **upstream** bitcoind default in the footnote, so users can see what value applies when the field is left empty / null.

Where our permanent default overrides upstream, the input spec's `default` and the value seeded into `bitcoin.conf` by `seedFiles.ts` share a single source of truth: constants like `minPrune` and `defaultDatacarriercost` are exported from `bitcoin.conf.ts` and imported by `seedFiles.ts` so the form and seed cannot drift.

`dbcache` and `dbbatchsize` are special: the seeded values (`defaultDbcache()`, `defaultDbbatchsize()` — RAM-scaled) are an **IBD-only boost**. After initial sync completes, `main.ts` clears them so bitcoind reverts to upstream defaults. Because the permanent default matches upstream, the input spec uses `default: null` rather than the boost value.

## Limitations and Differences

1. **Custom Docker image** — built from source with ZMQ support; adds runtime utilities not in upstream releases
2. **Tor proxy always configured** — the `-onion` flag is set to the StartOS Tor proxy on every start; Tor itself is a conditional dependency (required only when onion connectivity is configured)
3. **RPC cookie auth enforced** — `rpcuser`/`rpcpassword` are forcibly removed; authentication uses `.cookie` or `rpcauth` credentials generated via the action
4. **Disk-aware defaults** — pruning and txindex are auto-configured based on available disk space (< 900 GB enables pruning)
5. **Pruned nodes use RPC proxy** — an intermediary `btc-rpc-proxy` container transparently fetches pruned blocks over the P2P network
6. **Shared package ID** — uses `bitcoind` as the package ID, shared with Bitcoin Core; only one flavor can be installed at a time
7. **5-minute shutdown timeout** — SIGTERM allows 300 seconds for graceful database flush
8. **Embedded I2P enabled by default** — a bundled `i2pd` daemon provides the I2P SAM proxy, with `i2pacceptincoming=true`; inbound I2P connections work out of the box with no user configuration. Can be disabled via Peer Settings
9. **CJDNS not supported** — StartOS provides no CJDNS transport, so `cjdns` is not offered as an `onlynet` option and CJDNS peer connectivity is unavailable; the other three Bitcoin networks (clearnet, Tor, I2P) are fully supported

## What Is Unchanged from Upstream

- Block validation and consensus rules
- Peer-to-peer networking (gossip, block relay, transaction relay)
- Wallet functionality (key management, signing, coin selection)
- JSON-RPC API (all commands)
- ZeroMQ notification interface
- Transaction and block index behavior
- Knots-specific policy enforcement (rejectparasites, rejecttokens, etc.)
- Mining/block template support
- BIP compliance (BIP324, BIP158, BIP157, etc.)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: bitcoind
flavor: knotsprerdts
image: custom Dockerfile (built from Bitcoin Knots source)
additional_images:
  - ghcr.io/start9labs/btc-rpc-proxy (pruned node RPC proxy)
  - python (Alpine, RPC credential generation)
  - purplei2p/i2pd (embedded I2P)
architectures: [x86_64, aarch64, riscv64]
volumes:
  main: /root/.bitcoin
  i2pd: /home/i2pd
ports:
  rpc: 8332
  peer: 8333
  zmq-block: 28332 (conditional)
  zmq-tx: 28333 (conditional)
  i2p-console: 7070 (conditional)
dependencies:
  tor: conditional (onion connectivity)
startos_managed_files:
  - store.json
actions:
  - mempool-config
  - peers-config
  - rpc-config
  - other-config
  - generate-rpcuser
  - generate-rpc-dependent (hidden, dependent service automation)
  - autoconfig (hidden, dependent service automation)
  - delete-rpcauth
  - reindex-blockchain
  - reindex-chainstate
  - delete-peers
  - delete-txindex
  - delete-coinstats-index
  - assumeutxo
  - runtime-info
  - prioritise-transaction
  - select-wallet
  - get-address
  - get-balance
  - send-coin
  - send-all-coin
  - sign-message
  - backup-wallet
  - restore-wallet
  - remove-wallet
health_checks:
  - rpc: port_listening 8332 (or 58332 pruned), after .cookie file exists
  - sync-progress: bitcoin-cli_getblockchaininfo (30s trigger; 5s during starting/failure)
  - i2p: port_listening / status
  - tor: install/running status + onion address check
  - clearnet: published IP address check
  - rpc-proxy: port_listening (pruned only)
backup_volumes:
  - main (excluding blocks/, chainstate/, indexes/)
  - i2pd (excluding ephemeral data)
knots_specific_settings:
  - rejectparasites
  - rejecttokens
  - mempoolreplacement
  - mempooltruc
  - permitbaredatacarrier
  - permitbareanchor
  - permitbarepubkey
  - permitephemeral
  - maxscriptsize
  - datacarriercost
  - acceptnonstddatacarrier
  - dustrelayfee
  - bytespersigopstrict
  - maxtxlegacysigops
  - acceptunknownwitness
  - minrelaycoinblocks
  - minrelaymaturity
  - softwareexpiry
  - natpmp
  - maxuploadtarget
  - blockmaxsize
  - blockmaxweight
  - blockreconstructionextratxn
  - blockreconstructionextratxnsize
```
