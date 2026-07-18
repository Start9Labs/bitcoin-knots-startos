import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { sdk } from '../sdk'
import { peerHostId, peerInterfaceId, peerPortExternal } from '../utils'

export const watchHosts = sdk.setupOnInit(async (effects, kind) => {
  // One subscription on the peer host; the map fn returns just the advertised
  // externalip list (onions + public IPv4), so this re-runs only when that
  // list changes rather than on unrelated host churn.
  const externalip = await sdk.host
    .getOwn(effects, peerHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === peerInterfaceId)
      if (!host || !iface) return undefined
      const publicInfo = iface.addressInfo.public.filter({
        exclude: { kind: 'domain' },
      })
      /**
       * The Tor plugin always maps the hidden service's virtual port to the
       * binding's preferredExternalPort (8333) — never to the OS-assigned
       * external port, which can drift (e.g. to 8334) when 8333 is already
       * claimed on the host, such as by a stale binding from an earlier
       * package layout. `format()` emits the assigned port, so on affected
       * systems bitcoind advertised `<onion>:8334` while the hidden service
       * only accepts `:8333`, silently killing organic inbound (#19). Pin
       * the advertised port to the port the hidden service actually exposes,
       * deduped since a hostname exported under multiple port keys collapses
       * to one entry.
       */
      return [
        ...new Set(
          publicInfo
            .filter({
              predicate: ({ metadata }) =>
                metadata.kind === 'plugin' && metadata.packageId === 'tor',
            })
            .format('hostname-info')
            .map(({ hostname }) => `${hostname}:${peerPortExternal}`),
        ),
        ...publicInfo.filter({ kind: 'ipv4' }).format(),
      ]
    })
    .const()

  if (!externalip) return

  await bitcoinConfFile.merge(
    effects,
    { raw: { externalip: externalip.length > 0 ? externalip : undefined } },
    { allowWriteAfterConst: true },
  )
})
