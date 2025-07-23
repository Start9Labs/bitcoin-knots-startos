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
} = bitcoinConfDefaults

const { Value, InputSpec } = sdk

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
  // @TODO while mempoolreplacement and mempooltruc appear in the 0.3.5.1 package getConfig.ts, they were never implemented in the resulting bitcoin.conf
  // mempoolreplacement: Value.union(
  //   {
  //     name: 'Mempool replacement settings',
  //     description:
  //       'Set to disabled to disable RBF entirely, "fee,optin" to honour RBF opt-out signal, or "fee,-optin" to always RBF aka full RBF',
  //     warning: null,
  //     default: 'optout',
  //   },
  //   Variants.of({
  //     disabled: { name: 'Disabled', spec: InputSpec.of({}) },
  //     optin: { name: 'fee,optin', spec: InputSpec.of({}) },
  //     optout: { name: 'fee,-optin', spec: InputSpec.of({}) },
  //   }),
  // ),
  // mempooltruc: Value.union(
  //   {
  //     name: 'Mempool TRUC',
  //     description:
  //       'Behaviour for transactions requesting TRUC limits: "reject" the transactions entirely, "accept" them just like any other, or "enforce" to impose their requested restrictions',
  //     warning: null,
  //     default: 'accept',
  //   },
  //   Variants.of({
  //     reject: { name: 'Reject', spec: InputSpec.of({}) },
  //     accept: { name: 'Accept', spec: InputSpec.of({}) },
  //     enforce: { name: 'Enforce', spec: InputSpec.of({}) },
  //   }),
  // ),
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
  }
  return mempoolSettings
}

async function write(effects: T.Effects, input: MempoolSpec) {
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
  }

  await bitcoinConfFile.merge(effects, mempoolSettings)
}

type MempoolSpec = typeof mempoolSpec._TYPE
type PartialMempoolSpec = typeof mempoolSpec._PARTIAL

// export const _0351InputSpec = InputSpec.of({
//   blkconstr: Value.object(
//     {
//       name: 'Mempool',
//       description: 'Options about standard policies and mining block templates',
//     },
//     InputSpec.of({
//       datacarrier: Value.toggle({
//         name: 'Datacarrier',
//         default: true,
//         description: 'Relay and mine data carrier transactions',
//         warning: null,
//       }),
//       datacarriersize:
//         /* TODO: Convert range for this value ([0,100000])*/ Value.number({
//           name: 'Datacarrier Size',
//           description: 'Maximum size of arbitrary data to relay and mine',
//           warning: null,
//           default: 42,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'bytes',
//           placeholder: null,
//         }),
//       permitbaremultisig: Value.toggle({
//         name: 'Permit Bare Multisig',
//         default: false,
//         description: 'Relay non-P2SH multisig',
//         warning: null,
//       }),
//       rejectparasites: Value.toggle({
//         name: 'Reject Parasites',
//         default: true,
//         description: 'Reject parasite transactions',
//         warning: null,
//       }),
//       rejecttokens: Value.toggle({
//         name: 'Reject Tokens',
//         default: false,
//         description: 'Reject tokens transactions (runes)',
//         warning: null,
//       }),
//       persistmempool: Value.toggle({
//         name: 'Persist Mempool',
//         default: true,
//         description: 'Save the mempool on shutdown and load on restart.',
//         warning: null,
//       }),
//       mempoolexpiry:
//         /* TODO: Convert range for this value ([1,*))*/ Value.number({
//           name: 'Mempool Expiration',
//           description:
//             'Do not keep transactions in the mempool longer than <n> hours.',
//           warning: null,
//           default: 336,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'Hr',
//           placeholder: null,
//         }),
//       mempoolfullrbf: Value.toggle({
//         name: 'Enable Full RBF',
//         default: true,
//         description:
//           'Policy for your node to use for relaying and mining unconfirmed transactions.  For details, see https://github.com/bitcoin/bitcoin/blob/master/doc/release-notes/release-notes-24.0.md#notice-of-new-option-for-transaction-replacement-policies',
//         warning: null,
//       }),
//       mempoolreplacement: Value.union(
//         {
//           name: 'Mempool replacement settings',
//           description:
//             'Set to disabled to disable RBF entirely, "fee,optin" to honour RBF opt-out signal, or "fee,-optin" to always RBF aka full RBF',
//           warning: null,
//           default: 'optout',
//         },
//         Variants.of({
//           disabled: { name: 'Disabled', spec: InputSpec.of({}) },
//           optin: { name: 'fee,optin', spec: InputSpec.of({}) },
//           optout: { name: 'fee,-optin', spec: InputSpec.of({}) },
//         }),
//       ),
//       mempooltruc: Value.union(
//         {
//           name: 'Mempool TRUC',
//           description:
//             'Behaviour for transactions requesting TRUC limits: "reject" the transactions entirely, "accept" them just like any other, or "enforce" to impose their requested restrictions',
//           warning: null,
//           default: 'accept',
//         },
//         Variants.of({
//           reject: { name: 'Reject', spec: InputSpec.of({}) },
//           accept: { name: 'Accept', spec: InputSpec.of({}) },
//           enforce: { name: 'Enforce', spec: InputSpec.of({}) },
//         }),
//       ),
//       minrelaytxfee:
//         /* TODO: Convert range for this value ([0,21000000])*/ Value.number({
//           name: 'Min Transaction Relay Fee',
//           description:
//             'Fee rates (in BTC/kB) smaller than this are considered zero fee for relaying, mining and transaction creation',
//           warning: null,
//           default: 0.00001,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: false,
//           units: 'BTC/kvB',
//           placeholder: null,
//         }),
//       bytespersigop:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Bytes Per Sigop',
//           description:
//             'Equivalent bytes per sigop in transactions for relay and mining',
//           warning: null,
//           default: 20,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'bytes',
//           placeholder: null,
//         }),
//       bytespersigopstrict:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Bytes Per Sigop Strict',
//           description:
//             'Minimum bytes per sigop in transactions we relay and mine',
//           warning: null,
//           default: 20,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'bytes',
//           placeholder: null,
//         }),
//       limitancestorcount:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Max Ancestor Count',
//           description:
//             'Do not accept transactions if number of in-mempool ancestors is <n> or more',
//           warning: null,
//           default: 25,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: null,
//           placeholder: null,
//         }),
//       limitancestorsize:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Max Ancestor Size',
//           description:
//             'Do not accept transactions whose size with all in-mempool ancestors exceeds <n> kilobytes',
//           warning: null,
//           default: 101,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'kB',
//           placeholder: null,
//         }),
//       limitdescendantcount:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Max descendants count',
//           description:
//             'Do not accept transactions if any ancestor would have <n> or more in-mempool descendants',
//           warning: null,
//           default: 25,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: null,
//           placeholder: null,
//         }),
//       limitdescendantsize:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Max descendants size',
//           description:
//             'Do not accept transactions if any ancestor would have more than <n> kilobytes of in-mempool descendants',
//           warning: null,
//           default: 101,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'kB',
//           placeholder: null,
//         }),
//       permitbarepubkey: Value.toggle({
//         name: 'Permit Bare Pubkey',
//         default: false,
//         description: 'Relay legacy pubkey outputs',
//         warning: null,
//       }),
//       maxscriptsize:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Max Script Size',
//           description: 'Maximum size of scripts we relay and mine, in bytes',
//           warning: null,
//           default: 1650,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: 'Bytes',
//           placeholder: null,
//         }),
//       datacarriercost:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Datacarrier cost',
//           description:
//             'Treat extra data in transactions as at least N vbytes per actual byte',
//           warning: null,
//           default: 1,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: true,
//           units: null,
//           placeholder: null,
//         }),
//       acceptnonstddatacarrier: Value.toggle({
//         name: 'Accept non standard datacarrier',
//         default: false,
//         description: 'Relay and mine non-OP_RETURN datacarrier injection',
//         warning: null,
//       }),
//       dustrelayfee:
//         /* TODO: Convert range for this value ([0,*))*/ Value.number({
//           name: 'Dust Relay Fee',
//           description:
//             'Fee rate (in BTC/kvB) used to define dust, the value of an output such that it will cost more than its value in fees at this fee rate to spend it.',
//           warning: null,
//           default: 0.00003,
//           required: true,
//           min: null,
//           max: null,
//           step: null,
//           integer: false,
//           units: 'BTC/kvB',
//           placeholder: null,
//         }),
//     }),
//   ),
// })
