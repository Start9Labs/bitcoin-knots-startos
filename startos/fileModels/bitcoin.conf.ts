import { FileHelper, matches } from '@start9labs/start-sdk'
import { bitcoinConfDefaults } from '../utils'

const { object, anyOf } = matches

const stringArray = matches.array(matches.string)
const string = stringArray.map(([a]) => a).orParser(matches.string)
const number = string.map((a) => Number(a)).orParser(matches.number)
const natural = string.map((a) => Number(a)).orParser(matches.natural)
const boolean = number.map((a) => !!a).orParser(matches.boolean)
const literal = (val: string | number) => {
  return matches
    .literal([String(val)])
    .orParser(matches.literal(String(val)))
    .orParser(matches.literal(val))
    .map((a) => (typeof val === 'number' ? Number(a) : a))
}

const onlyNetOptions = anyOf(
  matches.literal('ipv4'),
  matches.literal('ipv6'),
  matches.literal('onion'),
  matches.literal('i2p'),
  matches.literal('cjdns'),
)

const {
  rpcbind,
  rpcallowip,
  rpcauth,
  rpcservertimeout,
  rpcthreads,
  rpcworkqueue,
  rpccookiefile,
  whitelist,
  bind,
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
  listen,
  onlynet,
  externalip,
  v2transport,
  connect,
  addnode,
  disablewallet,
  avoidpartialspends,
  discardfee,
  blockmaxsize,
  blockmaxweight,
  blocknotify,
  prune,
  zmqpubrawblock,
  zmqpubhashblock,
  zmqpubhashtx,
  zmqpubrawtx,
  zmqpubsequence,
  coinstatsindex,
  txindex,
  dbcache,
  peerbloomfilters,
  blockfilterindex,
  peerblockfilters,
  blocknotify,
  blockmaxsize,
  blockmaxweight,
} = bitcoinConfDefaults

export const shape = object({
  // RPC
  rpcbind: string.onMismatch(rpcbind),
  rpcallowip: string.onMismatch(rpcallowip),
  rpcauth: stringArray.orParser(string).optional().onMismatch(rpcauth),
  rpcservertimeout: natural.onMismatch(rpcservertimeout),
  rpcthreads: natural.onMismatch(rpcthreads),
  rpcworkqueue: natural.onMismatch(rpcworkqueue),
  rpccookiefile: literal(rpccookiefile).onMismatch(rpccookiefile),

  // Mempool
  mempoolfullrbf: boolean.onMismatch(mempoolfullrbf),
  persistmempool: boolean.optional().onMismatch(persistmempool),
  maxmempool: natural.optional().onMismatch(maxmempool),
  mempoolexpiry: natural.onMismatch(mempoolexpiry),
  datacarrier: boolean.onMismatch(datacarrier),
  datacarriersize: natural.onMismatch(datacarriersize),
  permitbaremultisig: boolean.onMismatch(permitbaremultisig),
  rejectparasites: boolean.optional().onMismatch(rejectparasites),
  rejecttokens: boolean.optional().onMismatch(rejecttokens),
  minrelaytxfee: number.optional().onMismatch(minrelaytxfee),
  bytespersigop: natural.optional().onMismatch(bytespersigop),
  bytespersigopstrict: natural.optional().onMismatch(bytespersigopstrict),
  limitancestorcount: natural.optional().onMismatch(limitancestorcount),
  limitancestorsize: natural.optional().onMismatch(limitancestorsize),
  limitdescendantcount: natural.optional().onMismatch(limitdescendantcount),
  limitdescendantsize: natural.optional().onMismatch(limitdescendantsize),
  permitbarepubkey: boolean.optional().onMismatch(permitbarepubkey),
  maxscriptsize: natural.optional().onMismatch(maxscriptsize),
  datacarriercost: natural.optional().onMismatch(datacarriercost),
  acceptnonstddatacarrier: boolean
    .optional()
    .onMismatch(acceptnonstddatacarrier),
  dustrelayfee: number.optional().onMismatch(dustrelayfee),

  // Peers
  listen: boolean.onMismatch(listen),
  bind: string.optional().onMismatch(bind),
  connect: stringArray.orParser(string).optional().onMismatch(connect),
  addnode: stringArray.orParser(string).optional().onMismatch(addnode),
  onlynet: arrayOf(onlyNetOptions.optional().onMismatch(undefined)).optional(),
  v2transport: boolean.onMismatch(v2transport),
  externalip: string.optional().onMismatch(externalip),

  // Blocknotify
  blocknotify: string.optional().onMismatch(blocknotify),

  // Whitelist
  whitelist: stringArray.orParser(string).optional().onMismatch(whitelist),

  // Pruning
  prune: natural.onMismatch(prune),

  // Performance Tuning
  dbcache: natural.onMismatch(dbcache),

  // Other
  blockmaxsize: natural.optional().onMismatch(blockmaxsize),
  blockmaxweight: natural.optional().onMismatch(blockmaxweight),

  // Wallet
  disablewallet: boolean.onMismatch(disablewallet),
  avoidpartialspends: boolean.onMismatch(avoidpartialspends),
  discardfee: natural.onMismatch(discardfee),

  // Zero MQ
  zmqpubrawblock: string.optional().onMismatch(zmqpubrawblock),
  zmqpubhashblock: string.optional().onMismatch(zmqpubhashblock),
  zmqpubrawtx: string.optional().onMismatch(zmqpubrawtx),
  zmqpubhashtx: string.optional().onMismatch(zmqpubhashtx),
  zmqpubsequence: string.optional().onMismatch(zmqpubsequence),

  // TxIndex
  txindex: boolean.onMismatch(txindex),

  // CoinstatsIndex
  coinstatsindex: boolean.onMismatch(coinstatsindex),

  // BIP37
  peerbloomfilters: boolean.onMismatch(peerbloomfilters),

  // BIP157
  blockfilterindex: string.optional().onMismatch(blockfilterindex),
  peerblockfilters: boolean.onMismatch(peerblockfilters),
})

function onWrite(a: unknown): any {
  if (a && typeof a === 'object') {
    if (Array.isArray(a)) {
      return a.map(onWrite)
    }
    return Object.fromEntries(
      Object.entries(a).map(([k, v]) => [k, onWrite(v)]),
    )
  } else if (typeof a === 'boolean') {
    return a ? 1 : 0
  }
  return a
}

export const bitcoinConfFile = FileHelper.ini(
  {
    volumeId: 'main',
    subpath: '/bitcoin.conf',
  },
  shape,
  { bracketedArray: false },
  {
    onRead: (a) => a,
    onWrite,
  },
)
