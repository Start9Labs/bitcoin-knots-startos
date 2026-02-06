import { sdk } from '../../sdk'
import { utils } from '@start9labs/start-sdk'
import * as diskusage from 'diskusage'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { bitcoinConfDefaults } from '../../utils'
import { T } from '@start9labs/start-sdk'
import { i18n } from '../../i18n'

const {
  coinstatsindex,
  disablewallet,
  avoidpartialspends,
  discardfee,
  prune,
  dbcache,
  blockfilterindex,
  peerblockfilters,
  peerbloomfilters,
  blockmaxweight,
  blockmaxsize,
  blocknotify,
  maxuploadtarget,
  blockreconstructionextratxn,
  blockreconstructionextratxnsize,
} = bitcoinConfDefaults

const { InputSpec, Value } = sdk
const diskUsage = utils.once(() => diskusage.check('/'))
const archivalMin = 900_000_000_000

const configSpec = sdk.InputSpec.of({
  softwareexpiry: Value.number({
    name: i18n('Software expiry'),
    description:
      i18n('Stop working after this POSIX timestamp (set to 0 to disable)'),
    default: 1825593420,
    required: true,
    integer: true,
    units: 'timestamp',
  }),
  zmqEnabled: Value.toggle({
    name: i18n('ZeroMQ Enabled'),
    default: true,
    description: i18n(
      'The ZeroMQ interface is useful for some applications which might require data related to block and transaction events from Bitcoin Knots. For example, LND requires ZeroMQ be enabled for LND to get the latest block data',
    ),
  }),
  txindex: Value.dynamicToggle(async ({ effects }) => {
    const disk = await diskUsage()
    return {
      name: i18n('Transaction Index'),
      default: disk.total >= archivalMin,
      description: i18n(
        'By enabling Transaction Index (txindex) Bitcoin Knots will build a complete transaction index. This allows Bitcoin Knots to access any transaction with commands like `getrawtransaction`.',
      ),
      disabled: disk.total < archivalMin ? i18n('Not enough disk space') : false,
    }
  }),
  blocknotify: Value.text({
    name: i18n('Block Notify'),
    required: false,
    default: null,
    description: 'Execute an arbitrary command when the best block changes',
  }),
  templateconstruction: Value.object(
    {
      name: i18n('Template Construction'),
      description: i18n('Set limits for block size/weight'),
    },
    InputSpec.of({
      blockmaxsize: Value.number({
        name: i18n('Max Block Size'),
        description: i18n('Maximum block size in bytes'),
        default: blockmaxsize,
        required: true,
        min: 100_000,
        max: blockmaxsize,
        integer: true,
        units: 'Bytes',
      }),
      blockmaxweight: Value.number({
        name: i18n('Max Block Weight'),
        description: i18n('Maximum block weight in vBytes'),
        default: blockmaxweight,
        required: true,
        min: 100_000,
        max: blockmaxweight,
        integer: true,
        units: 'vBytes',
      }),
    }),
  ),
  blockreconstruction: Value.object(
    {
      name: i18n('Compact block reconstructions'),
      description: i18n('Settings for compact block reconstructions'),
    },
    InputSpec.of({
      blockreconstructionextratxn: Value.number({
        name: i18n('Block reconstruction extra TXN'),
        description:
          i18n('Extra transactions to keep in memory for compact block reconstructions'),
        default: blockreconstructionextratxn,
        required: true,
        min: 0,
        integer: true,
      }),
      blockreconstructionextratxnsize: Value.number({
        name: i18n('Block reconstruction extra TXN size'),
        description:
          i18n('Upper limit of memory usage (in megabytes) for keeping extra transactions in memory for compact block reconstructions'),
        default: blockreconstructionextratxnsize,
        required: true,
        min: 0,
        integer: true,
        units: 'MB',
      }),
    }),
  ),
  coinstatsindex: Value.toggle({
    name: i18n('Coinstats Index'),
    default: coinstatsindex,
    description: i18n(
      'Enabling Coinstats Index reduces the time for the gettxoutsetinfo RPC to complete at the cost of using additional disk space',
    ),
  }),
  wallet: Value.object(
    { name: i18n('Wallet'), description: i18n('Wallet Settings') },
    InputSpec.of({
      enable: Value.toggle({
        name: i18n('Enable Wallet'),
        default: !!!disablewallet,
        description: i18n('Load the wallet and enable wallet RPC calls.'),
      }),
      avoidpartialspends: Value.toggle({
        name: i18n('Avoid Partial Spends'),
        default: !!avoidpartialspends,
        description: i18n(
          'Group outputs by address, selecting all or none, instead of selecting on a per-output basis. This improves privacy at the expense of higher transaction fees.',
        ),
      }),
      discardfee: Value.number({
        name: i18n('Discard Change Tolerance'),
        description: i18n(
          'The fee rate (in BTC/kB) that indicates your tolerance for discarding change by adding it to the fee.',
        ),
        required: false,
        default: null,
        min: 0,
        max: 0.01,
        integer: false,
        units: i18n('BTC/kB'),
        placeholder: '.0001',
      }),
    }),
  ),
  prune: Value.dynamicNumber(async ({ effects }) => {
    const disk = await diskUsage()

    return {
      name: i18n('Pruning'),
      description: i18n(
        'Set the maximum size of the blockchain you wish to store on disk. If your disk is larger than .9TB this value can be set to zero (0) to maintain a full archival node.',
      ),
      warning: i18n(
        'If your node is already pruned increasing this value will require re-syncing your node. Switching from a full archival node to pruned will disable txindex (if enabled)',
      ),
      placeholder: i18n('Enter max blockchain size'),
      required: disk.total < archivalMin,
      default: disk.total < archivalMin ? 550 : null,
      integer: true,
      units: 'MiB',
      min: 0,
    }
  }),
  dbcache: Value.number({
    name: i18n('Database Cache'),
    description: i18n(
      'How much RAM to allocate for caching the TXO set. Higher values improve syncing performance, but may result in some re-work in the event of an ungraceful shutdown. 4-7GB is high enough to get most of the peformance benefit during IBD. Consider reducing this setting for lower resource devices (or a device with less available RAM)',
    ),
    required: false,
    default: dbcache,
    min: 0,
    integer: true,
    units: 'MiB',
    placeholder: '450',
  }),
  blockfilters: Value.object(
    {
      name: i18n('Block Filters'),
      description: i18n('Settings for storing and serving compact block filters'),
    },
    InputSpec.of({
      blockfilterindex: Value.toggle({
        name: i18n('Compute Compact Block Filters (BIP158)'),
        default: !!blockfilterindex,
        description: i18n(
          "Generate Compact Block Filters during initial sync (IBD) to enable 'getblockfilter' RPC. This is useful if dependent services need block filters to efficiently scan for addresses/transactions etc.",
        ),
      }),
      peerblockfilters: Value.toggle({
        name: i18n('Serve Compact Block Filters to Peers (BIP157)'),
        default: !!peerblockfilters,
        description: i18n(
          "Serve Compact Block Filters as a peer service to other nodes on the network. This is useful if you wish to connect an SPV client to your node to make it efficient to scan transactions without having to download all block data.  'Compute Compact Block Filters (BIP158)' is required.",
        ),
      }),
    }),
  ),
  peerbloomfilters: Value.toggle({
    name: i18n('Serve Bloom Filters to Peers'),
    default: !!peerbloomfilters,
    description: i18n(
      'Peers have the option of setting filters on each connection they make after the version handshake has completed. Bloom filters are for clients implementing SPV (Simplified Payment Verification) that want to check that block headers  connect together correctly, without needing to verify the full blockchain.  The client must trust that the transactions in the chain are in fact valid.  It is highly recommended AGAINST using for anything except Bisq integration.',
    ),
    warning: i18n(
      'This is ONLY for use with Bisq integration, please use Block Filters for all other applications.',
    )
  }),
  natpmp: Value.toggle({
    name: 'natpmp',
    default: false,
    description: i18n('Use PCP or NAT-PMP to map the listening port.'),
  }),
  maxuploadtarget: Value.number({
    name: 'Max upload target',
    description:
      "Tries to keep outbound traffic under the given target in MiB per 24h. Limit does not apply to peers with 'download' permission or blocks created within past week. 0 = no limit.",
    required: false,
    default: null,
    min: 0,
    integer: true,
    units: 'MiB',
    placeholder: '0',
  }),
})

export const otherConfig = sdk.Action.withInput(
  // id
  'other-config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Other Settings'),
    description: i18n('Edit more values in bitcoin.conf'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  // form input specification
  configSpec,

  // optionally pre-fill the input form
  ({ effects }) => read(effects),

  // the execution function
  ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialConfigSpec> {
  const bitcoinConf = await bitcoinConfFile.read().const(effects)
  if (!bitcoinConf) return {}

  return {
    zmqEnabled:
      !!bitcoinConf?.zmqpubhashblock &&
      bitcoinConf.zmqpubhashblock !== '' &&
      !!bitcoinConf?.zmqpubhashtx &&
      bitcoinConf.zmqpubhashtx !== '' &&
      !!bitcoinConf?.zmqpubrawblock &&
      bitcoinConf.zmqpubrawblock !== '' &&
      !!bitcoinConf?.zmqpubrawtx &&
      bitcoinConf.zmqpubrawtx !== '' &&
      !!bitcoinConf?.zmqpubsequence &&
      bitcoinConf.zmqpubsequence !== '',
    txindex: bitcoinConf.txindex,
    coinstatsindex: bitcoinConf.coinstatsindex,
    wallet: {
      enable: !bitcoinConf.disablewallet,
      avoidpartialspends: bitcoinConf.avoidpartialspends,
      discardfee: bitcoinConf.discardfee,
    },
    blocknotify: bitcoinConf.blocknotify,
    prune: bitcoinConf.prune,
    dbcache: bitcoinConf.dbcache,
    blockfilters: {
      blockfilterindex: bitcoinConf.blockfilterindex === ('basic' as const),
      peerblockfilters: bitcoinConf.peerblockfilters,
    },
    peerbloomfilters: bitcoinConf.peerbloomfilters,
    templateconstruction: {
      blockmaxsize: bitcoinConf.blockmaxsize,
      blockmaxweight: bitcoinConf.blockmaxweight,
    },
    blockreconstruction: {
      blockreconstructionextratxn: bitcoinConf.blockreconstructionextratxn,
      blockreconstructionextratxnsize:
        bitcoinConf.blockreconstructionextratxnsize,
    },
    natpmp: bitcoinConf.natpmp,
    maxuploadtarget: bitcoinConf.maxuploadtarget,
  }
}

async function write(effects: T.Effects, input: ConfigSpec) {
  const otherConfig = {
    // RPC
    rpcbind: input.prune ? '127.0.0.1:18332' : '0.0.0.0:8332',
    rpcallowip: input.prune ? '127.0.0.1/32' : '0.0.0.0/0',

    // Wallet
    disablewallet: !input.wallet.enable,
    avoidpartialspends: input.wallet.avoidpartialspends,
    discardfee: input.wallet.discardfee || discardfee,

    // Other
    txindex: input.prune !== 0 ? false : input.txindex,
    coinstatsindex: input.coinstatsindex,
    peerbloomfilters: input.peerbloomfilters,
    peerblockfilters: input.blockfilters.peerblockfilters,
    blockfilterindex: input.blockfilters.blockfilterindex
      ? ('basic' as const)
      : false,
    blocknotify: input.blocknotify ? input.blocknotify : blocknotify,
    prune: input.prune ? input.prune : prune,
    dbcache: input.dbcache ? input.dbcache : dbcache,
    zmqpubrawblock: input.zmqEnabled ? 'tcp://0.0.0.0:28332' : '',
    zmqpubhashblock: input.zmqEnabled ? 'tcp://0.0.0.0:28332' : '',
    zmqpubrawtx: input.zmqEnabled ? 'tcp://0.0.0.0:28333' : '',
    zmqpubhashtx: input.zmqEnabled ? 'tcp://0.0.0.0:28333' : '',
    zmqpubsequence: input.zmqEnabled ? 'tcp://0.0.0.0:28333' : '',
    blockmaxsize: input.templateconstruction.blockmaxsize,
    blockmaxweight: input.templateconstruction.blockmaxweight,
    blockreconstructionextratxn:
      input.blockreconstruction.blockreconstructionextratxn,
    blockreconstructionextratxnsize:
      input.blockreconstruction.blockreconstructionextratxnsize,
    natpmp: input.natpmp,
    maxuploadtarget: input.maxuploadtarget
      ? input.maxuploadtarget
      : maxuploadtarget,
  }

  await bitcoinConfFile.merge(effects, otherConfig)
}

type ConfigSpec = typeof configSpec._TYPE
type PartialConfigSpec = typeof configSpec._PARTIAL
