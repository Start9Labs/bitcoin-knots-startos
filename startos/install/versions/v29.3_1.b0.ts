import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../../fileModels/bitcoin.conf'
import { v29_3_0_b0 } from 'bitcoin-core-startos/startos/install/versions/v29.3_0.b0'
import { v30_2_2_b0 } from 'bitcoin-core-startos/startos/install/versions/v30.2_2.b0'
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

export const v29_3_1_b0 = VersionInfo.of({
  version: '#knots:29.3:1-beta.0',
  releaseNotes: {
    en_US: 'Add new wallet actions',
    es_ES: 'Añadir nuevas acciones de cartera',
    de_DE: 'Neue Wallet-Aktionen hinzufügen',
    pl_PL: 'Dodaj nowe akcje portfela',
    fr_FR: 'Ajout de nouvelles actions pour le portefeuille',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
    other: {
      [v29_3_0_b0.options.version]: {
        // Core → Knots: reset mempool so Knots upstream defaults apply
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core: reset mempool so Core upstream defaults apply
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      [v30_2_2_b0.options.version]: {
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
}).satisfies(v29_3_0_b0.options.version)
