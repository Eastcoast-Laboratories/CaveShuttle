# Highscore Rank Display at Game Over

Show the player's exact rank on the game over / level complete overlay. Rank 1 shows "New highscore" in gold. Ranks 2-10 show "Top 10! Rang N" in silver. Ranks >10 show the score in green with "(Rang N)" appended.

## Display Matrix

| Case | Text | Color | Box Style |
|------|------|-------|-----------|
| **Rank 1** | "★ NEUER HIGHSCORE: [Score] ★" | Gold (#ffd700) | Existing gold box, glow, flash animation |
| **Rank 2-10** | "Top 10! Rang N" + Score | Silver (#c0c0c0) | New silver box, silver border, clickable → highscores page |
| **Rank >10** | "Punkte: [Score] (Rang N)" | Green (#00ff88) | Existing green box + rank in parentheses |
| **No rank** | "Punkte: [Score]" | Green (#00ff88) | Existing green box (unchanged) |

Es mus snoch imm erbeides angezeigt werden, rang im run und Rang im level, für die auswertung ob god, silber oder grn gilt der höhere rang, level oder run. der andere wird klein darunter hingeschrieben

## Changes

### 1. HighScoreManager: add rank lookup methods
**File:** `src/game/high-score-manager.js`

Add two static methods next to `isLevelTop10`/`isRunTop10` (~line 316):
- `getLevelRank({ packId, packVersion, level, mode, attemptId })` — returns rank number (1-based) or null
  - Uses `getLevelRecords` (already returns all records with ranks, line 268-278)
  - Finds entry with matching `attemptId`, returns its `rank`
- `getRunRank({ packId, packVersion, mode, runId })` — returns rank number (1-based) or null
  - Needs to sort all run records (like `getRunTop10` but without `.slice(0, 10)`)
  - Find entry with matching `runId`, return its 1-based index + 1

### 2. App.jsx: include rank in newHighscore state
**File:** `src/App.jsx`

In `handleLevelComplete` (~line 422) and `handleGameOver` (~line 524):
- Change `hs` from `{ level: false, run: false }` to `{ level: false, run: false, levelRank: null, runRank: null }`
- After `isLevelTop10`/`isRunTop10` checks, call `getLevelRank`/`getRunRank` and store the rank number
- For game over (line 524): only `runRank` is relevant (no level highscore on game over)

### 3. EndOverlay: show rank or "New highscore"
**File:** `src/ui/EndOverlay.jsx`

Update the highscore display section (~line 105-133). Three cases:

**Rank 1 (existing behavior, unchanged):**
```jsx
{showTotal && newHighscore && (newHighscore.level || newHighscore.run) && (newHighscore.levelRank === 1 || newHighscore.runRank === 1) && (
  // existing gold highscore box
)}
```

**Rank 2-10 (new silver box):**
```jsx
{showTotal && newHighscore && (newHighscore.level || newHighscore.run) && (newHighscore.levelRank > 1 || newHighscore.runRank > 1) && (
  <div className="end-overlay-rank-box" onClick={onShowHighscores}>
    <span>Top 10! Rang {rank}</span>
    <span className="end-overlay-rank-score">{total}</span>
  </div>
)}
```

**Rank >10 or no highscore (green box, with rank if available):**
```jsx
{showTotal && !(newHighscore && (newHighscore.level || newHighscore.run) && (newHighscore.levelRank <= 10 || newHighscore.runRank <= 10)) && (
  <div className="end-overlay-score-box">
    {totalLabel}: {total}
    {rank > 10 && <span className="end-overlay-score-rank"> ({t.rank} {rank})</span>}
  </div>
)}
```

### 4. EndOverlay.css: add silver box style
**File:** `src/ui/EndOverlay.css`

Add after `.end-overlay-highscore-names` (~line 97):
```css
.end-overlay-rank-box {
  margin: 0 0 10px 0;
  padding: 8px 20px;
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(150, 150, 150, 0.15));
  border: 1px solid rgba(192, 192, 192, 0.4);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  cursor: pointer;
  color: #c0c0c0;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(192, 192, 192, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.end-overlay-rank-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(192, 192, 192, 0.3);
}

.end-overlay-rank-score {
  font-size: 22px;
  font-family: 'Commodore 64 Thin', monospace;
  font-weight: 700;
}

.end-overlay-score-rank {
  font-size: 16px;
  font-weight: normal;
  opacity: 0.8;
}
```

### 5. i18n: add rank display strings
**File:** `src/i18n/highscores.js`

Add to both `de` and `en`:
- de: `top10Rank: 'Top 10! Rang {rank}'`
- en: `top10Rank: 'Top 10! Rank {rank}'`

(`t.rank` already exists as "Rang" / "Rank" for the >10 case)

## Flow

1. Level complete or game over → `handleLevelComplete`/`handleGameOver` saves record
2. `isLevelTop10`/`isRunTop10` checks top 10 (existing)
3. NEW: `getLevelRank`/`getRunRank` gets exact rank number (1-based, can be >10)
4. `newHighscore` state now includes `{ level, run, levelRank, runRank }`
5. EndOverlay reads rank:
   - Rank 1 → gold "New highscore" box (existing)
   - Rank 2-10 → silver "Top 10! Rang N" box (new)
   - Rank >10 → green score box with "(Rang N)" appended
   - No rank → green score box (existing)

