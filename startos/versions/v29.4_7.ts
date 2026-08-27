import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { i2pdConfFile } from '../fileModels/i2pd.conf'
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

export const v_29_4_7 = VersionInfo.of({
  version: '#knots:29.4:7',
  releaseNotes: {
    en_US: `- The service log is no longer buried under the I2P router's routine chatter.
- The I2P router now carries only your node's traffic, and connects more reliably.
- Blockchain Sync reports the step the node is actually on while it starts.
- New Index Sync health check, for the transaction, coinstats and block filter indexes.
- Switching between Core and Knots no longer reports a chain recovery failure that did not happen.
- Turning the I2P SAM Proxy off no longer leaves the node unable to start.
- On a pruned node, blocks fetched from peers for other services now include their witness data, and arrive faster.
- Other under-the-hood fixes and improvements.`,
    es_ES: `- El registro del servicio ya no queda sepultado bajo el parloteo rutinario del router I2P.
- El router I2P ahora solo transporta el tráfico de su nodo y se conecta de forma más fiable.
- Sincronización de blockchain indica el paso en el que está realmente el nodo mientras arranca.
- Nueva comprobación de estado, Sincronización de índices, para los índices de transacciones, coinstats y filtros de bloques.
- Cambiar entre Core y Knots ya no informa de un error de recuperación de la cadena que no ocurrió.
- Desactivar el proxy SAM de I2P ya no impide que el nodo arranque.
- En un nodo podado, los bloques obtenidos de los pares para otros servicios ahora incluyen sus datos de testigo y llegan más rápido.
- Otras correcciones y mejoras internas.`,
    de_DE: `- Das Dienstprotokoll wird nicht mehr vom Routinegeplapper des I2P-Routers begraben.
- Der I2P-Router trägt jetzt nur noch den Verkehr Ihres Knotens und verbindet sich zuverlässiger.
- Die Blockchain-Synchronisierung zeigt den Schritt an, bei dem der Knoten beim Start tatsächlich ist.
- Neue Statusprüfung „Index-Synchronisierung“ für Transaktions-, Coinstats- und Blockfilter-Indizes.
- Der Wechsel zwischen Core und Knots meldet keinen Kettenwiederherstellungsfehler mehr, der nicht aufgetreten ist.
- Das Abschalten des I2P-SAM-Proxys verhindert nicht mehr den Start des Knotens.
- Auf einem beschnittenen Knoten enthalten von Peers für andere Dienste abgerufene Blöcke jetzt ihre Witness-Daten und treffen schneller ein.
- Weitere Korrekturen und Verbesserungen unter der Haube.`,
    pl_PL: `- Dziennik usługi nie jest już zasypywany rutynowymi komunikatami routera I2P.
- Router I2P przenosi teraz wyłącznie ruch Twojego węzła i łączy się bardziej niezawodnie.
- Synchronizacja blockchaina pokazuje etap, na którym węzeł faktycznie się znajduje podczas uruchamiania.
- Nowa kontrola stanu „Synchronizacja indeksów” dla indeksu transakcji, coinstats i filtrów bloków.
- Przełączanie między Core i Knots nie zgłasza już nieudanego odzyskiwania łańcucha, które nie miało miejsca.
- Wyłączenie proxy SAM I2P nie uniemożliwia już uruchomienia węzła.
- W przyciętym węźle bloki pobierane od peerów na potrzeby innych usług zawierają teraz dane świadka i docierają szybciej.
- Inne poprawki i usprawnienia wewnętrzne.`,
    fr_FR: `- Le journal du service n'est plus enseveli sous le bavardage ordinaire du routeur I2P.
- Le routeur I2P ne transporte plus que le trafic de votre nœud et se connecte de façon plus fiable.
- La synchronisation de la blockchain indique l'étape à laquelle le nœud se trouve réellement au démarrage.
- Nouvelle vérification d'état « Synchronisation des index » pour les index de transactions, coinstats et filtres de blocs.
- Basculer entre Core et Knots ne signale plus un échec de récupération de chaîne qui n'a pas eu lieu.
- Désactiver le proxy SAM I2P n'empêche plus le nœud de démarrer.
- Sur un nœud élagué, les blocs récupérés auprès des pairs pour d'autres services incluent désormais leurs données de témoin et arrivent plus vite.
- Autres correctifs et améliorations internes.`,
  },
  migrations: {
    up: async ({ effects }) => {
      // Move the i2pd router off the two old shipped defaults, once: the
      // 'L' bandwidth class, and relaying transit for other I2P users. A
      // hand-set value is indistinguishable from the default it replaced,
      // so both are moved and both are disclosed in the release notes.
      // Rationale: fileModels/i2pd.conf.ts. Guarded twice: the read is
      // null-safe for legacy paths where i2pd.conf does not exist yet, and
      // the whole step is try/caught because neither move is worth
      // aborting an update over — an unreadable or unwritable i2pd.conf
      // just skips it.
      try {
        const conf = await i2pdConfFile.read().once()
        await i2pdConfFile.merge(effects, {
          ...(conf?.bandwidth === 'L' && { bandwidth: 'O' as const }),
          ...(conf?.notransit === false && { notransit: true }),
        })
      } catch (e) {
        console.error('i2pd router defaults not moved:', e)
      }
    },
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
  .satisfies('29.4:12')
  .satisfies('28.4:25')
