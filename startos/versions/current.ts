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
 * Chain-split recovery flag (see startos/forkRecovery.ts), set on the `up`
 * sidegrade from the RDTS-enforcing `#knots` sibling and consumed by this
 * flavor's chain-recovery oneshot at next start (a clean no-op when there is
 * nothing to fix). The shared datadir carries the sibling's persisted
 * per-block verdicts across the switch, so its RDTS-driven invalid verdicts
 * must be reconsidered or they pin this node to a stale chain across a
 * split. The runtime rdtsEnforcedLastRun marker detects the same transition
 * independently; setting the flag here makes the switch case deterministic
 * even if a prior run never recorded a marker.
 *
 * The `down` edge toward the sibling needs nothing: the Knots release it
 * pins re-validates the RDTS-applicable range itself when it starts on a
 * datadir that advanced without enforcement.
 */
const leavingRdtsFlavor = { reconsiderInvalidTips: true }

export const current = VersionInfo.of({
  version: '#knotsprerdts:29.3:21',
  releaseNotes: {
    en_US: `Small cleanups around the embedded I2P router.

- The I2P health check treated an unusable reply from the router as healthy; it now reports "starting" until the router gives a real answer.
- i2pd no longer warns on every start about an optional tunnels file that was never shipped.`,
    es_ES: `Pequeñas limpiezas en torno al router I2P integrado.

- La comprobación de estado de I2P trataba una respuesta inutilizable del router como si todo fuera bien; ahora informa «iniciando» hasta que el router da una respuesta real.
- i2pd ya no avisa en cada arranque sobre un archivo de túneles opcional que nunca se incluyó.`,
    de_DE: `Kleine Aufräumarbeiten rund um den eingebetteten I2P-Router.

- Die I2P-Zustandsprüfung wertete eine unbrauchbare Antwort des Routers als gesund; sie meldet jetzt "startet", bis der Router eine echte Antwort gibt.
- i2pd warnt beim Start nicht mehr über eine optionale Tunnel-Datei, die nie mitgeliefert wurde.`,
    pl_PL: `Drobne porządki wokół wbudowanego routera I2P.

- Kontrola stanu I2P traktowała bezużyteczną odpowiedź routera jako zdrową; teraz zgłasza "uruchamianie", dopóki router nie udzieli prawdziwej odpowiedzi.
- i2pd nie ostrzega już przy każdym starcie o opcjonalnym pliku tuneli, którego nigdy nie dołączano.`,
    fr_FR: `Petits nettoyages autour du routeur I2P intégré.

- La vérification d'état d'I2P considérait une réponse inutilisable du routeur comme saine ; elle signale désormais « démarrage » tant que le routeur ne donne pas de vraie réponse.
- i2pd n'avertit plus à chaque démarrage au sujet d'un fichier de tunnels optionnel qui n'a jamais été fourni.`,
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
      // reconsideration. No `down`: `consensusrules` is already absent
      // here (`#knots`'s init hook re-prompts on arrival when the key is
      // missing), and the sibling's own binary re-validates the
      // RDTS-applicable range on its first start.
      ['^#knots:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            raw: { consensusrules: undefined },
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
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
  .satisfies('29.4:8')
  .satisfies('28.4:21')
