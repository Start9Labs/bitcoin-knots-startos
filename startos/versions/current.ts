import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'
/**
 * Reset all mempool settings to undefined so the new flavor's upstream
 * defaults take effect. This is the primary reason users switch between
 * Core and Knots.
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
 * Chain-split recovery flags (see startos/forkRecovery.ts), set on every
 * cross-flavor sidegrade and consumed by the destination flavor's
 * chain-recovery oneshot at next start (clean no-ops when there is nothing
 * to fix). The shared datadir carries each flavor's persisted per-block
 * verdicts across a switch, so:
 *
 * - Entering this (enforcing) flavor: if the chain advanced past the
 *   RDTS-applicable range without enforcement, that range must be
 *   re-validated (the publicly disclosed BIP-110 late-upgrade
 *   validation gap). The shipped
 *   RUNTIME_WARN binary enforces from its first start, so the switch
 *   itself is the enforcement transition. The oneshot's store marker
 *   (rdtsEnforcedLastRun) detects the same transition independently;
 *   setting the flag here makes the switch case deterministic even if a
 *   prior run never recorded a marker.
 * - Leaving for a non-enforcing flavor: RDTS-driven invalid verdicts must
 *   be reconsidered so they cannot pin Core / pre-RDTS Knots to a stale
 *   chain across a split.
 */
const enteringRdtsFlavor = { revalidateFromRdts: true }
const leavingRdtsFlavor = { reconsiderInvalidTips: true }

export const current = VersionInfo.of({
  version: '#knots:29.3.1:17',
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
    // Keyed by Core major series as caret ranges — one entry per Core
    // major, not per Core `:N`. Range-keyed `migrations.other` requires
    // StartOS ≥ 0.4.0-beta.9 (Start9Labs/start-os#3214).
    //
    // Intentional asymmetry: there is no `^#knotsprerdts` key here for the
    // pre-RDTS Knots sibling (B). The B↔C migration belt lives on B's own
    // `^#knots` entry (its `down` edge, B→C, sets revalidateFromRdts), which
    // fires because this flavor satisfies B's `canMigrateTo`; the runtime
    // rdtsEnforcedLastRun marker double-covers it. Not a gap — no mirror key.
    other: {
      ['^28']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, enteringRdtsFlavor)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      ['^29']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, enteringRdtsFlavor)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      ['^30']: {
        // Core → Knots: drop coinstatsindex written by Core 30+ at the new
        // path; Knots 29 only reads the old indexes/coinstats/ path, which
        // Core 30 deliberately preserved for downgrade.
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, enteringRdtsFlavor)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      ['^31']: {
        // Core → Knots: drop fee_estimates.dat (v31 bumped
        // CURRENT_FEES_FILE_VERSION 149900 → 309900; ≤30 hard-fails) and
        // coinstatsindex (same reason as 30.x).
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, enteringRdtsFlavor)
          await rm('/media/startos/volumes/main/fee_estimates.dat', {
            force: true,
          }).catch(console.error)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      // `#knotsrdts` (the "Bitcoin Knots plus BIP-110" build) is being
      // retired. Users on it can move here; preserve their RDTS acceptance
      // so the consensusrules critical-task gate doesn't re-fire. No
      // `down` — `#knotsrdts` is being de-listed, so the inverse path
      // can't be selected by a user.
      ['^#knotsrdts:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, { consensusrules: 'rdts' })
          // Also queue the RDTS re-validation: nothing proves the retired
          // build enforced RDTS over this datadir's whole history, and the
          // check self-clears when the chain never advanced unenforced.
          await storeJson.merge(effects, enteringRdtsFlavor)
        },
      },
    },
  },
})
  .satisfies('29.4:5')
  .satisfies('28.4:18')
