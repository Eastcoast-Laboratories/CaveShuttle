# Changelog

## 3.4 — August 2026

- Network multiplayer: Level selection, next-level and restart synced between both players
- Highscores: Auto-sync of new records between players
- Touch controls: Joystick mode with tap-to-fire (short tap = fire, long press = joystick)
- POD button always visible, also in joystick-only mode
- Hamburger menu: Unified overlay styling and button click effects
- Bug fixes and general UI improvements


## 3.3 — August 2026

### Network Multiplayer

- **Level selection sync**: Starting a specific level from the menu now syncs to the other player — both start the same level
- **Next Level sync**: When one player presses "Next Level" after level complete, the other player also advances
- **Play Again sync**: Restarting after game over is synchronized between both players
- **Enemy mine sync**: Host streams authoritative mine positions to the client every 50ms; client no longer runs independent mine physics
- **Wormhole animation on client**: The wormhole effect (flying into the sky with the pod) now appears on both host and client, not just the host
- **Ship & pod explosion sync**: Explosion effects are mirrored on the other player's screen
- **Bunker bullet sync**: Host broadcasts bunker bullet spawns to the client
- **Shield & tractor beam sync**: Shield/tractor beam state is synchronized from host to client
- **Touch controls for multiplayer**: Role-based button visibility (host sees P1 controls, client sees P2 controls)

### Highscores

- **Auto-sync individual records**: After level complete or game over, only the new highscore record is sent to the peer (not the entire database)
- **Manual full sync**: The sync button in the lobby still sends the complete highscore database
- **Highscores page**: Accessible from game over and level complete screens
- **Own name highlighting**: Player's own entries are highlighted in the highscore tables (runs, levels overview, and level detail)
- **Player 2 name support**: Local multiplayer highscores store both player names

### Bug Fixes

- **Capacitor native detection**: Fixed `isCapacitor` detection that incorrectly identified local HTTPS dev as a native app, causing wrong server URL
- **Network event queue**: Non-bullet network events are no longer accidentally discarded
- **Sky area handling**: Area above level top is treated as valid empty space instead of erroring
- **Off-screen bullet cleanup**: Bullets traveling far off-screen are removed to prevent memory buildup
- **Language switcher visibility**: Hidden during gameover and level editor states

### Infrastructure

- **HTTPS dev server**: Auto-generated localhost certificates for local development
- **Geckos through nginx**: Production proxy setup via nginx same-origin
- **STUN servers**: Added Google STUN servers for WebRTC ICE negotiation
- **PM2 auto-restart**: Geckos server restarts automatically after deploy
- **QR scanner fallback**: Web-based QR scanner for non-native platforms
- **i18n support**: Global language context with translations for lobby and multiplayer UI
