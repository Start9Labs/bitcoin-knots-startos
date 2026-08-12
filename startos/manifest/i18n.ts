export const short = {
  en_US: 'A Bitcoin Knots node on the BIP-110 (RDTS) chain',
  es_ES: 'Un nodo Bitcoin Knots en la cadena BIP-110 (RDTS)',
  de_DE: 'Ein Bitcoin-Knots-Knoten auf der BIP-110-Kette (RDTS)',
  pl_PL: 'Węzeł Bitcoin Knots w łańcuchu BIP-110 (RDTS)',
  fr_FR: 'Un nœud Bitcoin Knots sur la chaîne BIP-110 (RDTS)',
}

export const long = {
  en_US: `This flavor follows the BIP-110 (RDTS) chain, not the Bitcoin network. The Reduced Data Temporary Softfork did not carry the network: in August 2026, at block 961,632, the nodes enforcing it split onto a chain of their own, and that is the chain this version of Bitcoin Knots validates and builds on. Installing it, or switching to it from Bitcoin Core or Bitcoin Knots (pre-RDTS), moves your node onto a different blockchain and a different network — an opt-in, not an update, and the service asks you to confirm it before it will start.

Know what to expect. The RDTS chain kept Bitcoin's mining difficulty but attracted a tiny fraction of its hashpower, so it currently produces a block only about once every day or two: deposits will not confirm, and services that depend on your node, Lightning among them, will stall. A hard fork to a new proof-of-work algorithm is planned for 1 September 2026 to restore normal block production. The two chains share no replay protection, so a transaction broadcast on one can be replayed on the other and spend the same coins there.

In every other respect this is a full Bitcoin Knots node with what the Start9 package provides throughout: pruned or full archival operation chosen by disk size, an embedded I2P daemon, outbound Tor, ZeroMQ, compact block filters, and RPC for wallets and dependent services. For a node on the chain the rest of the Bitcoin network follows, install Bitcoin Core or Bitcoin Knots (pre-RDTS) instead.`,
  es_ES: `Esta variante sigue la cadena BIP-110 (RDTS), no la red Bitcoin. El Reduced Data Temporary Softfork no arrastró consigo a la red: en agosto de 2026, en el bloque 961.632, los nodos que lo aplicaban se separaron en una cadena propia, y esa es la cadena que esta versión de Bitcoin Knots valida y extiende. Instalarla, o cambiar a ella desde Bitcoin Core o Bitcoin Knots (pre-RDTS), traslada tu nodo a otra cadena de bloques y a otra red: es una adhesión, no una actualización, y el servicio te pide confirmarla antes de arrancar.

Ten claro qué esperar. La cadena RDTS conserva la dificultad de minado de Bitcoin pero atrajo una fracción ínfima de su potencia de cálculo, así que ahora mismo produce un bloque solo cada uno o dos días: los depósitos no se confirmarán y los servicios que dependen de tu nodo, Lightning entre ellos, se quedarán bloqueados. Está previsto un hard fork a un nuevo algoritmo de prueba de trabajo el 1 de septiembre de 2026 para restablecer la producción normal de bloques. Las dos cadenas no tienen protección contra repetición, por lo que una transacción difundida en una puede repetirse en la otra y gastar allí las mismas monedas.

En todo lo demás es un nodo completo de Bitcoin Knots con lo que el paquete de Start9 ofrece siempre: funcionamiento podado o de archivo completo según el tamaño del disco, un daemon I2P integrado, Tor de salida, ZeroMQ, filtros de bloque compactos y RPC para monederos y servicios dependientes. Para un nodo en la cadena que sigue el resto de la red Bitcoin, instala Bitcoin Core o Bitcoin Knots (pre-RDTS).`,
  de_DE: `Diese Variante folgt der BIP-110-Kette (RDTS), nicht dem Bitcoin-Netzwerk. Der Reduced Data Temporary Softfork hat das Netzwerk nicht mitgenommen: Im August 2026 spalteten sich die Knoten, die ihn durchsetzen, bei Block 961.632 auf eine eigene Kette ab, und genau diese Kette validiert und verlängert diese Version von Bitcoin Knots. Sie zu installieren oder von Bitcoin Core oder Bitcoin Knots (pre-RDTS) zu ihr zu wechseln, setzt deinen Knoten auf eine andere Blockchain und in ein anderes Netzwerk — ein bewusster Beitritt, kein Update, und der Dienst lässt ihn dich bestätigen, bevor er startet.

Sei dir im Klaren, was dich erwartet. Die RDTS-Kette behielt Bitcoins Mining-Schwierigkeit, zog aber nur einen winzigen Bruchteil der Rechenleistung an und bringt derzeit nur etwa alle ein bis zwei Tage einen Block hervor: Einzahlungen werden nicht bestätigt, und Dienste, die auf deinen Knoten angewiesen sind, darunter Lightning, bleiben stehen. Für den 1. September 2026 ist ein Hard Fork auf einen neuen Proof-of-Work-Algorithmus geplant, der die normale Blockproduktion wiederherstellen soll. Die beiden Ketten haben keinen Replay-Schutz, sodass eine auf der einen gesendete Transaktion auf der anderen wiederholt werden kann und dort dieselben Coins ausgibt.

In allem Übrigen ist dies ein vollwertiger Bitcoin-Knots-Knoten mit allem, was das Start9-Paket durchgehend bietet: beschnittener oder vollständiger Archivbetrieb je nach Festplattengröße, ein eingebetteter I2P-Daemon, ausgehendes Tor, ZeroMQ, kompakte Blockfilter und RPC für Wallets und abhängige Dienste. Für einen Knoten auf der Kette, der das übrige Bitcoin-Netzwerk folgt, installiere stattdessen Bitcoin Core oder Bitcoin Knots (pre-RDTS).`,
  pl_PL: `Ta odmiana podąża za łańcuchem BIP-110 (RDTS), a nie za siecią Bitcoina. Reduced Data Temporary Softfork nie pociągnął za sobą sieci: w sierpniu 2026 roku, na bloku 961 632, węzły go egzekwujące odłączyły się na własny łańcuch i to właśnie ten łańcuch ta wersja Bitcoin Knots weryfikuje i rozbudowuje. Instalacja tej wersji lub przejście na nią z Bitcoin Core albo Bitcoin Knots (pre-RDTS) przenosi twój węzeł na inny łańcuch bloków i do innej sieci — to świadome przystąpienie, nie aktualizacja, a usługa poprosi cię o potwierdzenie, zanim wystartuje.

Miej świadomość, czego się spodziewać. Łańcuch RDTS zachował trudność wydobycia Bitcoina, ale przyciągnął znikomy ułamek jego mocy obliczeniowej, więc obecnie wytwarza blok mniej więcej raz na dobę lub dwie: wpłaty nie będą się potwierdzać, a usługi zależne od twojego węzła, w tym Lightning, staną. Na 1 września 2026 roku planowany jest hard fork na nowy algorytm proof-of-work, który ma przywrócić normalną produkcję bloków. Oba łańcuchy nie mają ochrony przed powtórzeniem, więc transakcja rozgłoszona na jednym może zostać powtórzona na drugim i wydać tam te same monety.

Pod każdym innym względem jest to pełny węzeł Bitcoin Knots ze wszystkim, co pakiet Start9 oferuje zawsze: pracą w trybie przyciętym lub pełnego archiwum zależnie od rozmiaru dysku, wbudowanym demonem I2P, wychodzącym Torem, ZeroMQ, kompaktowymi filtrami bloków oraz RPC dla portfeli i usług zależnych. Jeśli chcesz węzeł w łańcuchu, za którym podąża reszta sieci Bitcoina, zainstaluj Bitcoin Core lub Bitcoin Knots (pre-RDTS).`,
  fr_FR: `Cette variante suit la chaîne BIP-110 (RDTS), et non le réseau Bitcoin. Le Reduced Data Temporary Softfork n'a pas entraîné le réseau avec lui : en août 2026, au bloc 961 632, les nœuds qui l'appliquaient se sont séparés sur une chaîne à eux, et c'est cette chaîne que cette version de Bitcoin Knots valide et prolonge. L'installer, ou y basculer depuis Bitcoin Core ou Bitcoin Knots (pre-RDTS), déplace votre nœud sur une autre chaîne de blocs et sur un autre réseau : c'est une adhésion, pas une mise à jour, et le service vous demande de la confirmer avant de démarrer.

Sachez à quoi vous attendre. La chaîne RDTS a conservé la difficulté de minage de Bitcoin mais n'a attiré qu'une infime fraction de sa puissance de calcul : elle ne produit actuellement un bloc que tous les un à deux jours environ, de sorte que les dépôts ne seront pas confirmés et que les services qui dépendent de votre nœud, dont Lightning, resteront bloqués. Un hard fork vers un nouvel algorithme de preuve de travail est prévu le 1er septembre 2026 pour rétablir une production normale de blocs. Les deux chaînes n'ont aucune protection contre le rejeu : une transaction diffusée sur l'une peut être rejouée sur l'autre et y dépenser les mêmes pièces.

À tout autre égard, il s'agit d'un nœud Bitcoin Knots complet, avec ce que le paquet Start9 fournit partout : fonctionnement élagué ou archivage complet selon la taille du disque, un démon I2P embarqué, Tor sortant, ZeroMQ, filtres de blocs compacts et RPC pour les portefeuilles et les services dépendants. Pour un nœud sur la chaîne que suit le reste du réseau Bitcoin, installez plutôt Bitcoin Core ou Bitcoin Knots (pre-RDTS).`,
}

export const torDescription = {
  en_US:
    'Required for .onion peer connectivity, onlynet=onion, or when a Tor address is requested.',
  es_ES:
    'Requerido para conectividad de pares .onion, onlynet=onion, o cuando se solicita una dirección Tor.',
  de_DE:
    'Erforderlich für .onion Peer-Konnektivität, onlynet=onion oder wenn eine Tor-Adresse angefordert wird.',
  pl_PL:
    'Wymagany dla połączeń .onion z peerami, onlynet=onion lub gdy żądany jest adres Tor.',
  fr_FR:
    "Requis pour la connectivité .onion entre pairs, onlynet=onion, ou lorsqu'une adresse Tor est demandée.",
}
