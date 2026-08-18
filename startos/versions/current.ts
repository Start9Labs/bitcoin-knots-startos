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
  version: '#knotsprerdts:29.3:22',
  releaseNotes: {
    en_US: `Fixes to the connection limit, the sync check, and config parsing.

- Maximum Connections now has a minimum of 40. Bitcoin reserves 11 connection slots for the peers it dials out to, and what is left over is shared between peers on the internet and services on your own server that fetch blocks, such as Electrs. Setting the limit to 11 or fewer left nothing for either, and those services would fail to start, retry, and fail again, with nothing in their own logs pointing back at this setting. A little above 11 was no better: Bitcoin will not drop an internet peer to make room until it is already holding a good number of them, so a tight limit left your own services shut out. The field now stops at 40, and its description says what the setting really controls and points at Max Upload Target and Blocks Only, which are the settings that actually reduce bandwidth. A node already set below 40 is raised to it the next time the package writes the file, which every install, update and restore does.
- Blockchain Sync no longer sits at a syncing percentage on a node that has already caught up. Bitcoin holds its initial-block-download flag for a while after the last block lands; the check now also asks whether any better chain is actually waiting above the blocks your node has validated, and reports finished when none is.
- A non-numeric value hand-edited into one of the numeric settings in bitcoin.conf is now ignored in favour of that setting default. It used to be written back into the file as NaN, which Bitcoin reads as 0 — for Maximum Connections, a node that neither makes nor accepts any peer connection at all.`,
    es_ES: `Correcciones en el límite de conexiones, la comprobación de sincronización y la lectura de la configuración.

- Conexiones máximas ahora tiene un mínimo de 40. Bitcoin reserva 11 ranuras de conexión para los pares a los que llama él mismo, y lo que sobra se reparte entre los pares de internet y los servicios de tu propio servidor que obtienen bloques, como Electrs. Fijar el límite en 11 o menos no dejaba nada para ninguno de los dos, y esos servicios no arrancaban, lo reintentaban y volvían a fallar, sin nada en sus propios registros que señalara este ajuste. Un poco por encima de 11 no era mejor: Bitcoin no descarta un par de internet para hacer sitio hasta que ya tiene una buena cantidad de ellos, así que un límite ajustado dejaba fuera a tus propios servicios. El campo ahora no baja de 40, y su descripción dice lo que el ajuste controla en realidad y remite a Objetivo máximo de subida y Solo bloques, que son los ajustes que de verdad reducen el ancho de banda. Un nodo ya fijado por debajo de 40 se sube a ese valor la próxima vez que el paquete escriba el archivo, cosa que hace en cada instalación, actualización y restauración.
- Sincronización de blockchain ya no se queda en un porcentaje de sincronización en un nodo que ya está al día. Bitcoin mantiene su indicador de descarga inicial un tiempo después de que llegue el último bloque; la comprobación ahora también pregunta si hay alguna cadena mejor esperando por encima de los bloques que tu nodo ha validado, e informa de que ha terminado cuando no la hay.
- Un valor no numérico editado a mano en uno de los ajustes numéricos de bitcoin.conf ahora se ignora en favor del valor por defecto de ese ajuste. Antes se volvía a escribir en el archivo como NaN, que Bitcoin interpreta como 0: en el caso de Conexiones máximas, un nodo que ni establece ni acepta ninguna conexión con pares.`,
    de_DE: `Korrekturen am Verbindungslimit, an der Synchronisationsprüfung und am Einlesen der Konfiguration.

- Maximale Verbindungen hat jetzt einen Mindestwert von 40. Bitcoin reserviert 11 Verbindungsplätze für die Peers, die es selbst anwählt; was übrig bleibt, teilen sich Peers aus dem Internet und Dienste auf Ihrem eigenen Server, die Blöcke abrufen, etwa Electrs. Ein Wert von 11 oder weniger ließ für beide nichts übrig, und solche Dienste starteten nicht, versuchten es erneut und scheiterten wieder, ohne dass ihre eigenen Protokolle auf diese Einstellung hinwiesen. Etwas über 11 war nicht besser: Bitcoin trennt keinen Internet-Peer, um Platz zu schaffen, solange es nicht ohnehin schon eine ganze Reihe davon hält — ein knappes Limit sperrte die eigenen Dienste also aus. Das Feld beginnt jetzt bei 40, und seine Beschreibung sagt, was die Einstellung wirklich steuert, und verweist auf Maximales Upload-Ziel und Nur Blöcke, die Einstellungen, die tatsächlich Bandbreite sparen. Ein Knoten, der bereits unter 40 steht, wird beim nächsten Schreiben der Datei durch das Paket angehoben — bei jeder Installation, jedem Update und jeder Wiederherstellung.
- Blockchain-Synchronisation bleibt nicht mehr bei einem Fortschrittswert stehen, obwohl der Knoten längst aufgeholt hat. Bitcoin behält sein Kennzeichen für den Erstabgleich noch eine Weile, nachdem der letzte Block eingetroffen ist; die Prüfung fragt jetzt zusätzlich, ob oberhalb der von Ihrem Knoten validierten Blöcke überhaupt eine bessere Kette wartet, und meldet fertig, wenn nicht.
- Ein von Hand in eine der numerischen Einstellungen der bitcoin.conf eingetragener nicht-numerischer Wert wird jetzt zugunsten des Standardwerts dieser Einstellung ignoriert. Zuvor wurde er als NaN in die Datei zurückgeschrieben, was Bitcoin als 0 liest — bei Maximale Verbindungen ein Knoten, der überhaupt keine Peer-Verbindung aufbaut oder annimmt.`,
    pl_PL: `Poprawki limitu połączeń, kontroli synchronizacji i wczytywania konfiguracji.

- Maksymalna liczba połączeń ma teraz minimum 40. Bitcoin rezerwuje 11 miejsc na połączenia z peerami, do których dzwoni sam, a to, co zostaje, dzielą między siebie peerzy z internetu i usługi na Twoim własnym serwerze, które pobierają bloki, takie jak Electrs. Ustawienie 11 lub mniej nie zostawiało nic dla żadnej ze stron, a takie usługi nie startowały, ponawiały próbę i znów zawodziły, przy czym w ich własnych logach nic nie wskazywało na to ustawienie. Niewiele powyżej 11 nie było lepsze: Bitcoin nie rozłączy peera z internetu, by zrobić miejsce, dopóki nie trzyma ich już sporo, więc ciasny limit zamykał drogę Twoim własnym usługom. Pole zaczyna się teraz od 40, a jego opis mówi, czym to ustawienie naprawdę steruje, i kieruje do ustawień Maksymalny limit wysyłania oraz Tylko bloki, które faktycznie zmniejszają zużycie łącza. Węzeł ustawiony już poniżej 40 zostaje podniesiony do tej wartości przy najbliższym zapisie pliku przez pakiet, co dzieje się przy każdej instalacji, aktualizacji i przywracaniu.
- Synchronizacja blockchainu nie zatrzymuje się już na wartości procentowej, gdy węzeł jest w rzeczywistości na bieżąco. Bitcoin trzyma znacznik pobierania początkowego jeszcze jakiś czas po nadejściu ostatniego bloku; kontrola pyta teraz dodatkowo, czy ponad blokami zweryfikowanymi przez Twój węzeł czeka w ogóle lepszy łańcuch, i zgłasza zakończenie, gdy go nie ma.
- Nieliczbowa wartość wpisana ręcznie w jedno z liczbowych ustawień bitcoin.conf jest teraz pomijana na rzecz wartości domyślnej tego ustawienia. Wcześniej wracała do pliku jako NaN, co Bitcoin odczytuje jako 0 — w przypadku Maksymalnej liczby połączeń oznaczało to węzeł, który ani nie nawiązuje, ani nie przyjmuje żadnych połączeń z peerami.`,
    fr_FR: `Corrections de la limite de connexions, de la vérification de synchronisation et de la lecture de la configuration.

- Connexions maximales a désormais un minimum de 40. Bitcoin réserve 11 emplacements de connexion pour les pairs qu'il appelle lui-même, et ce qui reste est partagé entre les pairs d'internet et les services de votre propre serveur qui récupèrent les blocs, comme Electrs. Une valeur de 11 ou moins ne laissait rien ni aux uns ni aux autres, et ces services ne démarraient pas, réessayaient et échouaient de nouveau, sans que leurs propres journaux ne renvoient à ce réglage. Un peu au-dessus de 11 n'était pas mieux : Bitcoin ne coupe pas un pair d'internet pour faire de la place tant qu'il n'en tient pas déjà un bon nombre, de sorte qu'une limite serrée laissait vos propres services dehors. Le champ commence maintenant à 40, et sa description dit ce que le réglage contrôle réellement et renvoie à Objectif maximal d'envoi et Blocs uniquement, les réglages qui réduisent réellement la bande passante. Un nœud déjà réglé en dessous de 40 est remonté à cette valeur à la prochaine écriture du fichier par le paquet, ce que font chaque installation, mise à jour et restauration.
- Synchronisation de la blockchain ne reste plus bloquée sur un pourcentage alors que le nœud a déjà rattrapé son retard. Bitcoin conserve son indicateur de téléchargement initial un moment après l'arrivée du dernier bloc ; la vérification demande maintenant aussi si une meilleure chaîne attend réellement au-dessus des blocs validés par votre nœud, et signale la fin quand ce n'est pas le cas.
- Une valeur non numérique saisie à la main dans l'un des réglages numériques de bitcoin.conf est désormais ignorée au profit de la valeur par défaut de ce réglage. Elle était auparavant réécrite dans le fichier sous la forme NaN, que Bitcoin lit comme 0 — pour Connexions maximales, un nœud qui n'établit ni n'accepte aucune connexion avec des pairs.`,
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
      // an explicit opt-out of RDTS, so queue the invalid-verdict
      // reconsideration. Any `consensusrules=rdts` carried over is
      // stripped by the file model on the first write, so there is
      // nothing to clear here. No `down`: the sibling's own binary
      // re-validates the RDTS-applicable range on its first start.
      ['^#knots:29.3']: {
        up: async ({ effects }) => {
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
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
    },
  },
})
  .satisfies('29.4:10')
  .satisfies('28.4:23')
