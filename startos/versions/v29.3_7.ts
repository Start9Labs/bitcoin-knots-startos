import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
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
    en_US: 'Wallet actions are now more reliable, use GUIX binaries for bitcoind and bitcoin-cli, use Debian based images',
    es_ES: 'Las acciones del monedero son ahora más fiables, use binarios GUIX para bitcoind y bitcoin-cli y utilice imágenes basadas en Debian',
    de_DE: 'Wallet-Aktionen sind jetzt zuverlässiger, verwenden Sie GUIX-Binärdateien für bitcoind und bitcoin-cli sowie Debian-basierte Images',
    pl_PL: 'Operacje portfela są teraz bardziej niezawodne, używaj binariów GUIX dla bitcoind i bitcoin-cli oraz obrazów opartych na Debianie',
    fr_FR: 'Les actions du portefeuille sont désormais plus fiables, utilise les binaires GUIX pour bitcoind et bitcoin-cli, utilise des images basées sur Debian',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    other: {
      ['28.3:9']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['29.3:9']: {
        // Core → Knots: reset mempool so Knots upstream defaults apply
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core: reset mempool so Core upstream defaults apply
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['30.2:9']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['31.0:9']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
    },
  },
}).satisfies('29.3:9')
