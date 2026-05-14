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

export const v29_3_8 = VersionInfo.of({
  version: '#knots:29.3:8',
  releaseNotes: {
    en_US: `**Bumps**

- Bitcoin Knots → 29.3.knots20260508
- start-sdk → 1.5.0

**Features**

- Adds an "Activate RDTS" action that acknowledges the BIP-110 (Reduced Data Temporary Softfork) consensus rules this version will eventually enforce. A critical task appears on install or upgrade until you acknowledge. Users not ready to adopt RDTS can switch to the "Bitcoin Knots (pre-RDTS)" flavor in the marketplace.`,
    es_ES: `**Actualizaciones**

- Bitcoin Knots → 29.3.knots20260508
- start-sdk → 1.5.0

**Funciones**

- Añade una acción "Activar RDTS" que confirma las reglas de consenso BIP-110 (Reduced Data Temporary Softfork) que esta versión aplicará eventualmente. Aparece una tarea crítica en la instalación o actualización hasta que la confirme. Los usuarios que no estén listos para adoptar RDTS pueden cambiar a la variante "Bitcoin Knots (pre-RDTS)" en el marketplace.`,
    de_DE: `**Aktualisierungen**

- Bitcoin Knots → 29.3.knots20260508
- start-sdk → 1.5.0

**Funktionen**

- Fügt eine Aktion "RDTS aktivieren" hinzu, mit der Sie die BIP-110 (Reduced Data Temporary Softfork) Konsensregeln bestätigen, die diese Version schließlich durchsetzen wird. Bei der Installation oder dem Upgrade erscheint eine kritische Aufgabe, bis Sie bestätigen. Benutzer, die noch nicht bereit sind, RDTS zu übernehmen, können zur Variante "Bitcoin Knots (pre-RDTS)" im Marktplatz wechseln.`,
    pl_PL: `**Aktualizacje**

- Bitcoin Knots → 29.3.knots20260508
- start-sdk → 1.5.0

**Funkcje**

- Dodaje akcję "Aktywuj RDTS", która potwierdza zasady konsensusu BIP-110 (Reduced Data Temporary Softfork), które ta wersja ostatecznie wymusi. Krytyczne zadanie pojawia się przy instalacji lub aktualizacji, dopóki nie potwierdzisz. Użytkownicy, którzy nie są gotowi do przyjęcia RDTS, mogą przełączyć się na wariant "Bitcoin Knots (pre-RDTS)" w marketplace.`,
    fr_FR: `**Mises à jour**

- Bitcoin Knots → 29.3.knots20260508
- start-sdk → 1.5.0

**Fonctionnalités**

- Ajoute une action « Activer RDTS » qui confirme les règles de consensus BIP-110 (Reduced Data Temporary Softfork) que cette version finira par appliquer. Une tâche critique apparaît à l'installation ou à la mise à niveau jusqu'à confirmation. Les utilisateurs qui ne sont pas prêts à adopter RDTS peuvent basculer vers la variante « Bitcoin Knots (pre-RDTS) » sur le marketplace.`,
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
    },
  },
}).satisfies('29.3:11')
