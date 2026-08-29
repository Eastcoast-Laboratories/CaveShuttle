# Plan: Browser-Level-Limit mit Play-Store-Hinweis

Spieler im Browser können nur bis zu einem definierbaren Level spielen.
Danach zeigt das EndOverlay einen Download-Hinweis statt „Next Level"
mit dem „Get it on Google Play"-Image wie auf der Startseite.

## Konstante

In `src/core/constants.js`:

```js
export const BROWSER_MAX_LEVEL = 2;
```

Native App: kein Limit. Browser: Level 1..`BROWSER_MAX_LEVEL` spielbar,
danach Download-CTA. Gilt für 1P und 2P (SP-Modus beachtet).

## Plattform-Erkennung (DRY)

`src/capacitor/capacitor-manager.js`Singleton `capacitorManager`:
- `isNativePlatform()`, `isWeb()`, `isAndroid()`, `isIOS()`
- `isAppleBrowser()` — iOS/macOS im Browser (iPad iOS 13+ inklusive)
- `isAndroidBrowser()` — Android im Browser
- `PLAY_STORE_URL` — zentral exportiert

## i18n-Strings

In `src/i18n/gameScreen.js`:

### Deutsch
- `browserLimitTitle`: 'Du hast Level {n} geschafft!'
- `browserLimitText`: 'Lade dir die App herunter, um alle {total} Level zu spielen.'
  (`{total}` wird dynamisch durch `levelCount` des aktuellen Packs ersetzt)
- `iosComingSoon`: 'iOS coming soon' (nur anzeigen bei `isAppleBrowser()`)
- `backToMenu`: existiert bereits in gameScreen.js
- `replay`: 'Nochmal' (neu, kürzer als playAgain)

### Englisch
- `browserLimitTitle`: 'You beat Level {n}!'
- `browserLimitText`: 'Download the app to play all {total} levels.'
- `iosComingSoon`: 'iOS coming soon' (nur anzeigen bei `isAppleBrowser()`)
- `replay`: 'Replay'

## EndOverlay-Anpassung in App.jsx

Wenn `gameState === 'levelcomplete'` && `capacitorManager.isWeb()` &&
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
│  [Get it on Google Play image]  │
│  iOS coming soon (nur auf Apple)│
│                                 │
│  [Back to Menu] [Replay]        │
└─────────────────────────────────┘
```

Buttons-Prop:
- Play-Store-Link (extern, target=_blank) mit „Get it on Google Play"-Image
- „iOS coming soon"-Text (nur bei `isAppleBrowser()`)
- „Back to Menu"-Button → `setGameState('menu')`
- „Replay"-Button → `handlePlayAgain()` (Level neu starten)

Sonst (native oder level < BROWSER_MAX_LEVEL): unverändert „Next Level".

## Dateien

| Datei | Änderung |
|---|---|
| `src/core/constants.js` | `BROWSER_MAX_LEVEL = 2` |
| `src/i18n/gameScreen.js` | Neue Strings: browserLimitTitle, browserLimitText, iosComingSoon, replay |
| `src/App.jsx` | Import capacitorManager + PLAY_STORE_URL, bedingte buttons-Prop |

## Keine Änderung an

- GameCanvas
- Spiellogik / Level-Lade-Logik
- Native-App-Verhalten (kein Limit)
- Level-Pack-Struktur

## Tests

- Unit-Test: i18n-Strings vorhanden in DE und EN
- Manuell: Browser-Level-2-Ende zeigt Download-CTA, native App zeigt „Next Level"
