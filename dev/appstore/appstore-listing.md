# App Store Connect Listing — Cave Shuttle

Everything needed for the iOS App Store entry, collected from the existing
Google Play listing (`dev/playstore/playstore-listing.md`, `fastlane/metadata/`)
and the live community site. App record already exists:
https://appstoreconnect.apple.com/apps/6821246830

## Basic information

| Field | Value |
|-------|-------|
| App name (30 chars) | `Cave Shuttle` |
| Subtitle (30 chars) | `Physics cave-flying arcade` |
| Bundle ID | `de.z11.caveshuttle` |
| SKU | `caveshuttle-001` |
| Primary language | English (U.S.) — German als zweite Locale anlegen |
| Primary category | Games → Arcade |
| Secondary category | Games → Action |
| Version / Build | 5.2 / 15 (aus `mobile-build.sh -u`) |
| Copyright | `2026 Ruben Barkow-Kuder` |
| Price | €1,99 (Apple Price Tier bzw. Custom Price Point — setzt einen bezahlten Paid-Apps-Vertrag + Bankdaten unter **Business** voraus) |

## URLs

| Field | Value |
|-------|-------|
| Privacy Policy URL (Pflicht) | `https://community.caveshuttle.z11.de/datenschutz` (live, 200 ✓) |
| Support URL (Pflicht) | `https://caveshuttle.z11.de` |
| Marketing URL (optional) | `https://caveshuttle.z11.de` |

## Promotional text (170 chars, jederzeit ohne Review änderbar)

Fly a spaceship through dangerous caves, dock the cargo pod and escape into
space. Physics-based retro arcade action — solo or two-player on one device.

## Keywords (max 100 chars, comma-separated, kein Platz nach Komma nötig)

spaceship,cave,thrust,arcade,physics,retro,gravity,lander,shooter,pod

(Alternative für de-Locale: `raumschiff,höhle,arcade,physik,retro,schwerkraft`)

## Description — English (4,000 chars max)

Pilot a spaceship through dangerous caves, rescue the cargo pod, and escape into space.

Cave Shuttle is a physics-based arcade game about precision flying, fuel management, and momentum control. Navigate through cave levels, dodge walls and enemy fire, dock the cargo pod, and deliver it back upward into open space to complete the level.

FEATURES

- Physics-based flight with gravity, inertia, and momentum
- Several cave levels with distinct layouts and hazards
- Enemy bunkers, bullets, fuel depots and slider doors
- Single-player mode
- Two-player mode (local on the same device or via Wi-Fi): one player controls the ship, the second player controls the gun and later in the game the cargo pod with its own gun and thruster
- Bonus lives
- Sound effects
- Named high scores
- Time bonuses for fast level completion
- Custom level-pack support and an integrated level editor with export function
- Local import and export of player data

HOW TO PLAY

Use on-screen touch buttons, a virtual joystick, or gyroscope tilt for acceleration, rotation, the tractor beam, and firing.

1. Fly close to the cargo pod.
2. Activate the tractor beam to dock it under your ship.
3. Fly upward into space with the cargo pod to finish the level.
4. Earn more points by flying efficiently, collecting fuel, triggering level elements, destroying bunkers, and finishing quickly.

HIGH SCORES

Pick a player name or use the generated one. Every level completion and full run is recorded with a detailed score breakdown. High-score tables are separated by level, level pack, and 1- or 2-player mode, so you always know exactly how your points were earned.

---

Cave Shuttle is a game for short sessions and replayable arcade challenges.

## Description — Deutsch

Flieg ein Raumschiff durch gefährliche Höhlen, rette die Frachtkugel und entkomme in den Weltraum.

Cave Shuttle ist ein physik-basiertes Arcade-Spiel über Präzisionsflug, Treibstoffmanagement und Impulskontrolle. Navigiere durch Höhlenlevel, weiche Wänden und feindlichem Feuer aus, docke die Frachtkugel an und bring sie zurück in den offenen Weltraum, um das Level abzuschließen.

FUNKTIONEN

- Physik-basierter Flug mit Schwerkraft, Trägheit und Impuls
- Mehrere Höhlenlevel mit unterschiedlichen Layouts und Gefahren
- Feindliche Bunker, Geschosse, Treibstoffdepots und Schiebetüren
- Einzelspieler-Modus
- Zwei-Spieler-Modus (lokal am selben Gerät oder über WLAN): Ein Spieler steuert das Schiff, der zweite Spieler steuert die Waffe und später im Spiel die Frachtkugel mit eigener Waffe und Antrieb
- Bonusleben
- Soundeffekte
- Benannte Highscores
- Zeitboni für schnelles Levelabschließen
- Eigene Level-Packs und integrierter Level-Editor mit Export-Funktion
- Lokaler Import und Export von Spielerdaten

SO WIRD GESPIELT

Verwende Touch-Buttons, einen virtuellen Joystick oder das Gyroskop für Beschleunigung, Rotation, Traktorstrahl und Feuern.

1. Flieg nah an die Frachtkugel heran.
2. Aktiviere den Traktorstrahl, um sie unter dem Schiff anzudocken.
3. Flieg mit der Frachtkugel nach oben in den Weltraum, um das Level abzuschließen.
4. Sammle mehr Punkte durch effizientes Fliegen, Treibstoff sammeln, Level-Elemente auslösen, Bunker zerstören und schnelles Abschließen.

HIGHSCORES

Wähle einen Spielernamen oder nutze den generierten. Jeder Level-Abschluss und jeder komplette Durchlauf wird mit detaillierter Punkte-Aufschlüsselung aufgezeichnet. Highscore-Tabellen sind nach Level, Level-Pack und 1- oder 2-Spieler-Modus getrennt, damit du genau weißt, wie deine Punkte entstanden sind.

---

Cave Shuttle ist ein Spiel für kurze Sessions und wiederspielbare Arcade-Herausforderungen.

## Screenshots

Benötigte Größen (App Store Connect, Stand iOS 26):

| Display | Pixel | Status |
|---------|-------|--------|
| 6,9″ iPhone (16/17 Pro Max) | 1290 × 2796 (portrait) oder 2796 × 1290 (landscape) | **Pflicht** — fehlt |
| 6,5″ iPhone (11 Pro Max Klasse) | 1284 × 2778 / 2778 × 1284 | optional, wenn 6,9″ vorhanden |
| 13″ iPad | 2048 × 2732 / 2732 × 2048 | **Pflicht**, da `UISupportedInterfaceOrientations~ipad` aktiv |

Das Spiel ist Landscape — Landscape-Screenshots sind erlaubt.

**Vorhandenes Material** (`dev/playstore/*.png`, 3017×1707 — falsches
Seitenverhältnis für Apple-Größen): `Screenshot_start` (Menü),
`Screenshot_level1`/`level3`/`level4`/`level6*` (Gameplay),
`Screenshot_level1_pod_docked` (angedockte Frachtkugel),
`Screenshot_multi`/`Screenshot_online game 1` (Zwei-Spieler),
`Screenshot_highscorescreen`, `Screenshot_tutorial`, `Screenshot_editor`.
→ Als Vorlage/Motivliste brauchbar, aber **neu aufnehmen** — Cropping auf
2796×1290 würde oben/unten beschneiden.

**Empfohlene Motivreihenfolge** (analog Play Store):
1. Hauptmenü (Titel + „Start Game")
2. Gameplay Level 1 (Schiff + Höhle)
3. Frachtkugel angedockt (Kernmechanik)
4. Level mit Bunker/Geschossen (Action)
5. Zwei-Spieler-Modus
6. Highscore-Screen

**Aufnahme auf dem Mac mini (iPhone 17-Simulator liegt ~6,3″):**
für die 6,9″-Pflicht einen „iPhone 17 Pro Max"-Simulator anlegen, falls die
Runtime ihn hergibt:

```bash
xcrun simctl list devicetypes | grep -i "pro max"
xcrun simctl create shot-6_9 \
  "com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max" \
  "com.apple.CoreSimulator.SimRuntime.iOS-26-5"
xcrun simctl boot shot-6_9
xcrun simctl install booted /path/to/App.app
xcrun simctl launch booted de.z11.caveshuttle
xcrun simctl io booted screenshot /var/tmp/shot1.png
```

Achtung: `simctl io screenshot` liefert Pixel-Genauigkeit im Device-Format —
bei Pro-Max-Geräten ist das 2796×1290 im Landscape. iPad-Variante analog mit
einem 13″-iPad-SimDeviceType.

**App Icon:** `dev/playstore/icon_512x512.png` existiert — für iOS ist das
Icon im Xcode-Projekt (`Assets.xcassets`, 1024×1024) schon drin; für den
Store-Eintrag selbst kein separater Upload nötig.

## Age Rating (Fragebogen)

Erwartete Antworten → voraussichtliches Rating **4+** (max. 9+):

| Frage | Antwort |
|-------|---------|
| Gewalt (cartoon/fantasy) | Ja — abstraktes Arcade-Schießen, Explosionen, feindliche Geschosse → **Infrequent/Mild** |
| Realistische Gewalt / Blut | Nein |
| Horror/Angst | Nein |
| Sexuelle Inhalte / Nacktheit | Nein |
| Alkohol / Tabak / Drogen | Nein |
| Glücksspiel / Contests / Lootboxen | Nein |
| Unrestricted Web Access | Nein (App lädt Level-Packs nur vom eigenen Server; kein Browser) |
| UGC (user-generated content) | Level-Editor existiert, aber Sharing nur dateibasiert (Export/Import) — kein in-app Feed/Chat → bei „Sharing of user content" Nein bzw. mild |
| Medizinische Themen / Profanity / Mature Themes | Nein |

## App Privacy (Datenschutz-Fragebogen in App Store Connect)

Basierend auf dem Play-Store-Data-Safety-Formular:

**„Sammelt die App Daten?"** → Ja (nur bei freiwilliger Online-Account-Nutzung
für Highscores; Offline-Spiel sammelt nichts)

**Datentypen (nur bei Account-Erstellung):**

| Kategorie | Daten | Linked to user | Tracking | Zweck |
|-----------|-------|----------------|----------|-------|
| Contact Info → Name | gewählter Spielername | Ja | Nein | App Functionality (Leaderboards) |
| Identifiers → User ID | Account-ID | Ja | Nein | App Functionality |
| User Content → Gameplay Content | Highscores, Score-Breakdowns | Ja | Nein | App Functionality |

**Alles andere: „Not Collected"**
- Keine Kontaktliste, kein Standort, keine Gesundheitsdaten
- Keine Browsing-/Suchhistorie
- Keine Nutzungsdaten-Analytics (kein Analytics-SDK vorhanden)
- Keine Crash-/Diagnosedaten (kein Crashlytics o.ä.)
- Keine Käufe (Paid-App ohne IAP)
- Kein Advertising/Tracking — „Does the app use data for tracking (ATT)?" → **Nein**, kein AppTrackingTransparency-Prompt nötig
- Kamera (QR-Scan): nur On-Device-Verarbeitung, keine Datenübertragung → kein Datentyp im Fragebogen

**Account-Löschung:** in der App vorhanden (Menü → „Delete account") → bei
„Can users delete their account?" unbedingt auf die In-App-Löschung verweisen
(Apple-Guideline 5.1.1 verlangt In-App-Deletion).

## App Review Information

- **Demo-Account:** nicht nötig — Kernspiel ohne Login; Online-Features optional
- **Notes für Reviewer** (Vorschlag):

  > Cave Shuttle works fully offline; online high-score accounts and local
  > Wi-Fi multiplayer are optional. The local multiplayer join feature may
  > request camera access solely to scan QR codes shown by the host device
  > (NSCameraUsageDescription included); a manual copy/paste join is also
  > available.

- **Content rights:** eigene Entwicklung, keine fremden Assets/Lizenzen nötig

## What's New (5.2)

EN: `- Each level has its own moon somewhere in the background`
    `- Adjustments for iOS`
DE: `- Jeder Level hat seinen eigenen Mond irgendwo im Hintergrund`
    `- Anpassungen für iOS`

## Noch zu erledigen (manuelle Schritte in ASC)

1. **Business:** Paid-Apps-Vertrag akzeptieren + IBAN + Steuerformulare → erst
   dann €1,99-Preis wählbar
2. Screenshots aufnehmen (6,9″ + 13″ iPad) und hochladen
3. Age-Rating-Fragebogen durchklicken (Antworten oben)
4. App-Privacy-Fragebogen ausfüllen (Antworten oben)
5. TestFlight-Build zuweisen sobald Processing fertig ist (Build 5.2 (15)
   wurde 2026-10-10 hochgeladen)
6. Build für Review einreichen
