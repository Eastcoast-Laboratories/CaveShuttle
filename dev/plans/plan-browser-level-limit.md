# Plan: Browser-Level-Limit mit Play-Store-Hinweis

Spieler im Browser können nur bis zu einem definierbaren Level spielen.
Danach zeigt das EndOverlay einen Download-Hinweis statt „Next Level".

## Konstante

In `src/core/constants.js`:

```js
export const BROWSER_MAX_LEVEL = 2;
```

Native App: kein Limit. Browser: Level 1..`BROWSER_MAX_LEVEL` spielbar,
danach Download-CTA.

## Plattform-Erkennung (DRY)

`src/capacitor/capacitor-manager.js` hat bereits `isNativePlatform()`,
`isWeb()`, `isAndroid()`, `isIOS()`. Neu hinzugefügt:

- `isAppleBrowser()` — erkennt iOS/macOS auch im Browser (iPad iOS 13+
  inklusive, da es als Mac mit Touch erkannt wird)
- `isAndroidBrowser()` — erkennt Android im Browser

`Menu.jsx` nutzt bereits seinen eigenen `isNativeApp`/`isWebBrowser`-Check.
Dieser kann auf `CapacitorManager` umgestellt werden (DRY), oder
`CapacitorManager` wird direkt in `App.jsx` verwendet.

`PLAY_STORE_URL` bleibt in `Menu.jsx` oder wird ebenfalls
exportiert (wird nur an zwei Stellen gebraucht).
ebenfalls exportiert (wird nur an zwei Stellen gebraucht).

## i18n-Strings

In `src/i18n/gameScreen.js`):

### Deutsch
- `browserLimitTitle`: 'Du hast Level {n} geschafft!'
- `browserLimitText`: 'Lade dir die App herunter, um alle {total} Level zu spielen.'
- `getOnPlayStore`: 'Jetzt im Google Play Store'
- `iosComingSoon`: 'iOS coming soon' (nur anzeigen bei `isAppleBrowser()`)
- `backToMenu`: existiert bereits in gameScreen.js

### Englisch
- `browserLimitTitle`: 'You beat Level {n}!'
- `browserLimitText`: 'Download the app to play all {total} levels.'
- `getOnPlayStore`: 'Get it on Google Play'
- `iosComingSoon`: 'iOS coming soon' (nur anzeigen bei `isAppleBrowser()`)

## EndOverlay-Anpassung in App.jsx

Wenn `gameState === 'levelcomplete'` && `isWebBrowser` &&
`level >= BROWSER_MAX_LEVEL`:

Statt „Next Level"-Button:

```
┌─────────────────────────────────┐
│  Level Complete                 │
│  [Score Breakdown]              │
│                                 │
│  Du hast Level 2 geschafft!     │
│  Lade dir die App herunter,     │
│  um alle 7 Level zu spielen.    │
│                                 │
│  [Get it on Google Play]        │
│  iOS coming soon                │
│                                 │
│  [Back to Menu] [Replay]        │
└─────────────────────────────────┘
```

Buttons-Prop:
- Play-Store-Link (extern, target=_blank)
- „iOS coming soon"-Text
- „Back to Menu"-Button → `setGameState('menu')`
- „Replay"-Button → `handlePlayAgain()` (Level neu starten)

Sonst (native oder level < BROWSER_MAX_LEVEL): unverändert „Next Level".

## Dateien

| Datei | Änderung |
|---|---|
| `src/core/constants.js` | `BROWSER_MAX_LEVEL = 2` |
| `src/core/platform.js` | Neu: `isNativeApp`, `isWebBrowser` |
| `src/ui/Menu.jsx` | Import aus `platform.js` statt lokaler Definition |
| `src/i18n/menu.js` | Neue Strings: browserLimitTitle, browserLimitText, getOnPlayStore, iosComingSoon |
| `src/App.jsx` | Bedingte `buttons`-Prop für Browser-Limit |

## Keine Änderung an

- GameCanvas
- Spiellogik / Level-Lade-Logik
- Native-App-Verhalten (kein Limit)
- Level-Pack-Struktur

## Tests

- Unit-Test: `platform.js` exportiert `isNativeApp` und `isWebBrowser`
- Unit-Test: i18n-Strings vorhanden in DE und EN
- Manuell: Browser-Level-2-Ende zeigt Download-CTA, native App zeigt „Next Level"
