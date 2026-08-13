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
  version: '#knotsprerdts:29.3:19',
  releaseNotes: {
    en_US: `Updates the bundled RPC proxy that serves pruned nodes.

The proxy read more of Bitcoin Core's report on connected peers than it needed, insisting on fields Bitcoin Core does not always send. On Bitcoin Core 31 one of those fields went away and broke block retrieval outright, including for blocks the node still had on disk. This version was never affected — the field is still sent here — but the same trap was set: another field the proxy insisted on is reported only in some circumstances. It now reads only the three values it actually uses.

Two other improvements come with it. The proxy asks your own node for a block before it looks up peers, rather than the other way round, so trouble reaching the network can no longer affect a block your node still has. And it writes its errors to the service log; previously it ran at a logging level it has no messages for, so it could not report a failure at all.

Unpruned nodes are unaffected — they never run the proxy.`,
    es_ES: `Actualiza el proxy RPC incluido que atiende a los nodos podados.

El proxy leía del informe de Bitcoin Core sobre los pares conectados más de lo que necesitaba, exigiendo campos que Bitcoin Core no siempre envía. En Bitcoin Core 31 uno de esos campos desapareció y rompió por completo la obtención de bloques, incluidos los que el nodo aún tenía en disco. Esta versión nunca se vio afectada —aquí el campo se sigue enviando—, pero la trampa estaba puesta igualmente: otro campo que el proxy exigía solo se informa en determinadas circunstancias. Ahora lee únicamente los tres valores que realmente utiliza.

Con ello llegan otras dos mejoras. El proxy pregunta por un bloque a tu propio nodo antes de buscar pares, y no al revés, así que los problemas para llegar a la red ya no pueden afectar a un bloque que tu nodo todavía tiene. Y escribe sus errores en el registro del servicio; antes funcionaba con un nivel de registro para el que no tiene mensajes, de modo que no podía informar de ningún fallo.

Los nodos sin podar no se ven afectados: nunca ejecutan el proxy.`,
    de_DE: `Aktualisiert den mitgelieferten RPC-Proxy, der beschnittene Knoten bedient.

Der Proxy las aus Bitcoin Cores Bericht über die verbundenen Gegenstellen mehr, als er brauchte, und bestand auf Feldern, die Bitcoin Core nicht immer sendet. Unter Bitcoin Core 31 fiel eines dieser Felder weg und legte das Beschaffen von Blöcken vollständig lahm — auch für Blöcke, die der Knoten noch auf der Festplatte hatte. Diese Version war nie betroffen, denn hier wird das Feld weiterhin gesendet; die Falle war aber ebenso gestellt: Ein weiteres Feld, auf dem der Proxy bestand, wird nur unter bestimmten Umständen gemeldet. Er liest jetzt nur noch die drei Werte, die er tatsächlich verwendet.

Zwei weitere Verbesserungen kommen damit. Der Proxy fragt zuerst deinen eigenen Knoten nach einem Block und sucht erst danach Gegenstellen, nicht umgekehrt — Schwierigkeiten mit dem Netz können damit keinen Block mehr betreffen, den dein Knoten noch hat. Und er schreibt seine Fehler ins Dienstprotokoll; zuvor lief er auf einer Protokollstufe, für die er keine Meldungen besitzt, und konnte deshalb überhaupt keinen Fehler melden.

Unbeschnittene Knoten sind nicht betroffen — sie starten den Proxy nie.`,
    pl_PL: `Aktualizuje dołączone proxy RPC, które obsługuje węzły z przycinaniem.

Proxy czytało z raportu Bitcoin Core o połączonych węzłach więcej, niż potrzebowało, wymagając pól, których Bitcoin Core nie zawsze wysyła. W Bitcoin Core 31 jedno z tych pól zniknęło i całkowicie zepsuło pobieranie bloków — również tych, które węzeł wciąż miał na dysku. Tej wersji to nigdy nie dotyczyło, bo tutaj pole nadal jest wysyłane, ale pułapka była zastawiona tak samo: inne wymagane pole bywa podawane tylko w niektórych okolicznościach. Proxy czyta teraz wyłącznie trzy wartości, z których faktycznie korzysta.

Idą z tym dwie kolejne poprawki. Proxy pyta o blok najpierw twój własny węzeł, a dopiero potem szuka węzłów w sieci, a nie odwrotnie — kłopoty z siecią nie mogą już wpłynąć na blok, który twój węzeł nadal ma. I zapisuje swoje błędy w dzienniku usługi; wcześniej działało na poziomie logowania, dla którego nie ma żadnych komunikatów, więc nie mogło zgłosić żadnej awarii.

Węzłów bez przycinania to nie dotyczy — nigdy nie uruchamiają proxy.`,
    fr_FR: `Met à jour le proxy RPC embarqué qui dessert les nœuds élagués.

Le proxy lisait du rapport de Bitcoin Core sur les pairs connectés plus que nécessaire, en exigeant des champs que Bitcoin Core n'envoie pas toujours. Sous Bitcoin Core 31, l'un de ces champs a disparu et a cassé net la récupération des blocs — y compris pour ceux que le nœud avait encore sur disque. Cette version n'a jamais été concernée, car le champ y est toujours envoyé ; mais le piège était tendu de la même façon : un autre champ exigé par le proxy n'est publié que dans certaines circonstances. Il ne lit désormais que les trois valeurs dont il se sert réellement.

Deux autres améliorations l'accompagnent. Le proxy interroge votre propre nœud avant de chercher des pairs, et non l'inverse : une difficulté à joindre le réseau ne peut donc plus affecter un bloc que votre nœud possède encore. Et il consigne ses erreurs dans le journal du service ; auparavant il tournait à un niveau de journalisation pour lequel il n'a aucun message, et ne pouvait donc signaler aucune panne.

Les nœuds non élagués ne sont pas concernés : ils n'exécutent jamais le proxy.`,
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
  .satisfies('29.4:7')
  .satisfies('28.4:20')
