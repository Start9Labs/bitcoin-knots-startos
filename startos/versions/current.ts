import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { i2pdConfFile } from '../fileModels/i2pd.conf'
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
  version: '#knotsprerdts:29.3:24',
  releaseNotes: {
    en_US: `A readable service log, and an I2P router that can actually be reached.

- The bundled I2P router used to narrate its routine network weather — failed handshakes with faraway routers, tunnel tests, peer lookups — at some 25 lines a minute, burying Bitcoin's own output (about one line a minute) and shrinking a full log export to six hours of history. That known-routine chatter is now dropped before it reaches the log, and the router lines that remain carry an [i2pd] prefix. Nothing that matters is lost: real failures — a reseed that cannot complete, a bridge that cannot bind — were never in the dropped set, and any message the filter does not recognize always passes through.
- The router's bandwidth class is raised from L to O, once. L is i2pd's lowest class — a 32 KB/s ceiling — and in practice a class-L router behind a home connection rarely gets its address publication confirmed in time: the repeating "Publish confirmation was not received" line in the log, and unreliable inbound I2P with it. The standalone I2P service on StartOS ships class O for the same reason. Because the router also relays traffic for other I2P users, the raise lifts that relay ceiling from 32 KB/s to 256 KB/s as well. The raise happens once, even over a hand-set L, and touches nothing else; afterwards any class — including L — can be set again in i2pd.conf on the i2pd volume, where relaying can also be reduced (share) or turned off (notransit).`,
    es_ES: `Un registro del servicio legible, y un router I2P al que de verdad se puede llegar.

- El router I2P integrado narraba su meteorología de red rutinaria — saludos fallidos con routers lejanos, pruebas de túneles, búsquedas de pares — a unas 25 líneas por minuto, enterrando la salida propia de Bitcoin (alrededor de una línea por minuto) y reduciendo una exportación completa del registro a unas seis horas de historia. Ese parloteo rutinario y conocido ahora se descarta antes de llegar al registro, y las líneas del router que quedan llevan el prefijo [i2pd]. No se pierde nada que importe: los fallos reales — un resembrado que no puede completarse, un puente que no puede enlazarse — nunca estuvieron en el conjunto descartado, y cualquier mensaje que el filtro no reconozca pasa siempre.
- La clase de ancho de banda del router sube de L a O, una sola vez. L es la clase más baja de i2pd — un techo de 32 KB/s — y en la práctica un router de clase L detrás de una conexión doméstica rara vez consigue confirmar a tiempo la publicación de su dirección: la línea repetida "Publish confirmation was not received" en el registro, y con ella una I2P entrante poco fiable. El servicio I2P independiente de StartOS incluye la clase O por la misma razón. Como el router también retransmite tráfico para otros usuarios de I2P, la subida eleva igualmente ese techo de retransmisión de 32 KB/s a 256 KB/s. La subida ocurre una sola vez, incluso sobre una L fijada a mano, y no toca nada más; después puede fijarse de nuevo cualquier clase — incluida L — en i2pd.conf en el volumen i2pd, donde la retransmisión también puede reducirse (share) o desactivarse (notransit).`,
    de_DE: `Ein lesbares Dienstprotokoll — und ein I2P-Router, der tatsächlich erreichbar ist.

- Der mitgelieferte I2P-Router erzählte sein alltägliches Netzwerkwetter — fehlgeschlagene Handshakes mit fernen Routern, Tunneltests, Peer-Abfragen — mit rund 25 Zeilen pro Minute, begrub damit Bitcoins eigene Ausgabe (etwa eine Zeile pro Minute) und ließ einen vollständigen Protokollexport auf sechs Stunden Geschichte schrumpfen. Dieses bekannte Routine-Geplapper wird jetzt verworfen, bevor es das Protokoll erreicht, und die verbleibenden Router-Zeilen tragen das Präfix [i2pd]. Nichts Wichtiges geht verloren: Echte Fehler — ein Reseed, das nicht abschließen kann, eine Brücke, die sich nicht binden kann — waren nie in der verworfenen Menge, und jede Meldung, die der Filter nicht kennt, kommt immer durch.
- Die Bandbreitenklasse des Routers steigt von L auf O, einmalig. L ist i2pds niedrigste Klasse — eine Obergrenze von 32 KB/s — und in der Praxis bekommt ein Klasse-L-Router hinter einem Heimanschluss die Veröffentlichung seiner Adresse selten rechtzeitig bestätigt: die sich wiederholende Zeile "Publish confirmation was not received" im Protokoll, und damit ein unzuverlässiges eingehendes I2P. Der eigenständige I2P-Dienst auf StartOS liefert aus demselben Grund Klasse O aus. Da der Router auch Verkehr für andere I2P-Nutzer weiterleitet, hebt die Anhebung zugleich diese Weiterleitungsobergrenze von 32 KB/s auf 256 KB/s. Die Anhebung geschieht einmalig, auch über ein von Hand gesetztes L hinweg, und ändert sonst nichts; danach lässt sich jede Klasse — auch L — wieder in i2pd.conf auf dem i2pd-Volume setzen, wo sich die Weiterleitung auch drosseln (share) oder abschalten (notransit) lässt.`,
    pl_PL: `Czytelny dziennik usługi i router I2P, do którego naprawdę można się dostać.

- Dołączony router I2P opowiadał o swojej rutynowej pogodzie sieciowej — nieudanych powitaniach z odległymi routerami, testach tuneli, wyszukiwaniach peerów — w tempie około 25 linii na minutę, grzebiąc własne komunikaty Bitcoina (około jednej linii na minutę) i skracając pełny eksport dziennika do jakichś sześciu godzin historii. Ta znana, rutynowa paplanina jest teraz odrzucana, zanim trafi do dziennika, a pozostałe linie routera noszą przedrostek [i2pd]. Nie ginie nic, co ma znaczenie: prawdziwe awarie — reseed, który nie może się dokończyć, mostek, który nie może się dowiązać — nigdy nie były w zbiorze odrzucanym, a każdy komunikat, którego filtr nie rozpoznaje, zawsze przechodzi.
- Klasa przepustowości routera rośnie z L do O, jednorazowo. L to najniższa klasa i2pd — pułap 32 KB/s — i w praktyce router klasy L za domowym łączem rzadko zdąża potwierdzić na czas publikację swojego adresu: powtarzająca się w dzienniku linia "Publish confirmation was not received", a wraz z nią zawodne przychodzące I2P. Samodzielna usługa I2P w StartOS z tego samego powodu domyślnie używa klasy O. Ponieważ router przekazuje też ruch innych użytkowników I2P, podniesienie podnosi zarazem ten pułap przekazywania z 32 KB/s do 256 KB/s. Podniesienie następuje jednorazowo, także ponad ręcznie ustawionym L, i niczego innego nie zmienia; potem każdą klasę — również L — można ustawić ponownie w i2pd.conf na wolumenie i2pd, gdzie przekazywanie można też ograniczyć (share) albo wyłączyć (notransit).`,
    fr_FR: `Un journal de service lisible, et un routeur I2P que l'on peut réellement joindre.

- Le routeur I2P embarqué racontait sa météo réseau ordinaire — poignées de main échouées avec des routeurs lointains, tests de tunnels, recherches de pairs — à quelque 25 lignes par minute, enterrant la propre sortie de Bitcoin (environ une ligne par minute) et réduisant un export complet du journal à six heures d'historique. Ce bavardage routinier et connu est désormais écarté avant d'atteindre le journal, et les lignes du routeur qui restent portent le préfixe [i2pd]. Rien d'important n'est perdu : les vraies pannes — un réamorçage qui ne peut pas aboutir, un pont qui ne peut pas se lier — n'ont jamais fait partie de l'ensemble écarté, et tout message que le filtre ne reconnaît pas passe toujours.
- La classe de bande passante du routeur passe de L à O, une seule fois. L est la classe la plus basse d'i2pd — un plafond de 32 KB/s — et en pratique un routeur de classe L derrière une connexion domestique parvient rarement à faire confirmer à temps la publication de son adresse : la ligne « Publish confirmation was not received » qui se répète dans le journal, et avec elle un I2P entrant peu fiable. Le service I2P autonome de StartOS livre la classe O pour la même raison. Comme le routeur relaie aussi du trafic pour d'autres utilisateurs d'I2P, la hausse relève également ce plafond de relais de 32 KB/s à 256 KB/s. La hausse n'a lieu qu'une seule fois, y compris par-dessus un L réglé à la main, et ne touche à rien d'autre ; ensuite, toute classe — y compris L — peut être rétablie dans i2pd.conf sur le volume i2pd, où le relais peut aussi être réduit (share) ou désactivé (notransit).`,
  },
  migrations: {
    up: async ({ effects }) => {
      // Raise the i2pd bandwidth class from the old shipped default, once.
      // A hand-set 'L' is indistinguishable from that default and is
      // raised too — disclosed in the release notes; any other value is
      // left alone. Rationale: fileModels/i2pd.conf.ts. Guarded twice: the
      // read is null-safe for legacy paths where i2pd.conf does not exist
      // yet, and the whole step is try/caught because a cosmetic raise
      // must never abort an update — an unreadable or unwritable
      // i2pd.conf just skips it.
      try {
        const conf = await i2pdConfFile.read().once()
        if (conf?.bandwidth === 'L') {
          await i2pdConfFile.merge(effects, { bandwidth: 'O' })
        }
      } catch (e) {
        console.error('i2pd bandwidth raise skipped:', e)
      }
    },
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
  .satisfies('29.4:11')
  .satisfies('28.4:24')
