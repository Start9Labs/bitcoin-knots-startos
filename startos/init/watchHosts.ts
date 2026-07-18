import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { peerInterfaceId, peerPortExternal } from '../utils'

export const watchHosts = sdk.setupOnInit(async (effects, kind) => {
  const publicInfo = await sdk.serviceInterface
    .getOwn(effects, peerInterfaceId, (i) =>
      i?.addressInfo?.public.filter({
        exclude: { kind: 'domain' },
      }),
    )
    .const()

  if (!publicInfo) return

  const externalip: string[] = []

  /**
   * The Tor plugin always maps the hidden service's virtual port to the
   * binding's preferredExternalPort (8333) — never to the OS-assigned
   * external port, which can drift (e.g. to 8334) when 8333 is already
   * claimed on the host, such as by a stale binding from an earlier
   * package layout. `format()` emits the assigned port, so on affected
   * systems bitcoind advertised `<onion>:8334` while the hidden service
   * only accepts `:8333`, silently killing organic inbound (#19). Pin the
   * advertised port to the port the hidden service actually exposes.
   */
  const onions = publicInfo
    .filter({
      predicate: ({ metadata }) =>
        metadata.kind === 'plugin' && metadata.packageId === 'tor',
    })
    .format('hostname-info')
    .map(({ hostname }) => `${hostname}:${peerPortExternal}`)

  // A hostname exported under multiple port keys collapses to one entry
  externalip.push(...new Set(onions))

  const ipv4s = publicInfo.filter({ kind: 'ipv4' }).format()

  externalip.push(...ipv4s)

  await bitcoinConfFile.merge(
    effects,
    {
      raw: {
        externalip: externalip.length > 0 ? externalip : undefined,
      },
    },
    { allowWriteAfterConst: true },
  )
})
