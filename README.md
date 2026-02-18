<p align="center">
  <img src="icon.png" alt="Bitcoin Knots Logo" width="21%">
</p>

# Bitcoin Knots on StartOS

> **Upstream docs:** <https://bitcoinknots.org/>
>
> Everything not listed in this document should behave the same as upstream
> Bitcoin Knots v29.3. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable.

An enhanced Bitcoin full node implementation with additional policy controls for mempool filtering and spam prevention. See the [upstream repo](https://github.com/bitcoinknots/bitcoin) for general Bitcoin Knots documentation.

This package shares the `bitcoind` package ID with [Bitcoin Core](https://github.com/Start9Labs/bitcoin-core-startos), allowing users to switch between flavors while preserving blockchain data and dependent service connections.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Image         | Custom Dockerfile (multi-stage Alpine build from Bitcoin Knots v29.3 source) |
| Architectures | x86_64, aarch64, riscv64                                                     |
| Entrypoint    | `bitcoind`                                                                   |

The custom Dockerfile cross-compiles Bitcoin Knots with ZMQ support, IPC support (Cap'n Proto), and adds runtime utilities (curl, yq, jq, tini).

Three additional containers are used:

| Container | Image                              | Purpose                                       |
| --------- | ---------------------------------- | --------------------------------------------- |
| `proxy`   | `ghcr.io/start9labs/btc-rpc-proxy` | RPC proxy for pruned nodes                    |
| `python`  | `python:3.13.11-alpine`            | Runs `rpcauth.py` to generate RPC credentials |
| `i2pd`    | `purplei2p/i2pd:release-2.58.0`    | Embedded I2P daemon (when enabled)            |

## Volume and Data Layout

| Volume | Mount Point      | Purpose                                              |
| ------ | ---------------- | ---------------------------------------------------- |
| `main` | `/root/.bitcoin` | All Bitcoin Knots data (blockchain, config, wallets) |
| `i2pd` | `/home/i2pd`     | I2P daemon data (when embedded I2P is enabled)       |

StartOS-specific files on the `main` volume:

| File         | Purpose                                                               |
| ------------ | --------------------------------------------------------------------- |
| `store.json` | Persistent StartOS state (reindex flags, sync status, snapshot state) |

## Installation and First-Run Flow

1. On install, StartOS sets the `nocow` attribute on the data directory (btrfs optimization via `chattr -R +C`)
2. Default `bitcoin.conf` and `store.json` are written with sensible defaults, including Knots-specific policy settings (spam filtering enabled by default)
3. **Disk-aware defaults**: on disks smaller than 900 GB, pruning is automatically enabled (550 MiB target) and `txindex` is disabled; on larger disks, a full archival node is configured
4. The node's Tor onion address is set as the `externalip`
5. Bitcoin Knots begins syncing the blockchain (Initial Block Download)

### Flavor Migration

When switching between Bitcoin Core and Bitcoin Knots, the migration preserves existing `bitcoin.conf` settings and adds any Knots-specific (or Core-specific) options that were not previously present.

## Configuration Management

Bitcoin Knots is configured through **StartOS actions** that write to `bitcoin.conf` (INI format) on the `main` volume.

### Configuration Actions

| Action               | Settings                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mempool Settings** | All Core mempool options plus Knots-specific: rejectparasites, rejecttokens, mempoolreplacement (disabled/optin/optout), mempooltruc (reject/accept/enforce), permitbaredatacarrier, permitbareanchor, permitbarepubkey, permitephemeral, maxscriptsize, datacarriercost, acceptnonstddatacarrier, dustrelayfee, bytespersigopstrict, maxtxlegacysigops, acceptunknownwitness, minrelaycoinblocks, minrelaymaturity |
| **Peer Settings**    | onlynet (ipv4/ipv6/onion/i2p/cjdns), BIP324 v2transport, externalip, I2P SAM proxy (none/embedded/custom with advanced i2pd settings), connect/addnode peers                                                                                                                                                                                                                                                        |
| **RPC Settings**     | rpcservertimeout, rpcthreads, rpcworkqueue                                                                                                                                                                                                                                                                                                                                                                          |
| **Other Settings**   | ZMQ, txindex, blocknotify, coinstatsindex, wallet settings (enable/avoidpartialspends/discardfee), pruning, dbcache, dbbatchsize, BIP158/BIP157 block filters, bloom filters                                                                                                                                                                                                                                        |

Settings **not** managed by StartOS (hardcoded):

| Setting         | Value           | Reason                             |
| --------------- | --------------- | ---------------------------------- |
| `rpccookiefile` | `.cookie`       | Fixed RPC authentication           |
| `whitebind`     | `0.0.0.0:8333`  | Required for peer connections      |
| `bind`          | `0.0.0.0:18333` | Fixed peer listening port          |
| `listen`        | `1`             | Always accepting connections       |
| `-onion`        | `<osIp>:9050`   | StartOS Tor proxy (set at runtime) |

### Knots-Specific Mempool Policy Defaults

Bitcoin Knots provides enhanced mempool filtering not available in Bitcoin Core. These settings help keep the network clean by rejecting spam and parasitic transactions:

| Setting              | Default      | Description                                             |
| -------------------- | ------------ | ------------------------------------------------------- |
| `rejectparasites`    | `true`       | Reject parasite transactions                            |
| `rejecttokens`       | `false`      | Reject token transactions (runes)                       |
| `mempoolreplacement` | `fee,-optin` | Full RBF (always replace by fee)                        |
| `mempooltruc`        | `accept`     | Accept TRUC transactions without enforcing restrictions |
| `permitbaremultisig` | `false`      | Do not relay bare multisig                              |
| `datacarriercost`    | `1`          | Treat extra data as 1 vbyte per actual byte             |

### Pruned Node Architecture

When pruning is enabled, the RPC architecture changes automatically:

- **Unpruned**: bitcoind binds RPC directly to `0.0.0.0:8332`
- **Pruned**: bitcoind binds RPC to `127.0.0.1:18332` and the `btc-rpc-proxy` container runs on port 8332, proxying requests to bitcoind

This is transparent to dependent services — port 8332 always serves RPC.

## Network Access and Interfaces

| Interface   | Port  | Protocol | Purpose                          | Condition                                  |
| ----------- | ----- | -------- | -------------------------------- | ------------------------------------------ |
| RPC         | 8332  | HTTP     | JSON-RPC commands                | Always                                     |
| Peer        | 18333 | TCP      | Bitcoin peer-to-peer connections | Always                                     |
| ZeroMQ      | 28332 | TCP      | Block/transaction notifications  | When ZMQ enabled                           |
| I2P Console | 7070  | HTTP     | I2P daemon web console           | When embedded I2P enabled with web console |

## Actions (StartOS UI)

### Configuration

| Action               | Purpose                                                      | Availability |
| -------------------- | ------------------------------------------------------------ | ------------ |
| **Mempool Settings** | Configure mempool behavior and Knots-specific policy filters | Any          |
| **Peer Settings**    | Configure networking, I2P, peer connections                  | Any          |
| **RPC Settings**     | Configure RPC server parameters                              | Any          |
| **Other Settings**   | Configure ZMQ, indexes, wallets, pruning                     | Any          |

### RPC Users

| Action                            | Purpose                                        | Availability |
| --------------------------------- | ---------------------------------------------- | ------------ |
| **Generate RPC User Credentials** | Create RPC username/password for external apps | Any          |
| **Delete RPC Users**              | Remove existing RPC user credentials           | Any          |

### Wallet

| Action            | Purpose                                                   | Availability |
| ----------------- | --------------------------------------------------------- | ------------ |
| **Get Address**   | Get a new segwit address from the hot wallet              | Any          |
| **Get Balance**   | Show the hot wallet balance                               | Any          |
| **Send Coin**     | Send bitcoin from the hot wallet to an address            | Any          |
| **Send All Coin** | Send entire hot wallet balance to an address              | Any          |
| **Sign Message**  | Sign a message with a Bitcoin address from the hot wallet | Any          |

### Mining

| Action                     | Purpose                                        | Availability |
| -------------------------- | ---------------------------------------------- | ------------ |
| **Prioritize Transaction** | Bump a transaction's priority with a fee delta | Any          |

### Maintenance

| Action                       | Purpose                                 | Availability |
| ---------------------------- | --------------------------------------- | ------------ |
| **Reindex Blockchain**       | Full reindex of blocks and chainstate   | Any          |
| **Reindex Chainstate**       | Rebuild chainstate from existing blocks | Any          |
| **Delete Peer List**         | Delete corrupted `peers.dat`            | Stopped only |
| **Delete Transaction Index** | Delete corrupted txindex                | Stopped only |
| **Delete Coinstats Index**   | Delete corrupted coinstatsindex         | Stopped only |

### Advanced

| Action                                  | Purpose                                                         | Availability |
| --------------------------------------- | --------------------------------------------------------------- | ------------ |
| **Download UTXO Snapshot (assumeutxo)** | Load a UTXO snapshot for fast sync                              | Running only |
| **Runtime Information**                 | Display connections, block height, sync progress, softfork info | Running only |

## Backups and Restore

**Backed up:** The `main` and `i2pd` volumes, **excluding** `blocks/`, `chainstate/`, `indexes/` (blockchain data) and I2P ephemeral data.

**What is backed up:** `bitcoin.conf`, `store.json`, wallet files, `peers.dat`.

**What is NOT backed up:** Blockchain data must be re-synced after restore.

**Restore warning:** Restoring overwrites current data. Watch-only wallet transactions and hot wallet funds received since the last backup will be lost.

## Health Checks

| Check             | Method                                                  | Messages                                                             |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| **RPC**           | Waits for `.cookie` file, then `bitcoin-cli getrpcinfo` | Ready: "The Bitcoin RPC Interface is ready"                          |
| **Sync Progress** | `bitcoin-cli getblockchaininfo`                         | Shows percentage during IBD; "Bitcoin is fully synced" when complete |

## Dependencies

None. Bitcoin Knots is a standalone service. Other StartOS services (LND, Core Lightning, Electrs, Fulcrum, Datum Gateway, etc.) depend on it.

## Limitations and Differences

1. **Custom Docker image** — built from source with ZMQ and IPC support; adds runtime utilities not in upstream releases
2. **Tor always enabled** — the `-onion` flag is set to the StartOS Tor proxy on every start
3. **RPC cookie auth enforced** — `rpcuser`/`rpcpassword` are forcibly removed; authentication uses `.cookie` or `rpcauth` credentials generated via the action
4. **Disk-aware defaults** — pruning and txindex are auto-configured based on available disk space (< 900 GB enables pruning)
5. **Pruned nodes use RPC proxy** — an intermediary `btc-rpc-proxy` container transparently fetches pruned blocks over the P2P network
6. **Shared package ID** — uses `bitcoind` as the package ID, shared with Bitcoin Core; only one flavor can be installed at a time
7. **5-minute shutdown timeout** — SIGTERM allows 300 seconds for graceful database flush
8. **Embedded I2P** — includes a bundled `i2pd` daemon as an alternative to configuring an external I2P SAM proxy

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
upstream_version: '29.3'
flavor: knots
image: custom Dockerfile (built from Bitcoin Knots v29.3 source)
additional_images:
  - ghcr.io/start9labs/btc-rpc-proxy (pruned node RPC proxy)
  - python:3.13.11-alpine (RPC credential generation)
  - purplei2p/i2pd:release-2.58.0 (embedded I2P)
architectures: [x86_64, aarch64, riscv64]
volumes:
  main: /root/.bitcoin
  i2pd: /home/i2pd
ports:
  rpc: 8332
  peer: 18333
  zmq: 28332 (conditional)
  i2p-console: 7070 (conditional)
dependencies: none
startos_managed_files:
  - store.json
actions:
  - mempool-config
  - peers-config
  - rpc-config
  - other-config
  - generate-rpcuser
  - generate-rpcuser-dependent
  - delete-rpcauth
  - reindex-blockchain
  - reindex-chainstate
  - delete-peers
  - delete-txindex
  - delete-coinstats-index
  - assumeutxo
  - runtime-info
  - prioritise-transaction
  - get-address
  - get-balance
  - send-coin
  - send-all-coin
  - sign-message
health_checks:
  - bitcoin-cli_getrpcinfo: rpc_ready
  - bitcoin-cli_getblockchaininfo: sync_progress
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
```
