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
  version: '#knots:29.4:2',
  releaseNotes: {
    en_US: `Two fixes for how this version behaves on the RDTS chain, both from the same cause: Bitcoin treats itself as still syncing whenever its most recent block is more than 24 hours old, and this chain produces a block only about once every day or two.

Your node was not seeing unconfirmed transactions. While Bitcoin considers itself to be syncing it ignores the transactions its peers offer it, so a node fully caught up with the RDTS chain kept an empty mempool between blocks and incoming payments stayed invisible until the next block arrived. Bitcoin is now told to treat a block up to 14 days old as current, which on this chain it comfortably is, and transactions flow again.

The Blockchain Sync health check could also report "Syncing blocks…" forever on a node that was already fully caught up, sitting just under 100% while it held every block the chain had. It now reports fully synced when no chain the node considers valid sits ahead of the one it is following. A node that is genuinely behind still shows its sync progress as before.

Three things that were waiting on that check work again as a result: the Sync Complete notification, the release of the extra database cache used during initial sync — freeing that memory on nodes where it had been held indefinitely — and the hiding of the Download UTXO Snapshot action once syncing is finished.`,
    es_ES: `Dos correcciones sobre el comportamiento de esta versión en la cadena RDTS, ambas con la misma causa: Bitcoin se considera en sincronización siempre que su bloque más reciente tiene más de 24 horas, y esta cadena produce un bloque solo cada uno o dos días.

Tu nodo no veía las transacciones sin confirmar. Mientras Bitcoin se considera en sincronización, ignora las transacciones que le ofrecen sus pares, así que un nodo completamente al día con la cadena RDTS mantenía la mempool vacía entre bloques y los pagos entrantes quedaban invisibles hasta que llegaba el siguiente bloque. Ahora se le indica a Bitcoin que trate como actual un bloque de hasta 14 días, cosa que en esta cadena se cumple de sobra, y las transacciones vuelven a circular.

La comprobación de estado Sincronización de la cadena también podía indicar «Sincronizando bloques…» indefinidamente en un nodo que ya estaba completamente al día, quedándose justo por debajo del 100 % mientras tenía todos los bloques que existían en la cadena. Ahora indica sincronización completa cuando ninguna cadena que el nodo considere válida está por delante de la que sigue. Un nodo que va realmente atrasado sigue mostrando su progreso como antes.

Como consecuencia vuelven a funcionar tres cosas que dependían de esa comprobación: la notificación de Sincronización completa, la liberación de la caché de base de datos adicional que se usa durante la sincronización inicial —lo que libera esa memoria en los nodos donde se mantenía indefinidamente— y la ocultación de la acción Descargar instantánea UTXO una vez terminada la sincronización.`,
    de_DE: `Zwei Korrekturen zum Verhalten dieser Version auf der RDTS-Kette, beide mit derselben Ursache: Bitcoin betrachtet sich als noch synchronisierend, solange sein jüngster Block älter als 24 Stunden ist, und diese Kette bringt nur etwa alle ein bis zwei Tage einen Block hervor.

Dein Knoten sah keine unbestätigten Transaktionen. Solange Bitcoin sich als synchronisierend betrachtet, ignoriert es die Transaktionen, die seine Gegenstellen ihm anbieten — ein mit der RDTS-Kette vollständig aufgeholter Knoten hielt zwischen den Blöcken also einen leeren Mempool, und eingehende Zahlungen blieben unsichtbar, bis der nächste Block eintraf. Bitcoin wird nun angewiesen, einen bis zu 14 Tage alten Block als aktuell zu behandeln, was auf dieser Kette mit großem Abstand zutrifft, und Transaktionen fließen wieder.

Auch die Zustandsprüfung „Blockchain-Synchronisierung" konnte auf einem bereits vollständig aufgeholten Knoten dauerhaft „Blöcke werden synchronisiert…" melden und blieb knapp unter 100 %, während der Knoten jeden Block hielt, den die Kette hatte. Sie meldet jetzt vollständige Synchronisierung, wenn keine vom Knoten als gültig angesehene Kette vor derjenigen liegt, der er folgt. Ein Knoten, der tatsächlich zurückliegt, zeigt seinen Fortschritt weiterhin wie bisher.

Dadurch funktionieren drei Dinge wieder, die auf diese Prüfung warteten: die Benachrichtigung „Synchronisierung abgeschlossen", die Freigabe des zusätzlichen Datenbank-Caches für die Erstsynchronisierung — was diesen Speicher auf Knoten freigibt, auf denen er unbegrenzt gehalten wurde — und das Ausblenden der Aktion „UTXO-Schnappschuss herunterladen", sobald die Synchronisierung beendet ist.`,
    pl_PL: `Dwie poprawki zachowania tej wersji na łańcuchu RDTS, obie o tej samej przyczynie: Bitcoin uznaje się za wciąż synchronizujący, dopóki jego najnowszy blok ma więcej niż 24 godziny, a ten łańcuch wytwarza blok mniej więcej raz na dobę lub dwie.

Twój węzeł nie widział niepotwierdzonych transakcji. Dopóki Bitcoin uznaje się za synchronizujący, ignoruje transakcje oferowane mu przez węzły partnerskie, więc węzeł w pełni nadążający za łańcuchem RDTS utrzymywał między blokami pustą mempoolę, a przychodzące płatności pozostawały niewidoczne aż do nadejścia kolejnego bloku. Bitcoin dostaje teraz polecenie, by traktować jako bieżący blok sprzed maksymalnie 14 dni, co na tym łańcuchu jest spełnione z dużym zapasem, i transakcje znów napływają.

Kontrola stanu Synchronizacja łańcucha również mogła w nieskończoność pokazywać „Synchronizowanie bloków…" na węźle już w pełni nadążającym, zatrzymując się tuż poniżej 100%, choć węzeł miał każdy blok, który istniał w łańcuchu. Teraz zgłasza pełną synchronizację, gdy żaden łańcuch uznawany przez węzeł za prawidłowy nie wyprzedza tego, za którym węzeł podąża. Węzeł faktycznie zaległy nadal pokazuje swój postęp jak dotychczas.

Dzięki temu znów działają trzy rzeczy, które czekały na tę kontrolę: powiadomienie o zakończeniu synchronizacji, zwolnienie dodatkowej pamięci podręcznej bazy danych używanej podczas synchronizacji początkowej — co uwalnia tę pamięć na węzłach, gdzie była trzymana bez końca — oraz ukrycie akcji Pobierz migawkę UTXO po zakończeniu synchronizacji.`,
    fr_FR: `Deux corrections sur le comportement de cette version sur la chaîne RDTS, toutes deux dues à la même cause : Bitcoin se considère en cours de synchronisation tant que son bloc le plus récent date de plus de 24 heures, et cette chaîne ne produit un bloc que tous les un à deux jours environ.

Votre nœud ne voyait pas les transactions non confirmées. Tant que Bitcoin se considère en cours de synchronisation, il ignore les transactions que lui proposent ses pairs : un nœud parfaitement à jour avec la chaîne RDTS conservait donc un mempool vide entre les blocs, et les paiements entrants restaient invisibles jusqu'à l'arrivée du bloc suivant. Bitcoin reçoit désormais l'instruction de considérer comme actuel un bloc vieux de 14 jours au plus, ce qui est largement le cas sur cette chaîne, et les transactions circulent de nouveau.

La vérification d'état Synchronisation de la chaîne pouvait elle aussi indiquer « Synchronisation des blocs… » indéfiniment sur un nœud pourtant déjà à jour, en restant juste en dessous de 100 % alors qu'il détenait tous les blocs existant sur la chaîne. Elle signale maintenant une synchronisation complète lorsque aucune chaîne considérée comme valide par le nœud ne se trouve devant celle qu'il suit. Un nœud réellement en retard affiche toujours sa progression comme auparavant.

Trois choses qui attendaient cette vérification fonctionnent de nouveau : la notification de fin de synchronisation, la libération du cache de base de données supplémentaire utilisé pendant la synchronisation initiale — ce qui libère cette mémoire sur les nœuds où elle était conservée indéfiniment — et le masquage de l'action Télécharger un instantané UTXO une fois la synchronisation terminée.`,
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
  .satisfies('29.4:6')
  .satisfies('28.4:19')
