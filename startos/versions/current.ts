import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
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

export const current = VersionInfo.of({
  version: '#knots:29.3.1:16',
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
    // Keyed by Core major series as caret ranges — one entry per Core
    // major, not per Core `:N`. Range-keyed `migrations.other` requires
    // StartOS ≥ 0.4.0-beta.9 (Start9Labs/start-os#3214).
    other: {
      ['^28']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^29']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^30']: {
        // Core → Knots: drop coinstatsindex written by Core 30+ at the new
        // path; Knots 29 only reads the old indexes/coinstats/ path, which
        // Core 30 deliberately preserved for downgrade.
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^31']: {
        // Core → Knots: drop fee_estimates.dat (v31 bumped
        // CURRENT_FEES_FILE_VERSION 149900 → 309900; ≤30 hard-fails) and
        // coinstatsindex (same reason as 30.x).
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
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
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
        },
      },
    },
  },
})
  .satisfies('29.4:4')
  .satisfies('28.4:17')
