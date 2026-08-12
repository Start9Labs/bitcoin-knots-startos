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

export const current = VersionInfo.of({
  version: '#knots:29.4:1',
  releaseNotes: {
    en_US: `Update to Bitcoin Knots v29.4.knots20260508

The RDTS opt-in now describes what actually happened. BIP-110 did not carry the network: in August 2026, at block 961,632, the nodes enforcing it split onto a chain of their own, and this version follows that chain. The confirmation asked of you on install — and again now, because what there is to agree to has changed — says so plainly: switching here from Bitcoin Core or Bitcoin Knots (pre-RDTS) moves your node to a different blockchain and network; that chain produces a block only about once every day or two, so deposits will not confirm and dependent services such as Lightning will stall; a hard fork to a new proof-of-work algorithm is planned for 1 September 2026 to restore normal block production; and the two chains share no replay protection, so a transaction broadcast on one can be replayed on the other.

Your acknowledgement is now kept in the package's own state instead of as consensusrules=rdts in bitcoin.conf, and that line is removed from existing configurations. It never controlled anything — this build enforces RDTS either way — and it no longer records anything meaningful.

Separately, three hardening changes from a community security audit.

The check that verifies the signatures on an upstream release now counts distinct signers rather than signatures. Because it counted signatures, one release key signing several times could satisfy a quorum meant to require several independent people — so the tolerance the check advertised was not the tolerance it enforced. Nothing about the releases this package builds changes: each is signed by more than enough separate people to pass either way.

When another service asks to adjust this node's configuration, it can now reach only the handful of settings such a service has any business setting, instead of the entire configuration file. Previously such a request could also carry settings that never appeared on the screen where you approve it.

And an RPC password handed over by another service must now be at least twenty characters. That field is filled in by the service requesting access and you cannot edit it, so nothing was stopping a careless one from choosing something guessable.`,
    es_ES: `Actualización a Bitcoin Knots v29.4.knots20260508

La adhesión a RDTS ahora describe lo que realmente ocurrió. BIP-110 no arrastró consigo a la red: en agosto de 2026, en el bloque 961.632, los nodos que lo aplicaban se separaron en una cadena propia, y esta versión sigue esa cadena. La confirmación que se te pide al instalar —y de nuevo ahora, porque ha cambiado aquello con lo que estás de acuerdo— lo dice sin rodeos: cambiar aquí desde Bitcoin Core o Bitcoin Knots (pre-RDTS) traslada tu nodo a otra cadena de bloques y a otra red; esa cadena produce un bloque solo cada uno o dos días, así que los depósitos no se confirmarán y los servicios dependientes, como Lightning, se quedarán bloqueados; está previsto un hard fork a un nuevo algoritmo de prueba de trabajo el 1 de septiembre de 2026 para restablecer la producción normal de bloques; y las dos cadenas no tienen protección contra repetición, por lo que una transacción difundida en una puede repetirse en la otra.

Tu confirmación se guarda ahora en el estado propio del paquete en lugar de como consensusrules=rdts en bitcoin.conf, y esa línea se elimina de las configuraciones existentes. Nunca controló nada —esta compilación aplica RDTS igualmente— y ya no registra nada significativo.

Aparte de lo anterior, tres mejoras de robustez surgidas de una auditoría de seguridad de la comunidad.

La comprobación que verifica las firmas de una versión oficial ahora cuenta firmantes distintos en lugar de firmas. Como contaba firmas, una sola clave de publicación que firmara varias veces podía satisfacer un quórum pensado para exigir varias personas independientes, de modo que la tolerancia que anunciaba la comprobación no era la que realmente aplicaba. Nada cambia en las versiones que compila este paquete: cada una está firmada por bastantes más personas distintas de las necesarias para pasarla en cualquiera de los dos casos.

Cuando otro servicio solicita ajustar la configuración de este nodo, ahora solo puede llegar al puñado de ajustes que a tal servicio le corresponde tocar, en vez de a todo el archivo de configuración. Antes, esa solicitud también podía llevar ajustes que nunca aparecían en la pantalla donde usted la aprueba.

Además, una contraseña RPC facilitada por otro servicio debe tener ahora al menos veinte caracteres. Ese campo lo rellena el servicio que solicita el acceso y usted no puede editarlo, así que nada impedía que uno descuidado eligiera algo fácil de adivinar.`,
    de_DE: `Aktualisierung auf Bitcoin Knots v29.4.knots20260508

Der RDTS-Beitritt beschreibt jetzt, was tatsächlich geschehen ist. BIP-110 hat das Netzwerk nicht mitgenommen: Im August 2026 spalteten sich die Knoten, die ihn durchsetzen, bei Block 961.632 auf eine eigene Kette ab, und diese Version folgt dieser Kette. Die Bestätigung, um die du bei der Installation gebeten wirst — und jetzt erneut, weil sich geändert hat, wozu du zustimmst —, sagt es klar: Ein Wechsel hierher von Bitcoin Core oder Bitcoin Knots (pre-RDTS) setzt deinen Knoten auf eine andere Blockchain und in ein anderes Netzwerk; diese Kette bringt nur etwa alle ein bis zwei Tage einen Block hervor, sodass Einzahlungen nicht bestätigt werden und abhängige Dienste wie Lightning stehen bleiben; für den 1. September 2026 ist ein Hard Fork auf einen neuen Proof-of-Work-Algorithmus geplant, der die normale Blockproduktion wiederherstellen soll; und die beiden Ketten haben keinen Replay-Schutz, sodass eine auf der einen gesendete Transaktion auf der anderen wiederholt werden kann.

Deine Bestätigung wird jetzt im eigenen Zustand des Pakets gehalten statt als consensusrules=rdts in der bitcoin.conf, und diese Zeile wird aus bestehenden Konfigurationen entfernt. Sie hat nie etwas gesteuert — dieser Build setzt RDTS ohnehin durch — und hält nun auch nichts Aussagekräftiges mehr fest.

Davon unabhängig: drei Härtungsänderungen aus einem Sicherheitsaudit der Community.

Die Prüfung der Signaturen einer Upstream-Veröffentlichung zählt jetzt unterschiedliche Signierende statt Signaturen. Da sie Signaturen zählte, konnte ein einzelner Veröffentlichungsschlüssel durch mehrfaches Signieren ein Quorum erfüllen, das mehrere unabhängige Personen verlangen sollte — die Toleranz, die die Prüfung angab, war also nicht die, die sie durchsetzte. An den Veröffentlichungen, die dieses Paket baut, ändert sich nichts: Jede ist von mehr als genug verschiedenen Personen signiert, um so oder so zu bestehen.

Wenn ein anderer Dienst darum bittet, die Konfiguration dieses Knotens anzupassen, erreicht er jetzt nur noch die wenigen Einstellungen, die einen solchen Dienst überhaupt etwas angehen, statt der gesamten Konfigurationsdatei. Zuvor konnte eine solche Anfrage auch Einstellungen enthalten, die auf dem Bildschirm, auf dem Sie sie bestätigen, nie auftauchten.

Und ein von einem anderen Dienst übergebenes RPC-Passwort muss nun mindestens zwanzig Zeichen lang sein. Dieses Feld füllt der anfragende Dienst aus und Sie können es nicht ändern — nichts hielt also einen nachlässigen Dienst davon ab, etwas leicht Erratbares zu wählen.`,
    pl_PL: `Aktualizacja do Bitcoin Knots v29.4.knots20260508

Przystąpienie do RDTS opisuje teraz to, co faktycznie się wydarzyło. BIP-110 nie pociągnął za sobą sieci: w sierpniu 2026 roku, na bloku 961 632, węzły go egzekwujące odłączyły się na własny łańcuch, a ta wersja podąża właśnie za nim. Potwierdzenie, o które prosimy przy instalacji — i ponownie teraz, bo zmieniło się to, na co się zgadzasz — mówi wprost: przejście tutaj z Bitcoin Core albo Bitcoin Knots (pre-RDTS) przenosi twój węzeł na inny łańcuch bloków i do innej sieci; ten łańcuch wytwarza blok mniej więcej raz na dobę lub dwie, więc wpłaty nie będą się potwierdzać, a usługi zależne, takie jak Lightning, staną; na 1 września 2026 roku planowany jest hard fork na nowy algorytm proof-of-work, który ma przywrócić normalną produkcję bloków; oba łańcuchy nie mają zaś ochrony przed powtórzeniem, więc transakcja rozgłoszona na jednym może zostać powtórzona na drugim.

Twoje potwierdzenie jest teraz przechowywane we własnym stanie pakietu, a nie jako consensusrules=rdts w bitcoin.conf, a ta linia jest usuwana z istniejących konfiguracji. Nigdy niczym nie sterowała — ta kompilacja egzekwuje RDTS tak czy inaczej — i nie zapisuje już niczego istotnego.

Niezależnie od powyższego: trzy zmiany wzmacniające, wynikające ze społecznościowego audytu bezpieczeństwa.

Kontrola weryfikująca podpisy wydania upstream liczy teraz odrębnych sygnatariuszy, a nie podpisy. Ponieważ liczyła podpisy, jeden klucz wydania podpisujący kilkakrotnie mógł spełnić kworum pomyślane tak, by wymagać kilku niezależnych osób — deklarowana odporność kontroli nie była więc tą, którą faktycznie egzekwowała. W wydaniach budowanych przez ten pakiet nic się nie zmienia: każde jest podpisane przez znacznie więcej odrębnych osób, niż potrzeba do jej przejścia w obu wariantach.

Gdy inna usługa prosi o zmianę konfiguracji tego węzła, może teraz sięgnąć wyłącznie po tę garstkę ustawień, które takiej usługi w ogóle dotyczą, zamiast po cały plik konfiguracyjny. Wcześniej takie żądanie mogło nieść również ustawienia, które nigdy nie pojawiały się na ekranie zatwierdzania.

Hasło RPC przekazane przez inną usługę musi mieć teraz co najmniej dwadzieścia znaków. To pole wypełnia usługa prosząca o dostęp i nie można go edytować, więc nic nie powstrzymywało nieostrożnej usługi przed wybraniem czegoś łatwego do odgadnięcia.`,
    fr_FR: `Mise à jour vers Bitcoin Knots v29.4.knots20260508

L'adhésion à RDTS décrit désormais ce qui s'est réellement passé. BIP-110 n'a pas entraîné le réseau : en août 2026, au bloc 961 632, les nœuds qui l'appliquaient se sont séparés sur une chaîne à eux, et cette version suit cette chaîne. La confirmation qui vous est demandée à l'installation — et de nouveau maintenant, car ce à quoi vous consentez a changé — le dit clairement : basculer ici depuis Bitcoin Core ou Bitcoin Knots (pre-RDTS) déplace votre nœud sur une autre chaîne de blocs et sur un autre réseau ; cette chaîne ne produit un bloc que tous les un à deux jours environ, de sorte que les dépôts ne seront pas confirmés et que les services qui en dépendent, comme Lightning, resteront bloqués ; un hard fork vers un nouvel algorithme de preuve de travail est prévu le 1er septembre 2026 pour rétablir une production normale de blocs ; et les deux chaînes n'ont aucune protection contre le rejeu, si bien qu'une transaction diffusée sur l'une peut être rejouée sur l'autre.

Votre confirmation est maintenant conservée dans l'état propre du paquet plutôt que sous la forme consensusrules=rdts dans bitcoin.conf, et cette ligne est retirée des configurations existantes. Elle ne commandait rien — cette version applique RDTS de toute façon — et elle n'enregistre plus rien de significatif.

Par ailleurs, trois renforcements issus d'un audit de sécurité communautaire.

La vérification des signatures d'une version amont compte désormais des signataires distincts plutôt que des signatures. Comme elle comptait les signatures, une seule clé de publication signant plusieurs fois pouvait satisfaire un quorum censé exiger plusieurs personnes indépendantes : la tolérance annoncée par la vérification n'était donc pas celle qu'elle appliquait. Rien ne change pour les versions que ce paquet construit : chacune est signée par bien plus de personnes distinctes qu'il n'en faut pour passer dans les deux cas.

Lorsqu'un autre service demande à modifier la configuration de ce nœud, il n'atteint plus que la poignée de réglages qui le concernent réellement, au lieu de l'ensemble du fichier de configuration. Auparavant, une telle demande pouvait aussi porter des réglages qui n'apparaissaient jamais sur l'écran où vous la validez.

Enfin, un mot de passe RPC fourni par un autre service doit désormais compter au moins vingt caractères. Ce champ est rempli par le service qui demande l'accès et vous ne pouvez pas le modifier : rien n'empêchait donc un service négligent de choisir quelque chose de facile à deviner.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    // Keyed by Core major series as caret ranges — one entry per Core
    // major, not per Core `:N`. Range-keyed `migrations.other` requires
    // StartOS ≥ 0.4.0-beta.9 (Start9Labs/start-os#3214).
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
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        // Knots → Core
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await storeJson.merge(effects, leavingRdtsFlavor)
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
          await storeJson.merge(effects, leavingRdtsFlavor)
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
          await storeJson.merge(effects, leavingRdtsFlavor)
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
        up: async ({ effects }) => {},
      },
    },
  },
})
  .satisfies('29.4:6')
  .satisfies('28.4:19')
