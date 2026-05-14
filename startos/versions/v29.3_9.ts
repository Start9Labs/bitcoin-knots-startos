import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

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

export const v29_3_9 = VersionInfo.of({
  version: '#knotsprerdts:29.3:9',
  releaseNotes: {
    en_US:
      'Initial release of the Bitcoin Knots (pre-RDTS) flavor, for users who want to stay on pre-RDTS Knots consensus rules. Same Bitcoin Knots binary as the `#knots` flavor without the "Activate RDTS" critical-task gate.',
    es_ES:
      'Lanzamiento inicial de la variante Bitcoin Knots (pre-RDTS), para usuarios que quieren mantenerse en las reglas de consenso de Knots pre-RDTS. El mismo binario de Bitcoin Knots que la variante `#knots`, sin la tarea crítica "Activar RDTS".',
    de_DE:
      'Erstveröffentlichung der Variante Bitcoin Knots (pre-RDTS) für Benutzer, die bei den Pre-RDTS-Konsensregeln von Knots bleiben möchten. Gleiches Bitcoin-Knots-Binary wie die Variante `#knots`, ohne die kritische Aufgabe „RDTS aktivieren".',
    pl_PL:
      'Pierwsze wydanie wariantu Bitcoin Knots (pre-RDTS), dla użytkowników, którzy chcą pozostać przy zasadach konsensusu Knots sprzed RDTS. To samo oprogramowanie Bitcoin Knots co wariant `#knots`, bez krytycznego zadania „Aktywuj RDTS".',
    fr_FR:
      'Première version de la variante Bitcoin Knots (pre-RDTS), pour les utilisateurs qui souhaitent rester sur les règles de consensus de Knots pré-RDTS. Même binaire Bitcoin Knots que la variante `#knots`, sans la tâche critique « Activer RDTS ».',
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
      // #knots ↔ #knotsprerdts. Both use the same upstream Knots binary;
      // switching to this flavor is an explicit opt-out of RDTS, so
      // clear any `consensusrules=rdts` acceptance carried over from
      // `#knots` — otherwise nothing else in this build would remove
      // it, and a later switch back to `#knots` would silently skip
      // the critical-task gate. `down` is a no-op: `#knots`'s init
      // hook re-prompts for acceptance when the key is absent.
      ['^#knots:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            raw: { consensusrules: undefined },
          })
        },
        down: async ({ effects }) => {},
      },
      // `#knotsrdts` (the retired "Bitcoin Knots plus BIP-110" build)
      // is being de-listed. Users on it can move here; same data layout,
      // and same RDTS-opt-out cleanup as the `#knots` path above. No
      // `down` — `#knotsrdts` can't be selected as a destination.
      ['^#knotsrdts:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            raw: { consensusrules: undefined },
          })
        },
      },
    },
  },
}).satisfies('29.3:11')
