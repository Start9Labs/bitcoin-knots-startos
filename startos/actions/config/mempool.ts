import { T } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { sdk } from '../../sdk'
import { bitcoinConfDefaults } from '../../utils'

const {
  persistmempool,
  maxmempool,
  mempoolexpiry,
  mempoolfullrbf,
  permitbaremultisig,
  datacarrier,
  datacarriersize,
  rejectparasites,
  rejecttokens,
  minrelaytxfee,
  bytespersigop,
  bytespersigopstrict,
  limitancestorcount,
  limitancestorsize,
  limitdescendantcount,
  limitdescendantsize,
  permitbarepubkey,
  maxscriptsize,
  datacarriercost,
  acceptnonstddatacarrier,
  dustrelayfee,
  mempooltruc,
  mempoolreplacement,
  permitephemeral,
  permitbareanchor,
  permitbaredatacarrier,
  maxtxlegacysigops,
  acceptunknownwitness,
  minrelaycoinblocks,
  minrelaymaturity
} = bitcoinConfDefaults

const { Value, InputSpec, Variants } = sdk

export const mempoolSpec = InputSpec.of({
  persistmempool: Value.toggle({
    name: 'Persist Mempool',
    default: persistmempool,
    description: 'Save the mempool on shutdown and load on restart.',
  }),
  maxmempool: Value.number({
    name: 'Max Mempool Size',
    description: 'Keep the transaction memory pool below <n> megabytes.',
    required: false,
    default: maxmempool,
    min: 1,
    integer: true,
    units: 'MiB',
    placeholder: maxmempool.toString(),
  }),
  mempoolexpiry: Value.number({
    name: 'Mempool Expiration',
    description:
      'Do not keep transactions in the mempool longer than <n> hours.',
    required: false,
    default: mempoolexpiry,
    min: 1,
    integer: true,
    units: 'Hr',
    placeholder: mempoolexpiry.toString(),
  }),
  mempoolfullrbf: Value.toggle({
    name: 'Enable Full RBF',
    default: mempoolfullrbf,
    description:
      'Policy for your node to use for relaying and mining unconfirmed transactions.  For details, see https://github.com/bitcoin/bitcoin/blob/master/doc/release-notes/release-notes-24.0.1.md#notice-of-new-option-for-transaction-replacement-policies',
  }),
  permitbaremultisig: Value.toggle({
    name: 'Permit Bare Multisig',
    default: permitbaremultisig,
    description: 'Relay non-P2SH multisig transactions',
  }),
  datacarrier: Value.toggle({
    name: 'Relay and mine data carrier transactions.',
    default: datacarrier,
    description: 'Relay and mine data carrier transactions.',
  }),
  datacarriersize: Value.number({
    name: 'Maximum size of data in data carrier transactions',
    description: 'Maximum size of data in data carrier transactions we relay and mine, in bytes.',
    required: false,
    default: datacarriersize,
    min: 0,
    max: 10_000,
    integer: true,
    units: 'bytes',
    placeholder: datacarriersize.toString(),
  }),
  permitbaredatacarrier: Value.toggle({
    name: 'Permit Bare Datacarrier',
    default: permitbaredatacarrier,
    description: 'Relay transactions that only have data carrier outputs',
  }),
  rejectparasites: Value.toggle({
    name: 'Reject Parasites',
    default: rejectparasites,
    description: 'Reject parasite transactions',
    warning: null,
  }),
  rejecttokens: Value.toggle({
    name: 'Reject Tokens',
    default: rejecttokens,
    description: 'Reject tokens transactions (runes)',
    warning: null,
  }),
  mempoolreplacement: Value.union(
    {
      name: 'Mempool replacement settings',
      description:
        'Set to disabled to disable RBF entirely, "fee,optin" to honour RBF opt-out signal, or "fee,-optin" to always RBF aka full RBF',
      warning: null,
      default: 'optout',
      variants: Variants.of({
        disabled: { name: 'Disabled', spec: InputSpec.of({}) },
        optin: { name: 'fee,optin', spec: InputSpec.of({}) },
        optout: { name: 'fee,-optin', spec: InputSpec.of({}) },
      }),
    },
  ),
  mempooltruc: Value.union(
    {
      name: 'Mempool TRUC',
      description:
        'Behaviour for transactions requesting TRUC limits: "reject" the transactions entirely, "accept" them just like any other, or "enforce" to impose their requested restrictions',
      warning: null,
      default: 'accept',
      variants: Variants.of({
        reject: { name: 'Reject', spec: InputSpec.of({}) },
        accept: { name: 'Accept', spec: InputSpec.of({}) },
        enforce: { name: 'Enforce', spec: InputSpec.of({}) },
      }),
    },
  ),
  permitbareanchor: Value.toggle({
    name: 'Permit Bare Anchor',
    default: permitbareanchor,
    description: 'Relay transactions that only have ephemeral anchor outputs',
  }),
  permitephemeral: Value.text({
    name: 'Permite Ephemeral',
    description: 'Relay transaction packages that include ephemeral outputs defined by comma-separated options (prefix each by \'-\' to force off): \"anchor\" to allow minimal anyone-can-spend anchors, \"send\" to allow ordinary output types to be considered ephemeral, and \"dust\" to allow for dust-amount outputs rather than strictly zero-value',
    required: false,
    default: null,
  }),
  minrelaytxfee: Value.number({
    name: 'Min Transaction Relay Fee',
    description:
      'Fee rates (in BTC/kB) smaller than this are considered zero fee for relaying, mining and transaction creation',
    warning: null,
    default: minrelaytxfee,
    required: true,
    min: 0,
    max: 21_000_000,
    step: null,
    integer: false,
    units: 'BTC/kvB',
    placeholder: null,
  }),
  bytespersigop: Value.number({
    name: 'Bytes Per Sigop',
    description:
      'Equivalent bytes per sigop in transactions for relay and mining',
    warning: null,
    default: bytespersigop,
    required: true,
    min: 0,
    max: 20,
    step: null,
    integer: true,
    units: 'bytes',
    placeholder: null,
  }),
  bytespersigopstrict: Value.number({
    name: 'Bytes Per Sigop Strict',
    description: 'Minimum bytes per sigop in transactions we relay and mine',
    warning: null,
    default: bytespersigopstrict,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'bytes',
    placeholder: null,
  }),
  maxtxlegacysigops: Value.number({
    name: 'Max Legacy Sigops',
    description: 'Maximum number of legacy sigops allowed in transactions we relay and mine, as measured by BIP54',
    warning: null,
    default: maxtxlegacysigops,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: null,
    placeholder: null,
  }),
  limitancestorcount: Value.number({
    name: 'Max Ancestor Count',
    description:
      'Do not accept transactions if number of in-mempool ancestors is <n> or more',
    warning: null,
    default: limitancestorcount,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: null,
    placeholder: null,
  }),
  limitancestorsize: Value.number({
    name: 'Max Ancestor Size',
    description:
      'Do not accept transactions whose size with all in-mempool ancestors exceeds <n> kilobytes',
    warning: null,
    default: limitancestorsize,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'kB',
    placeholder: null,
  }),
  limitdescendantcount: Value.number({
    name: 'Max descendants count',
    description:
      'Do not accept transactions if any ancestor would have <n> or more in-mempool descendants',
    warning: null,
    default: limitdescendantcount,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: null,
    placeholder: null,
  }),
  limitdescendantsize: Value.number({
    name: 'Max descendants size',
    description:
      'Do not accept transactions if any ancestor would have more than <n> kilobytes of in-mempool descendants',
    warning: null,
    default: limitdescendantsize,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'kB',
    placeholder: null,
  }),
  permitbarepubkey: Value.toggle({
    name: 'Permit Bare Pubkey',
    default: permitbarepubkey,
    description: 'Relay legacy pubkey outputs',
    warning: null,
  }),
  maxscriptsize: Value.number({
    name: 'Max Script Size',
    description: 'Maximum size of scripts we relay and mine, in bytes',
    warning: null,
    default: maxscriptsize,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'Bytes',
    placeholder: null,
  }),
  datacarriercost: Value.number({
    name: 'Datacarrier cost',
    description:
      'Treat extra data in transactions as at least N vbytes per actual byte',
    warning: null,
    default: datacarriercost,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: null,
    placeholder: null,
  }),
  acceptnonstddatacarrier: Value.toggle({
    name: 'Accept non standard datacarrier',
    default: acceptnonstddatacarrier,
    description: 'Relay and mine non-OP_RETURN datacarrier injection',
    warning: null,
  }),
  dustrelayfee: Value.number({
    name: 'Dust Relay Fee',
    description:
      'Fee rate (in BTC/kvB) used to define dust, the value of an output such that it will cost more than its value in fees at this fee rate to spend it.',
    warning: null,
    default: dustrelayfee,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: false,
    units: 'BTC/kvB',
    placeholder: null,
  }),
  acceptunknownwitness: Value.toggle({
    name: 'Accept Unknown Witness',
    default: acceptunknownwitness,
    description: 'Relay transactions sending to unknown witness script versions',
    warning: null,
  }),
  minrelaycoinblocks: Value.number({
    name: 'Min Relay Coin Blocks',
    description: 'Minimum coin blocks (measured in sat per block) that a transaction must be spending to be relayed',
    warning: null,
    default: minrelaycoinblocks,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: null,
    placeholder: minrelaycoinblocks.toString(),
  }),
  minrelaymaturity: Value.number({
    name: 'Min Relay Maturity',
    description: 'Minimum number of blocks that inputs must mature before being spent in transactions we relay',
    warning: null,
    default: minrelaymaturity,
    required: true,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'Blocks',
    placeholder: minrelaymaturity.toString(),
  }),
})

export const mempoolConfig = sdk.Action.withInput(
  // id
  'mempool-config',

  // metadata
  async ({ effects }) => ({
    name: 'Mempool Settings',
    description: 'Edit the Mempool settings in bitcoin.conf',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),

  // form input specification
  mempoolSpec,

  // optionally pre-fill the input form
  ({ effects }) => read(effects),

  // the execution function
  ({ effects, input }) => write(effects, input),
)

async function read(effects: any): Promise<PartialMempoolSpec> {
  const bitcoinConf = await bitcoinConfFile.read().const(effects)
  if (!bitcoinConf) return {}

  const mempoolSettings: PartialMempoolSpec = {
    maxmempool: bitcoinConf.maxmempool,
    mempoolexpiry: bitcoinConf.mempoolexpiry,
    datacarriersize: bitcoinConf.datacarriersize,
    mempoolfullrbf: bitcoinConf.mempoolfullrbf,
    persistmempool: bitcoinConf.persistmempool,
    datacarrier: bitcoinConf.datacarrier,
    permitbaremultisig: bitcoinConf.permitbaremultisig,
    rejectparasites: bitcoinConf.rejectparasites,
    rejecttokens: bitcoinConf.rejecttokens,
    minrelaytxfee: bitcoinConf.minrelaytxfee,
    bytespersigop: bitcoinConf.bytespersigop,
    bytespersigopstrict: bitcoinConf.bytespersigopstrict,
    limitancestorcount: bitcoinConf.limitancestorcount,
    limitancestorsize: bitcoinConf.limitancestorsize,
    limitdescendantcount: bitcoinConf.limitdescendantcount,
    limitdescendantsize: bitcoinConf.limitdescendantsize,
    permitbarepubkey: bitcoinConf.permitbarepubkey,
    maxscriptsize: bitcoinConf.maxscriptsize,
    datacarriercost: bitcoinConf.datacarriercost,
    acceptnonstddatacarrier: bitcoinConf.acceptnonstddatacarrier,
    dustrelayfee: bitcoinConf.dustrelayfee,
    permitephemeral: bitcoinConf.permitephemeral,
    permitbareanchor: bitcoinConf.permitbareanchor,
    permitbaredatacarrier: bitcoinConf.permitbaredatacarrier,
    maxtxlegacysigops: bitcoinConf.maxtxlegacysigops,
    acceptunknownwitness: bitcoinConf.acceptunknownwitness,
    minrelaycoinblocks: bitcoinConf.minrelaycoinblocks,
    minrelaymaturity: bitcoinConf.minrelaymaturity,
    mempooltruc: bitcoinConf.mempooltruc
      ? { selection: bitcoinConf.mempooltruc, value: {} }
      : undefined,
    mempoolreplacement: bitcoinConf.mempoolreplacement
      ? { 
          selection: bitcoinConf.mempoolreplacement === "fee,-optin" ? "optout" : 
                     bitcoinConf.mempoolreplacement === "0" ? "disabled" :
                     bitcoinConf.mempoolreplacement === "fee,optin" ? "optin" : undefined,
          value: {} 
        }
      : undefined,
  }
  return mempoolSettings
}

async function write(effects: T.Effects, input: MempoolSpec) {
  const mempoolReplacementValue: "fee,-optin" | "0" | "fee,optin" | undefined = 
    input.mempoolreplacement?.selection === "optout" ? "fee,-optin" :
    input.mempoolreplacement?.selection === "disabled" ? "0" : 
    input.mempoolreplacement?.selection === "optin" ? "fee,optin" : undefined;
  
  const mempoolTrucValue: "accept" | undefined = input.mempooltruc?.selection as "accept" | undefined;
  
  const mempoolSettings = {
    mempoolfullrbf: input.mempoolfullrbf,
    persistmempool: input.persistmempool,
    datacarrier: input.datacarrier,
    permitbaremultisig: input.permitbaremultisig,
    maxmempool: input.maxmempool || maxmempool,
    mempoolexpiry: input.mempoolexpiry || mempoolexpiry,
    datacarriersize: input.datacarriersize || datacarriersize,
    rejectparasites: input.rejectparasites,
    rejecttokens: input.rejecttokens,
    minrelaytxfee: input.minrelaytxfee,
    bytespersigop: input.bytespersigop,
    bytespersigopstrict: input.bytespersigopstrict,
    limitancestorcount: input.limitancestorcount,
    limitancestorsize: input.limitancestorsize,
    limitdescendantcount: input.limitdescendantcount,
    limitdescendantsize: input.limitdescendantsize,
    permitbarepubkey: input.permitbarepubkey,
    maxscriptsize: input.maxscriptsize,
    datacarriercost: input.datacarriercost,
    acceptnonstddatacarrier: input.acceptnonstddatacarrier,
    dustrelayfee: input.dustrelayfee,
    permitephemeral: input.permitephemeral || undefined,
    permitbareanchor: input.permitbareanchor,
    permitbaredatacarrier: input.permitbaredatacarrier,
    maxtxlegacysigops: input.maxtxlegacysigops,
    acceptunknownwitness: input.acceptunknownwitness,
    minrelaycoinblocks: input.minrelaycoinblocks,
    minrelaymaturity: input.minrelaymaturity,
    mempooltruc: mempoolTrucValue,
    mempoolreplacement: mempoolReplacementValue,
  }

  await bitcoinConfFile.merge(effects, mempoolSettings)
}

type MempoolSpec = typeof mempoolSpec._TYPE
type PartialMempoolSpec = typeof mempoolSpec._PARTIAL
