# Bitcoin Knots

## Documentation

- [Start9 Bitcoin guides](https://docs.start9.com/bitcoin-guides/) — operating-a-Bitcoin-node guides curated for StartOS users (connecting wallets, dependent services, common workflows).
- [About Bitcoin Knots](https://bitcoinknots.org/#about) — upstream project's description of how Knots differs from Bitcoin Core.
- [About BIP-110 / RDTS](https://bip110.org) — background on the Reduced Data Temporary Softfork network upgrade this version will eventually enforce.

## What you get on StartOS

- A full Bitcoin Knots node with three interfaces: **RPC Interface** (JSON-RPC for wallets and dependent services), **Peer Interface** (the network port other nodes connect to), and **ZeroMQ Interface** (block/transaction notifications, when ZMQ is enabled).
- An embedded **i2pd** sidecar that brings up I2P transport automatically — your node accepts inbound peers over I2P out of the box, with a separate **I2P Daemon Console** interface available when you turn the i2pd web console on.
- An automatic Tor outbound proxy (your node reaches `.onion` peers without configuration); add a `.onion` to the Peer Interface to advertise yourself and accept inbound Tor connections too.
- Disk-aware defaults: on disks smaller than 900 GB the package enables pruning and disables `txindex`; on larger disks you get a full archival node. The transition is transparent — pruned nodes route RPC through a small `btc-rpc-proxy` sidecar so port 8332 always serves RPC the same way.
- Shared `bitcoind` package id with Bitcoin Core — you can switch flavors without re-syncing the chain. During a BIP-110 (RDTS) chain split, switching additionally adjusts the node's recorded block verdicts automatically so it follows the chain the new flavor considers valid (see [Switching flavors during a chain split](#switching-flavors-during-a-chain-split)).

## Getting set up

Bitcoin Knots starts and begins Initial Block Download (IBD) immediately on install. A single critical task asks you to acknowledge the BIP-110 (RDTS) consensus rules this version will eventually enforce; resolve it from the Dashboard.

1. Start the service. Open the Dashboard and watch the sync progress.
2. Resolve the **Activate RDTS** critical task by acknowledging that this version will eventually enforce the BIP-110 (Reduced Data Temporary Softfork) consensus rules. If you do not want RDTS, install the **Bitcoin Knots (pre-RDTS)** flavor from the marketplace instead — it ships the same Knots release without RDTS.
3. If you want inbound clearnet peers, add a public IP or hostname on the **Peer Interface**. If you want inbound Tor peers, add a `.onion` there.
4. If you want to expose RPC to a wallet or dependent service that doesn't use the cookie file, run **Generate RPC User Credentials** and supply the username/password to the consumer.

> Initial Block Download takes hours to days depending on hardware and network. The node is functional immediately but RPC calls that depend on chain state will return partial results until sync completes.

## Using Bitcoin Knots

### RPC

The **RPC Interface** is where wallets, indexers, Lightning nodes, and other dependent services connect. Internal services on this StartOS authenticate via the cookie file automatically; external clients need an RPC user (see actions below).

### Configuration

Four configuration actions cover the full set of editable `bitcoin.conf` values, grouped to be navigable:

- **Mempool Settings** — Knots' policy controls (OP_RETURN limits, parasite/token filters, replacement rules, ancestor/descendant limits, dust relay fee, etc.) plus standard mempool sizing.
- **Peer Settings** — `onlynet`, BIP324 v2 transport, I2P SAM proxy on/off, manual peers, max connections.
- **RPC Settings** — RPC threads, work queue, server timeout.
- **Other Settings** — ZMQ, txindex, block templates, coinstats index, block filters (BIP158/157), pruning, dbcache, wallet master switches, NAT-PMP, max upload target, and more.

### RPC users

- **Generate RPC User Credentials** — create a username/password pair for an external client.
- **Delete RPC Users** — remove credentials you no longer need.

### Wallet (on-node wallets)

When wallets are not disabled, the node ships with a basic wallet toolkit you can drive from actions:

- **Select Wallet** — choose which wallet the other Wallet actions operate on. It defaults to `coin`, and the dropdown also lists wallets created by dependent services such as BTCPay Server/NBXplorer (including bitcoind's unnamed default wallet).
- **Get Address**, **Get Balance**, **Send Coin**, **Send All Coin**, **Sign Message**.
- **Backup Wallet** / **Restore Wallet** / **Remove Wallet**.

Every action above acts on the currently selected wallet, so if you run more than one wallet (for example alongside BTCPay Server) use **Select Wallet** to point them at the right one first — otherwise they operate on `coin`. For day-to-day use prefer a dedicated wallet pointed at the RPC interface; the action surface here is mainly for one-off recovery and maintenance.

### Mining

- **Prioritize Transaction** — bump a transaction's relative priority in the mempool with a fee delta.

### Maintenance

- **Reindex Blockchain** — full reindex; expect a long re-sync.
- **Reindex Chainstate** — rebuild chainstate from existing blocks (not available on pruned nodes).
- **Delete Peer List** — wipe `peers.dat` if peer discovery is misbehaving.
- **Delete Transaction Index** / **Delete Coinstats Index** — clear a corrupted index so it can be rebuilt.

### Switching flavors during a chain split

Bitcoin Core and both Bitcoin Knots flavors share the `bitcoind` package id and data volume, so switching flavors keeps the synced chain. However, bitcoind permanently records its verdict on every block it has seen, and those verdicts do not record _which_ rules produced them — a freshly switched binary trusts them as-is and never re-checks buried blocks on its own. If the network splits over BIP-110 (RDTS), that inheritance would silently pin your node to the previous flavor's chain. This package corrects it automatically at the first start after a switch:

- **Leaving this flavor** (to Bitcoin Core or pre-RDTS Knots): blocks this flavor rejected under RDTS remain marked invalid, which would stop the non-enforcing flavor from following the majority chain. The destination flavor clears those verdicts (`reconsiderblock` on every invalid chain tip) and follows the best chain valid under _its_ rules. You get a "Chain Verdicts Reset" notification when anything was cleared.
- **Arriving at this flavor** (from Core or pre-RDTS Knots) with a chain already synced past the RDTS-applicable range: those blocks were never checked against RDTS, so the node replays the chain from height 961,632 with full validation (`invalidateblock` + `reconsiderblock` at the anchor), rejecting anything RDTS-invalid and landing on the best RDTS-valid chain. This runs on the first start after the switch and can take from minutes to many hours (watch the sync health check); notifications mark start and completion. Until the chain reaches the first RDTS-applicable height (961,632 — expected early August 2026) there is nothing to replay and the check is instant and silent; past that height the replay is real work even before RDTS fully activates, because the mandatory-signaling rule already applies to that range.

Caveats that apply during an actual split:

- **Pruned nodes.** Re-validating or reorganizing requires block data your node may have pruned away. If the needed range is gone, the package refuses the in-place remedy and directs you to **Reindex Blockchain**, which on a pruned node re-downloads the entire chain. A pruned node also cannot reorganize deeper than its retained window (at least the most recent 288 blocks), so during a split significantly older than ~2 days a pruned node that switched sides may need that full re-download.
- **UTXO snapshots (assumeutxo).** A chainstate bootstrapped from a snapshot that has not finished background validation cannot be replayed in place _yet_ — but no action is required: the re-validation runs automatically on the first start after background validation completes. **Reindex Blockchain** is offered only if you want to force a full rebuild sooner.
- **Peers matter.** Clearing or re-checking verdicts lets your node _accept_ the intended chain; actually following it requires peers that serve that chain's blocks. During a contentious split, add a trusted node on your preferred side via **Peer Settings → Add Nodes** if your node does not converge.
- **Dependent services.** Correcting inherited verdicts can reorganize this node onto a different chain, and during a split that reorg can be deep. Services that depend on this node — especially Lightning (LND, Core Lightning) — are not safe against arbitrarily deep reorgs: a reorg past a channel's funding depth can force-close channels. After switching flavors during a split, verify your dependent services' state.

### Advanced

- **Download UTXO Snapshot (assumeutxo)** — pull a UTXO snapshot to short-cut IBD; the action hides itself once the node is fully synced.
- **Runtime Information** — current connection count, block height, sync progress, softfork state, and other runtime details at a glance.

## Limitations

- **Wallet actions cover hot-wallet basics only.** Anything beyond the listed actions (coin control, PSBTs, multisig, hardware-wallet flows) needs an external wallet talking to the RPC interface.
- **Advanced i2pd tuning is not exposed.** Bandwidth class, transit share, floodfill, console, and tunnel limits are baked into the bundled `i2pd.conf`. To change them, edit `i2pd.conf` on the `i2pd` volume directly.
