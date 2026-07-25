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
  version: '#knotsprerdts:29.3:17',
  releaseNotes: {
    en_US: `Gives local services a dedicated, trusted connection for downloading blocks.

Services on this server that pull blocks from Bitcoin Knots over the peer protocol — Electrs, for instance — were connecting on the same port as anonymous peers from the internet, and were treated with the same suspicion: liable to be dropped to make room for another peer, and subject to the limits that protect your upload bandwidth. They now connect on a separate, local-only port that Bitcoin Knots trusts, so a busy wallet query can no longer get them disconnected. Connections from the internet are unaffected and still arrive on the public port.`,
    es_ES: `Ofrece a los servicios locales una conexión dedicada y de confianza para descargar bloques.

Los servicios de este servidor que obtienen bloques de Bitcoin Knots mediante el protocolo entre pares —Electrs, por ejemplo— se conectaban por el mismo puerto que los pares anónimos de internet y recibían el mismo trato receloso: podían ser desconectados para dejar sitio a otro par y estaban sujetos a los límites que protegen tu ancho de banda de subida. Ahora se conectan por un puerto aparte, solo local, en el que Bitcoin Knots confía, de modo que una consulta intensa de una cartera ya no puede provocar su desconexión. Las conexiones desde internet no cambian y siguen llegando al puerto público.`,
    de_DE: `Gibt lokalen Diensten eine eigene, vertrauenswürdige Verbindung zum Herunterladen von Blöcken.

Dienste auf diesem Server, die Blöcke über das Peer-Protokoll von Bitcoin Knots beziehen — etwa Electrs —, verbanden sich über denselben Port wie anonyme Gegenstellen aus dem Internet und wurden ebenso misstrauisch behandelt: Sie konnten getrennt werden, um Platz für eine andere Gegenstelle zu schaffen, und unterlagen den Limits, die deine Upload-Bandbreite schützen. Jetzt verbinden sie sich über einen separaten, rein lokalen Port, dem Bitcoin Knots vertraut, sodass eine intensive Wallet-Abfrage sie nicht mehr trennen kann. Verbindungen aus dem Internet bleiben unverändert und laufen weiterhin über den öffentlichen Port.`,
    pl_PL: `Daje lokalnym usługom dedykowane, zaufane połączenie do pobierania bloków.

Usługi na tym serwerze, które pobierają bloki z Bitcoin Knots przez protokół peer-to-peer — na przykład Electrs — łączyły się tym samym portem co anonimowe węzły z internetu i były traktowane równie nieufnie: mogły zostać rozłączone, by zrobić miejsce innemu węzłowi, i podlegały limitom chroniącym twoje pasmo wysyłania. Teraz łączą się osobnym, wyłącznie lokalnym portem, któremu Bitcoin Knots ufa, więc intensywne zapytanie portfela nie może już ich rozłączyć. Połączenia z internetu nie zmieniają się i nadal trafiają na port publiczny.`,
    fr_FR: `Donne aux services locaux une connexion dédiée et de confiance pour télécharger les blocs.

Les services de ce serveur qui récupèrent des blocs auprès de Bitcoin Knots via le protocole pair-à-pair — Electrs, par exemple — se connectaient sur le même port que les pairs anonymes d'internet et étaient traités avec la même méfiance : susceptibles d'être déconnectés pour laisser la place à un autre pair, et soumis aux limites qui protègent votre bande passante montante. Ils se connectent désormais sur un port distinct, uniquement local, auquel Bitcoin Knots fait confiance, de sorte qu'une requête de portefeuille intensive ne peut plus provoquer leur déconnexion. Les connexions venues d'internet sont inchangées et arrivent toujours sur le port public.`,
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
  .satisfies('29.4:4')
  .satisfies('28.4:17')
