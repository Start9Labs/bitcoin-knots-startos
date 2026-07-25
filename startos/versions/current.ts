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
  version: '#knotsprerdts:29.3:16',
  releaseNotes: {
    en_US: `Resolves the addresses of connected services more reliably.

Bitcoin Knots looked up where to reach its dependencies through a field that only applies to one of the two ways a service can publish a port. It now reads the address itself, so a dependency changing how it serves TLS can no longer leave Bitcoin Knots unable to find it. Nothing changes in normal operation.`,
    es_ES: `Resuelve de forma más fiable las direcciones de los servicios conectados.

Bitcoin Knots localizaba sus dependencias mediante un campo que solo se aplica a una de las dos formas en que un servicio puede publicar un puerto. Ahora lee la dirección en sí, de modo que si una dependencia cambia su forma de servir TLS, Bitcoin Knots seguirá encontrándola. En funcionamiento normal no cambia nada.`,
    de_DE: `Ermittelt die Adressen verbundener Dienste zuverlässiger.

Bitcoin Knots suchte seine Abhängigkeiten über ein Feld, das nur für eine der beiden Arten gilt, auf die ein Dienst einen Port veröffentlichen kann. Jetzt wird die Adresse selbst gelesen, sodass eine Abhängigkeit, die ihre TLS-Bereitstellung ändert, für Bitcoin Knots auffindbar bleibt. Im normalen Betrieb ändert sich nichts.`,
    pl_PL: `Pewniej ustala adresy połączonych usług.

Bitcoin Knots wyszukiwał swoje zależności przez pole, które dotyczy tylko jednego z dwóch sposobów publikowania portu przez usługę. Teraz odczytuje sam adres, więc zależność zmieniająca sposób udostępniania TLS nadal pozostanie odnajdywalna dla Bitcoin Knots. W normalnej pracy nic się nie zmienia.`,
    fr_FR: `Détermine plus fiablement les adresses des services connectés.

Bitcoin Knots localisait ses dépendances via un champ qui ne s'applique qu'à l'un des deux modes de publication d'un port par un service. Il lit désormais l'adresse elle-même : une dépendance qui change sa façon de servir TLS reste donc trouvable par Bitcoin Knots. Rien ne change en fonctionnement normal.`,
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
  .satisfies('29.4:2')
  .satisfies('28.4:15')
