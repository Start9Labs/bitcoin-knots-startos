import { T } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { sdk } from '../../sdk'
import { bitcoinConfDefaults } from '../../utils'
import { i18n } from '../../i18n'

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

const mempoolSpec = sdk.InputSpec.of({
  persistmempool: Value.toggle({
    name: i18n('Persist Mempool'),
    default: persistmempool,
    description: i18n('Save the mempool on shutdown and load on restart.'),
  }),
  maxmempool: Value.number({
    name: i18n('Max Mempool Size'),
    description: i18n('Keep the transaction memory pool below <n> megabytes.'),
    required: false,
    default: maxmempool,
    min: 1,
    integer: true,
    units: 'MiB',
    placeholder: maxmempool.toString(),
  }),
  mempoolexpiry: Value.number({
    name: i18n('Mempool Expiration'),
    description: i18n(
      'Do not keep transactions in the mempool longer than <n> hours.',
    ),
    required: false,
    default: mempoolexpiry,
    min: 1,
    integer: true,
    units: i18n('Hr'),
    placeholder: mempoolexpiry.toString(),
  }),
  mempoolfullrbf: Value.toggle({
    name: i18n('Enable Full RBF'),
    default: mempoolfullrbf,
    description:
      i18n('Policy for your node to use for relaying and mining unconfirmed transactions.'),
  }),
  permitbaremultisig: Value.toggle({
    name: i18n('Permit Bare Multisig'),
    default: permitbaremultisig,
    description: i18n('Relay non-P2SH multisig transactions'),
  }),
  datacarrier: Value.toggle({
    name: i18n('Relay OP_RETURN Transactions'),
    default: datacarrier,
    description: i18n('Relay transactions with OP_RETURN outputs'),
  }),
  datacarriersize: Value.number({
    name: i18n('Max OP_RETURN Size'),
    description: i18n('Maximum size of data in OP_RETURN outputs to relay'),
    required: false,
    default: datacarriersize,
    min: 0,
    max: 10_000,
    integer: true,
    units: i18n('bytes'),
    placeholder: datacarriersize.toString(),
  }),
  permitbaredatacarrier: Value.toggle({
    name: i18n('Permit Bare Datacarrier'),
    default: permitbaredatacarrier,
    description: i18n('Relay transactions that only have data carrier outputs'),
  }),
  rejectparasites: Value.toggle({
    name: i18n('Reject Parasites'),
    default: rejectparasites,
    description: i18n('Reject parasite transactions'),
    warning: null,
  }),
  rejecttokens: Value.toggle({
    name: i18n('Reject Tokens'),
    default: rejecttokens,
    description: i18n('Reject tokens transactions (runes)'),
    warning: null,
  }),
  mempoolreplacement: Value.union(
    {
      name: i18n('Mempool replacement settings'),
      description:
        i18n('Set to disabled to disable RBF entirely, "fee,optin" to honour RBF opt-out signal, or "fee,-optin" to always RBF aka full RBF'),
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
      name: i18n('Mempool TRUC'),
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
    name: i18n('Permit Bare Anchor'),
    default: permitbareanchor,
    description: i18n('Relay transactions that only have ephemeral anchor outputs'),
  }),
  permitephemeral: Value.text({
    name: i18n('Permite Ephemeral'),
    description: i18n('Relay transaction packages that include ephemeral outputs defined by comma-separated options (prefix each by \'-\' to force off): \"anchor\" to allow minimal anyone-can-spend anchors, \"send\" to allow ordinary output types to be considered ephemeral, and \"dust\" to allow for dust-amount outputs rather than strictly zero-value'),
    required: false,
    default: null,
  }),
  minrelaytxfee: Value.number({
    name: i18n('Min Transaction Relay Fee'),
    description:
      i18n('Fee rates (in BTC/kB) smaller than this are considered zero fee for relaying, mining and transaction creation'),
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
    name: i18n('Bytes Per Sigop'),
    description:
      i18n('Equivalent bytes per sigop in transactions for relay and mining'),
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
    name: i18n('Bytes Per Sigop Strict'),
    description: i18n('Minimum bytes per sigop in transactions we relay and mine'),
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
    name: i18n('Max Legacy Sigops'),
    description: i18n('Maximum number of legacy sigops allowed in transactions we relay and mine, as measured by BIP54'),
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
    name: i18n('Max Ancestor Count'),
    description:
      i18n('Do not accept transactions if number of in-mempool ancestors is <n> or more'),
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
    name: i18n('Max Ancestor Size'),
    description:
      i18n('Do not accept transactions whose size with all in-mempool ancestors exceeds <n> kilobytes'),
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
    name: i18n('Max descendants count'),
    description:
      i18n('Do not accept transactions if any ancestor would have <n> or more in-mempool descendants'),
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
    name: i18n('Max descendants size'),
    description:
      i18n('Do not accept transactions if any ancestor would have more than <n> kilobytes of in-mempool descendants'),
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
    name: i18n('Permit Bare Pubkey'),
    default: permitbarepubkey,
    description: i18n('Relay legacy pubkey outputs'),
    warning: null,
  }),
  maxscriptsize: Value.number({
    name: i18n('Max Script Size'),
    description: i18n('Maximum size of scripts we relay and mine, in bytes'),
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
    name: i18n('Datacarrier cost'),
    description:
      i18n('Treat extra data in transactions as at least N vbytes per actual byte'),
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
    name: i18n('Accept non standard datacarrier'),
    default: acceptnonstddatacarrier,
    description: i18n('Relay and mine non-OP_RETURN datacarrier injection'),
    warning: null,
  }),
  dustrelayfee: Value.number({
    name: i18n('Dust Relay Fee'),
    description:
      i18n('Fee rate (in BTC/kvB) used to define dust, the value of an output such that it will cost more than its value in fees at this fee rate to spend it.'),
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
    name: i18n('Accept Unknown Witness'),
    default: acceptunknownwitness,
    description: i18n('Relay transactions sending to unknown witness script versions'),
    warning: null,
  }),
  minrelaycoinblocks: Value.number({
    name: i18n('Min Relay Coin Blocks'),
    description: i18n('Minimum coin blocks (measured in sat per block) that a transaction must be spending to be relayed'),
    warning: null,
    default: null,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: null,
    placeholder: null,
  }),
  minrelaymaturity: Value.number({
    name: i18n('Min Relay Maturity'),
    description: i18n('Minimum number of blocks that inputs must mature before being spent in transactions we relay'),
    warning: null,
    default: null,
    required: false,
    min: 0,
    max: null,
    step: null,
    integer: true,
    units: 'Blocks',
    placeholder: null,
  }),
})

export const mempoolConfig = sdk.Action.withInput(
  // id
  'mempool-config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Mempool Settings'),
    description: i18n('Edit the Mempool settings in bitcoin.conf'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
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
    minrelaycoinblocks: input.minrelaycoinblocks || undefined,
    minrelaymaturity: input.minrelaymaturity || undefined,
    mempooltruc: mempoolTrucValue,
    mempoolreplacement: mempoolReplacementValue,
  }

  await bitcoinConfFile.merge(effects, mempoolSettings)
}

type MempoolSpec = typeof mempoolSpec._TYPE
type PartialMempoolSpec = typeof mempoolSpec._PARTIAL
