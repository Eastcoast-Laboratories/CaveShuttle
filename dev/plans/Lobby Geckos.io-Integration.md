# Prompt für die Geckos.io-Integration & UI-Design in Cave Shuttle

Integriere bitte die Netzwerkschicht mit Geckos.io (WebRTC) in mein React-Spiel "Cave Shuttle" (Capacitor für iOS/Android). Das System muss sowohl lokale Peer-to-Peer-Verbindungen im selben WLAN (ohne externen Server) als auch Online-Lobbies über das Internet unterstützen. 

Erstelle neben der Logik auch die entsprechenden React-Komponenten (UI) mit passendem Styling (CSS/Tailwind).

---

## 1. Startseite (Main Menu UI)
Füge auf dem Startbildschirm einen prominenten Button **"Multiplayer"** hinzu. Wenn der Spieler darauf klickt, öffnet sich ein Overlay oder eine neue Ansicht mit folgenden Optionen:

- **"Lokales Spiel (WLAN)"**: Öffnet die lokale Lobby-Suche.
- **"Online-Spiel"**: Öffnet das Online-Matchmaking / die Server-Lobby.
- **"Zurück"**: Schließt das Menü.

---

## 2. Das Lobby-Design & Interaktionen

Erstelle eine übersichtliche, funktionale Lobby-Ansicht für beide Modi (Lokal & Online):

### A. Lokale WLAN-Lobby (Peer-to-Peer)
- **Host-Ansicht:** 
  - Button **"Lobby erstellen"**. 
  - Sobald geklickt, generiert die App einen **QR-Code** auf dem Bildschirm (enthält die lokalen Signaling-Daten/IP) und zeigt die eigene lokale IP als Text an.
  - Text-Status: *"Warte auf Spieler 2 im selben WLAN..."*
- **Client-Ansicht (Beitreten):**
  - Button **"QR-Code scannen"** (öffnet die Kamera via Capacitor) oder ein Eingabefeld für die IP-Adresse des Hosts.
  - Button **"Verbinden"**.

### B. Online-Lobby (Internet)
- **Host-Ansicht:**
  - Button **"Privates Spiel erstellen"**. Generiert einen kurzen **Lobby-Code** (z. B. `XF7K9`) und einen **"Link kopieren"**-Button, um ihn an Freunde zu schicken.
  - Button **"Zufälliges Matchmaking"** (sucht automatisch nach offenen, öffentlichen Räumen).
- **Client-Ansicht (Beitreten):**
  - Eingabefeld für den **Lobby-Code** + Button **"Beitreten"**.

### C. Gemeinsamer Lobby-Raum (Wenn verbunden)
Sobald zwei Spieler im selben Raum (egal ob lokal oder online) sind, wechselt die Ansicht in den **Warteraum**:
- **Spieler-Slots:** Anzeige von zwei Slots: `Spieler 1 (Host) - [Bereit]` und `Spieler 2 - [Wartet / Bereit]`.
- **Chat/Status-Fenster:** Ein simpler Textbereich für Systemmeldungen (z. B. *"Spieler 2 beigetreten. Verbindung stabil (Latenz: 15ms)"*).
- **Start-Bedingung:** Sobald beide Spieler auf einen großen **"Bereit"**-Button gedrückt haben, startet der Host das Spiel über einen **"Spiel starten"**-Button. Der Bildschirm fadet aus und das Gameplay beginnt.

---

## 3. Spielmechanik & Synchronisation (Physik-Netcode)
- **Phase 1 (Flug zum Pod):** Spieler 1 steuert das Raumschiff (Düse + Rotation). Spieler 1 hat die physikalische Authority und sendet kontinuierlich Position/Rotation des Schiffs an Spieler 2.
- **Phase 2 (Pod aufgenommen):** Sobald der schwere Pod über die starre Stange angekoppelt ist, entsteht ein verbundenes, physikalisches System.
- **Input-Synchronisation in Phase 2:** Spieler 2 übernimmt die Kontrolle über die Düse des Pods. Seine Input-Befehle (Düse an/aus) müssen mit minimaler Latenz an Spieler 1 übertragen werden, damit Spieler 1 das gesamte, gekoppelte Physik-System lokal berechnen und die resultierenden Zustände (Position/Rotation von Schiff UND Pod) an Spieler 2 zurückspiegeln kann.

Erstelle die React-Hooks, UI-Komponenten und den Geckos.io-Service, die dieses System komplett abbilden.