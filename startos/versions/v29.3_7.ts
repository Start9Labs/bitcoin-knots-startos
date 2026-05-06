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

export const v29_3_7 = VersionInfo.of({
  version: '#knots:29.3:7',
  releaseNotes: {
    en_US:
      'Wallet actions are now more reliable, use GUIX binaries for bitcoind and bitcoin-cli, use Debian based images. Downgrades from Bitcoin Core v30 or v31 are now handled correctly.',
    es_ES:
      'Las acciones del monedero son ahora más fiables, use binarios GUIX para bitcoind y bitcoin-cli y utilice imágenes basadas en Debian. Ahora se gestionan correctamente las degradaciones desde Bitcoin Core v30 o v31.',
    de_DE:
      'Wallet-Aktionen sind jetzt zuverlässiger, verwenden Sie GUIX-Binärdateien für bitcoind und bitcoin-cli sowie Debian-basierte Images. Downgrades von Bitcoin Core v30 oder v31 werden jetzt korrekt verarbeitet.',
    pl_PL:
      'Operacje portfela są teraz bardziej niezawodne, używaj binariów GUIX dla bitcoind i bitcoin-cli oraz obrazów opartych na Debianie. Obniżenie wersji z Bitcoin Core v30 lub v31 jest teraz poprawnie obsługiwane.',
    fr_FR:
      'Les actions du portefeuille sont désormais plus fiables, utilise les binaires GUIX pour bitcoind et bitcoin-cli, utilise des images basées sur Debian. Les rétrogradations depuis Bitcoin Core v30 ou v31 sont désormais gérées correctement.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    // TEMPORARY: pinned `:N` keys instead of caret regex (`^28`/`^29`/...).
    // Range-keyed `migrations.other` interacted with two StartOS bugs that
    // could leave the on-disk data version stuck as a flavored range and
    // dead-end a subsequent flavor switch. Both fixes ship in beta.9; once
    // a node is on beta.9 or newer we can revert to range keys (one entry
    // per Core major instead of one per Core `:N`).
    other: {
      ['28.3:10']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['29.3:10']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['30.2:10']: {
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
      ['31.0:10']: {
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
    },
  },
}).satisfies('29.3:10')
