import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'

/**
 * Reset all mempool settings to undefined so the new flavor's upstream
 * defaults take effect. Applied on Core↔Knots transitions only; Knots
 * variants share identical mempool defaults so switching between them
 * leaves the mempool config alone.
 */
const mempoolReset = {
  // Shared mempool settings
  persistmempool: undefined,
  maxmempool: undefined,
  mempoolexpiry: undefined,
  mempoolfullrbf: undefined,
  permitbaremultisig: undefined,
  datacarrier: undefined,
  datacarriersize: undefined,
  // Knots-specific mempool settings
  permitbaredatacarrier: undefined,
  rejectparasites: undefined,
  rejecttokens: undefined,
  mempoolreplacement: undefined,
  mempooltruc: undefined,
  permitbareanchor: undefined,
  permitephemeral: undefined,
  minrelaytxfee: undefined,
  bytespersigop: undefined,
  bytespersigopstrict: undefined,
  maxtxlegacysigops: undefined,
  limitancestorcount: undefined,
  limitancestorsize: undefined,
  limitdescendantcount: undefined,
  limitdescendantsize: undefined,
  permitbarepubkey: undefined,
  maxscriptsize: undefined,
  datacarriercost: undefined,
  acceptnonstddatacarrier: undefined,
  dustrelayfee: undefined,
  acceptunknownwitness: undefined,
  minrelaycoinblocks: undefined,
  minrelaymaturity: undefined,
}

/**
 * Chain-split recovery flags (see startos/forkRecovery.ts), set on the
 * sidegrades between this flavor and the RDTS-enforcing `#knots` flavor
 * and consumed by the destination flavor's chain-recovery oneshot at next
 * start (clean no-ops when there is nothing to fix). The shared datadir
 * carries each flavor's persisted per-block verdicts across a switch, so —
 * from this (never-enforcing) flavor's perspective:
 *
 * - `up` from the enforcing sibling is *leaving* enforcement: RDTS-driven
 *   invalid verdicts must be reconsidered so they cannot pin this node to
 *   a stale chain across a split. This flavor's oneshot consumes the flag.
 * - `down` toward the enforcing sibling is *entering* enforcement: if the
 *   chain advanced past the RDTS-applicable range without enforcement,
 *   that range must be re-validated (the publicly disclosed BIP-110
 *   late-upgrade validation gap).
 *   The flag stays dormant here; the sibling's oneshot consumes it on its
 *   first start. Its own store marker (rdtsEnforcedLastRun) detects the
 *   same transition independently; setting the flag here makes the switch
 *   case deterministic even if a prior run never recorded a marker.
 */
const enteringRdtsFlavor = { revalidateFromRdts: true }
const leavingRdtsFlavor = { reconsiderInvalidTips: true }

export const current = VersionInfo.of({
  version: '#knotsprerdts:29.3:18',
  releaseNotes: {
    en_US: `Fixes on-demand fetching of pruned blocks.

A pruned node keeps only recent blocks, so this package bundles a proxy that fetches any older block from the peer-to-peer network the moment something asks for it — that is what lets a Lightning node, Electrum server or block explorer work against a pruned node. The proxy was running, but the fetching itself was never switched on, so any request for a block older than your prune depth simply failed. LND, for one, could never finish building its channel graph. Those requests are now served as intended. The fetch is also cheaper: a block is pulled from a few peers rather than all of them at once. Unpruned nodes are unaffected — they never run the proxy.`,
    es_ES: `Corrige la obtención bajo demanda de bloques podados.

Un nodo podado solo conserva los bloques recientes, por lo que este paquete incluye un proxy que descarga cualquier bloque más antiguo de la red entre pares en cuanto algo lo solicita: eso es lo que permite que un nodo Lightning, un servidor Electrum o un explorador de bloques funcionen contra un nodo podado. El proxy estaba en marcha, pero esa descarga nunca llegó a activarse, así que cualquier petición de un bloque anterior a tu profundidad de poda fallaba sin más. LND, por ejemplo, nunca lograba terminar de construir su grafo de canales. Esas peticiones ya se atienden como corresponde. La descarga también es más económica: un bloque se solicita a unos pocos pares en lugar de a todos a la vez. Los nodos sin podar no se ven afectados: nunca ejecutan el proxy.`,
    de_DE: `Behebt das bedarfsgesteuerte Nachladen beschnittener Blöcke.

Ein beschnittener Knoten behält nur die jüngsten Blöcke, deshalb bringt dieses Paket einen Proxy mit, der jeden älteren Block in dem Moment aus dem Peer-to-Peer-Netz nachlädt, in dem etwas ihn anfordert — genau das lässt einen Lightning-Knoten, einen Electrum-Server oder einen Block-Explorer mit einem beschnittenen Knoten arbeiten. Der Proxy lief zwar, das Nachladen selbst war aber nie eingeschaltet, sodass jede Anfrage nach einem Block jenseits deiner Prune-Tiefe schlicht fehlschlug. LND etwa konnte seinen Kanalgraphen nie fertig aufbauen. Diese Anfragen werden jetzt wie vorgesehen bedient. Das Nachladen ist außerdem sparsamer: Ein Block wird von einigen wenigen Gegenstellen geholt statt von allen gleichzeitig. Unbeschnittene Knoten sind nicht betroffen — sie starten den Proxy nie.`,
    pl_PL: `Naprawia pobieranie na żądanie bloków usuniętych przez przycinanie.

Węzeł z włączonym przycinaniem przechowuje tylko najnowsze bloki, dlatego pakiet zawiera proxy, które pobiera każdy starszy blok z sieci peer-to-peer w chwili, gdy coś go zażąda — to właśnie pozwala węzłowi Lightning, serwerowi Electrum czy eksploratorowi bloków działać na przyciętym węźle. Proxy działało, ale samo pobieranie nigdy nie zostało włączone, więc każde żądanie bloku starszego niż twoja głębokość przycinania po prostu kończyło się błędem. LND na przykład nigdy nie potrafił dokończyć budowy swojego grafu kanałów. Te żądania są już obsługiwane zgodnie z założeniem. Samo pobieranie jest też tańsze: blok jest ściągany od kilku węzłów zamiast od wszystkich naraz. Węzłów bez przycinania to nie dotyczy — nigdy nie uruchamiają proxy.`,
    fr_FR: `Corrige la récupération à la demande des blocs élagués.

Un nœud élagué ne conserve que les blocs récents ; ce paquet embarque donc un proxy qui récupère n'importe quel bloc plus ancien sur le réseau pair-à-pair dès que quelque chose le demande — c'est ce qui permet à un nœud Lightning, un serveur Electrum ou un explorateur de blocs de fonctionner avec un nœud élagué. Le proxy tournait, mais cette récupération n'a jamais été activée : toute demande d'un bloc antérieur à votre profondeur d'élagage échouait purement et simplement. LND, par exemple, ne parvenait jamais à terminer la construction de son graphe de canaux. Ces demandes sont désormais servies comme prévu. La récupération est aussi moins coûteuse : un bloc est demandé à quelques pairs plutôt qu'à tous à la fois. Les nœuds non élagués ne sont pas concernés : ils n'exécutent jamais le proxy.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    other: {
      // Core ↔ #knotsprerdts. Mirrors what `#knots` does for the same
      // Core majors: mempool reset on every transition, plus data-path
      // cleanup for Core 30 (coinstatsindex moved) and Core 31 (fees-file
      // bump + coinstatsindex).
      ['^28']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^29']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^30']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^31']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await rm('/media/startos/volumes/main/fee_estimates.dat', {
            force: true,
          }).catch(console.error)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      // #knots ↔ #knotsprerdts. Same data layout; this flavor ships
      // the last pre-RDTS Knots release (20260507). Switching here is
      // an explicit opt-out of RDTS, so
      // clear any `consensusrules=rdts` acceptance carried over from
      // `#knots` — otherwise nothing else in this build would remove
      // it, and a later switch back to `#knots` would silently skip
      // the critical-task gate — and queue the invalid-verdict
      // reconsideration. `down` leaves `consensusrules` absent (`#knots`'s
      // init hook re-prompts for acceptance when the key is absent) and
      // queues the RDTS re-validation the enforcing sibling runs on its
      // first start.
      ['^#knots:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            raw: { consensusrules: undefined },
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
        down: async ({ effects }) => {
          await storeJson.merge(effects, enteringRdtsFlavor)
        },
      },
      // `#knotsrdts` (the retired "Bitcoin Knots plus BIP-110" build)
      // is being de-listed. Users on it can move here; same data layout,
      // and same RDTS-opt-out cleanup and verdict-clearing as the
      // `#knots` path above. No `down` — `#knotsrdts` can't be selected
      // as a destination.
      ['^#knotsrdts:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            raw: { consensusrules: undefined },
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
    },
  },
})
  .satisfies('29.4:5')
  .satisfies('28.4:18')
