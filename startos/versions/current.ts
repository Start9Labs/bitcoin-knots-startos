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
  version: '#knots:29.4:0',
  releaseNotes: {
    en_US: `Update to Bitcoin Knots v29.4.knots20260508

Separately, three hardening changes from a community security audit.

The check that verifies the signatures on an upstream release now counts distinct signers rather than signatures. Because it counted signatures, one release key signing several times could satisfy a quorum meant to require several independent people — so the tolerance the check advertised was not the tolerance it enforced. Nothing about the releases this package builds changes: each is signed by more than enough separate people to pass either way.

When another service asks to adjust this node's configuration, it can now reach only the handful of settings such a service has any business setting, instead of the entire configuration file. Previously such a request could also carry settings that never appeared on the screen where you approve it.

And an RPC password handed over by another service must now be at least twenty characters. That field is filled in by the service requesting access and you cannot edit it, so nothing was stopping a careless one from choosing something guessable.`,
    es_ES: `Actualización a Bitcoin Knots v29.4.knots20260508

Aparte de lo anterior, tres mejoras de robustez surgidas de una auditoría de seguridad de la comunidad.

La comprobación que verifica las firmas de una versión oficial ahora cuenta firmantes distintos en lugar de firmas. Como contaba firmas, una sola clave de publicación que firmara varias veces podía satisfacer un quórum pensado para exigir varias personas independientes, de modo que la tolerancia que anunciaba la comprobación no era la que realmente aplicaba. Nada cambia en las versiones que compila este paquete: cada una está firmada por bastantes más personas distintas de las necesarias para pasarla en cualquiera de los dos casos.

Cuando otro servicio solicita ajustar la configuración de este nodo, ahora solo puede llegar al puñado de ajustes que a tal servicio le corresponde tocar, en vez de a todo el archivo de configuración. Antes, esa solicitud también podía llevar ajustes que nunca aparecían en la pantalla donde usted la aprueba.

Además, una contraseña RPC facilitada por otro servicio debe tener ahora al menos veinte caracteres. Ese campo lo rellena el servicio que solicita el acceso y usted no puede editarlo, así que nada impedía que uno descuidado eligiera algo fácil de adivinar.`,
    de_DE: `Aktualisierung auf Bitcoin Knots v29.4.knots20260508

Davon unabhängig: drei Härtungsänderungen aus einem Sicherheitsaudit der Community.

Die Prüfung der Signaturen einer Upstream-Veröffentlichung zählt jetzt unterschiedliche Signierende statt Signaturen. Da sie Signaturen zählte, konnte ein einzelner Veröffentlichungsschlüssel durch mehrfaches Signieren ein Quorum erfüllen, das mehrere unabhängige Personen verlangen sollte — die Toleranz, die die Prüfung angab, war also nicht die, die sie durchsetzte. An den Veröffentlichungen, die dieses Paket baut, ändert sich nichts: Jede ist von mehr als genug verschiedenen Personen signiert, um so oder so zu bestehen.

Wenn ein anderer Dienst darum bittet, die Konfiguration dieses Knotens anzupassen, erreicht er jetzt nur noch die wenigen Einstellungen, die einen solchen Dienst überhaupt etwas angehen, statt der gesamten Konfigurationsdatei. Zuvor konnte eine solche Anfrage auch Einstellungen enthalten, die auf dem Bildschirm, auf dem Sie sie bestätigen, nie auftauchten.

Und ein von einem anderen Dienst übergebenes RPC-Passwort muss nun mindestens zwanzig Zeichen lang sein. Dieses Feld füllt der anfragende Dienst aus und Sie können es nicht ändern — nichts hielt also einen nachlässigen Dienst davon ab, etwas leicht Erratbares zu wählen.`,
    pl_PL: `Aktualizacja do Bitcoin Knots v29.4.knots20260508

Niezależnie od powyższego: trzy zmiany wzmacniające, wynikające ze społecznościowego audytu bezpieczeństwa.

Kontrola weryfikująca podpisy wydania upstream liczy teraz odrębnych sygnatariuszy, a nie podpisy. Ponieważ liczyła podpisy, jeden klucz wydania podpisujący kilkakrotnie mógł spełnić kworum pomyślane tak, by wymagać kilku niezależnych osób — deklarowana odporność kontroli nie była więc tą, którą faktycznie egzekwowała. W wydaniach budowanych przez ten pakiet nic się nie zmienia: każde jest podpisane przez znacznie więcej odrębnych osób, niż potrzeba do jej przejścia w obu wariantach.

Gdy inna usługa prosi o zmianę konfiguracji tego węzła, może teraz sięgnąć wyłącznie po tę garstkę ustawień, które takiej usługi w ogóle dotyczą, zamiast po cały plik konfiguracyjny. Wcześniej takie żądanie mogło nieść również ustawienia, które nigdy nie pojawiały się na ekranie zatwierdzania.

Hasło RPC przekazane przez inną usługę musi mieć teraz co najmniej dwadzieścia znaków. To pole wypełnia usługa prosząca o dostęp i nie można go edytować, więc nic nie powstrzymywało nieostrożnej usługi przed wybraniem czegoś łatwego do odgadnięcia.`,
    fr_FR: `Mise à jour vers Bitcoin Knots v29.4.knots20260508

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
      // retired. Users on it can move here; preserve their RDTS acceptance
      // so the consensusrules critical-task gate doesn't re-fire. No
      // `down` — `#knotsrdts` is being de-listed, so the inverse path
      // can't be selected by a user.
      ['^#knotsrdts:29.3']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, { consensusrules: 'rdts' })
        },
      },
    },
  },
})
  .satisfies('29.4:5')
  .satisfies('28.4:18')
