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
 * Chain-split recovery flag (see startos/forkRecovery.ts), set on every
 * sidegrade out of this enforcing flavor and consumed by the destination
 * flavor's chain-recovery oneshot at next start (a clean no-op when there is
 * nothing to fix). The shared datadir carries this flavor's persisted
 * per-block verdicts across the switch, so RDTS-driven invalid verdicts must
 * be reconsidered or they pin Core / pre-RDTS Knots to a stale chain across a
 * split. The destination's own rdtsEnforcedLastRun marker detects the same
 * transition independently; setting the flag here makes the switch case
 * deterministic even if a prior run never recorded a marker.
 *
 * The inverse direction needs nothing: the Knots release this flavor pins
 * re-validates the RDTS-applicable range itself when it starts on a datadir
 * that advanced without enforcement.
 */
const leavingRdtsFlavor = { reconsiderInvalidTips: true }

/**
 * `consensusrules=rdts` acknowledges the upgrade to the binary and nothing
 * else: the RUNTIME_WARN build enforces RDTS with or without it, and only
 * warns when it is missing. The package sets it on arrival and clears it on
 * departure — no other flavor understands the key — but never enforces it, so
 * a user who would rather see the warning can delete it and it stays deleted.
 */
const setConsensusRules = { raw: { consensusrules: 'rdts' as const } }

/**
 * `maxtipage` has no arrival half — the file model pins it — but the flavors
 * we hand off to parse unknown keys through rather than dropping them, so it
 * must be removed here: left behind, a node on their chain would call itself
 * synced up to two weeks late.
 */
const clearFlavorKeys = {
  raw: { consensusrules: undefined, maxtipage: undefined },
}

export const current = VersionInfo.of({
  version: '#knots:29.4:3',
  releaseNotes: {
    en_US: `Stops the embedded I2P router logging an error every thirty seconds.

The health check that reports I2P status logged in before each query and handed the token it received back with that query. i2pd reads the token as a request it does not recognise and records an error for it — twice a minute, for as long as I2P is switched on. Nothing was actually wrong: I2P connectivity was unaffected and the check itself always reported correctly. The check now asks the router directly without logging in, which i2pd accepts because it never verifies the token it issues.`,
    es_ES: `Evita que el router I2P integrado registre un error cada treinta segundos.

La comprobación de estado que informa del estado de I2P iniciaba sesión antes de cada consulta y devolvía junto a ella el token recibido. i2pd interpreta ese token como una petición que no reconoce y registra un error por él: dos veces por minuto, mientras I2P esté activado. En realidad no pasaba nada: la conectividad I2P no se veía afectada y la propia comprobación siempre informaba correctamente. Ahora la comprobación consulta al router directamente, sin iniciar sesión, algo que i2pd acepta porque nunca verifica el token que emite.`,
    de_DE: `Verhindert, dass der eingebettete I2P-Router alle dreißig Sekunden einen Fehler protokolliert.

Die Zustandsprüfung, die den I2P-Status meldet, meldete sich vor jeder Abfrage an und reichte das erhaltene Token mit der Abfrage zurück. i2pd liest dieses Token als Anfrage, die es nicht kennt, und protokolliert dafür einen Fehler — zweimal pro Minute, solange I2P eingeschaltet ist. Tatsächlich war nichts kaputt: Die I2P-Verbindung war nicht betroffen, und die Prüfung selbst meldete stets korrekt. Die Prüfung fragt den Router jetzt direkt ab, ohne sich anzumelden; i2pd akzeptiert das, weil es das ausgegebene Token ohnehin nie überprüft.`,
    pl_PL: `Sprawia, że wbudowany router I2P przestaje zapisywać błąd co trzydzieści sekund.

Kontrola stanu raportująca status I2P logowała się przed każdym zapytaniem i odsyłała otrzymany token razem z tym zapytaniem. i2pd odczytuje ten token jako żądanie, którego nie rozpoznaje, i zapisuje z jego powodu błąd — dwa razy na minutę, dopóki I2P jest włączone. W rzeczywistości nic nie było nie tak: łączność I2P pozostawała nienaruszona, a sama kontrola zawsze raportowała poprawnie. Kontrola odpytuje teraz router bezpośrednio, bez logowania, co i2pd akceptuje, ponieważ i tak nigdy nie weryfikuje wydawanego tokenu.`,
    fr_FR: `Empêche le routeur I2P intégré de consigner une erreur toutes les trente secondes.

La vérification d'état qui rapporte le statut d'I2P s'authentifiait avant chaque requête et renvoyait avec celle-ci le jeton obtenu. i2pd lit ce jeton comme une requête qu'il ne reconnaît pas et consigne une erreur à son sujet — deux fois par minute, tant qu'I2P est activé. En réalité rien n'était en panne : la connectivité I2P n'était pas affectée et la vérification elle-même rapportait toujours correctement. La vérification interroge désormais le routeur directement, sans s'authentifier, ce que i2pd accepte puisqu'il ne vérifie jamais le jeton qu'il délivre.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    // Keyed by Core major series as caret ranges — one entry per Core
    // major, not per Core `:N`. Range-keyed `migrations.other` requires
    // StartOS ≥ 0.4.0-beta.9 (Start9Labs/start-os#3214).
    //
    // Sidegrade edges belong on whichever version is current: without them
    // this version has no path off the flavor at all.
    //
    // Intentional asymmetry: there is no `^#knotsprerdts` key for the
    // pre-RDTS Knots sibling (B). The B↔C migration belt lives on B's own
    // `^#knots` entry (its `up` edge, C→B, sets reconsiderInvalidTips),
    // which fires because this flavor satisfies B's `canMigrateTo`; the
    // runtime rdtsEnforcedLastRun marker double-covers it. Not a gap — no
    // mirror key.
    other: {
      ['^28']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...setConsensusRules,
          })
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...clearFlavorKeys,
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      ['^29']: {
        // Core → Knots
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...setConsensusRules,
          })
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...clearFlavorKeys,
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      ['^30']: {
        // Core → Knots: drop coinstatsindex written by Core 30+ at the new
        // path; Knots 29 only reads the old indexes/coinstats/ path, which
        // Core 30 deliberately preserved for downgrade.
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...setConsensusRules,
          })
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...clearFlavorKeys,
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      ['^31']: {
        // Core → Knots: drop fee_estimates.dat (v31 bumped
        // CURRENT_FEES_FILE_VERSION 149900 → 309900; ≤30 hard-fails) and
        // coinstatsindex (same reason as 30.x).
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...setConsensusRules,
          })
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
          await bitcoinConfFile.merge(effects, {
            ...mempoolReset,
            ...clearFlavorKeys,
          })
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      // `#knotsrdts` (the "Bitcoin Knots plus BIP-110" build) is being
      // retired. Users on it can move here; nothing carries over. The
      // acceptance that build recorded predates the split, so arrival
      // re-prompts under the current terms — as it does from every other
      // flavor. No `down` — `#knotsrdts` is being de-listed, so the inverse
      // path can't be selected by a user.
      ['^#knotsrdts:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, setConsensusRules)
        },
      },
    },
  },
})
  .satisfies('29.4:8')
  .satisfies('28.4:21')
