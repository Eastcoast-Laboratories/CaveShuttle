import React, { useState, useEffect, useRef } from 'react';
import PlayerNameInput from './PlayerNameInput.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getHighscoreTranslations } from '../i18n/highscores.js';
import './EndOverlay.css';

const ROW_DURATION = 500; // ms each row counts up
const ROW_DELAY = 300; // ms between rows
const TOTAL_FLASH_DURATION = 600; // ms the total flashes

export default function EndOverlay({ title, breakdown, total, totalLabel, buttons, playerName, onPlayerNameChange, player2Name, onPlayer2NameChange, newHighscore, twoPlayer, levelNumber, networkRole, hsName, hsPlayer2Name, onShowHighscores }) {
  const { language } = useLanguage();
  const t = getHighscoreTranslations(language);
  const [visibleRow, setVisibleRow] = useState(-1);
  const [displayedValues, setDisplayedValues] = useState(() => breakdown.map(() => 0));
  const [showTotal, setShowTotal] = useState(false);
  const [flash, setFlash] = useState(false);
  const animationRef = useRef({ timers: [], interval: null });

  useEffect(() => {
    // Clean up any previous animation
    animationRef.current.timers.forEach(clearTimeout);
    if (animationRef.current.interval) clearInterval(animationRef.current.interval);
    animationRef.current.timers = [];
    animationRef.current.interval = null;

    setVisibleRow(-1);
    setDisplayedValues(breakdown.map(() => 0));
    setShowTotal(false);
    setFlash(false);

    if (breakdown.length === 0) {
      setShowTotal(true);
      return;
    }

    const startRow = (index) => {
      if (index >= breakdown.length) {
        const totalTimer = setTimeout(() => {
          setShowTotal(true);
          setFlash(true);
          const flashTimer = setTimeout(() => setFlash(false), TOTAL_FLASH_DURATION);
          animationRef.current.timers.push(flashTimer);
        }, ROW_DELAY);
        animationRef.current.timers.push(totalTimer);
        return;
      }

      setVisibleRow(index);
      const finalValue = breakdown[index].value;

      if (typeof finalValue === 'string') {
        setDisplayedValues((prev) => {
          const next = [...prev];
          next[index] = finalValue;
          return next;
        });
        const nextTimer = setTimeout(() => startRow(index + 1), ROW_DELAY);
        animationRef.current.timers.push(nextTimer);
        return;
      }

      const start = Date.now();
      animationRef.current.interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(1, elapsed / ROW_DURATION);
        const current = Math.round(finalValue * progress);
        setDisplayedValues((prev) => {
          const next = [...prev];
          next[index] = current;
          return next;
        });
        if (progress >= 1) {
          clearInterval(animationRef.current.interval);
          animationRef.current.interval = null;
          setDisplayedValues((prev) => {
            const next = [...prev];
            next[index] = finalValue;
            return next;
          });
          const nextTimer = setTimeout(() => startRow(index + 1), ROW_DELAY);
          animationRef.current.timers.push(nextTimer);
        }
      }, 20);
    };

    const initialTimer = setTimeout(() => startRow(0), 300);
    animationRef.current.timers.push(initialTimer);

    return () => {
      animationRef.current.timers.forEach(clearTimeout);
      if (animationRef.current.interval) clearInterval(animationRef.current.interval);
    };
  }, [breakdown]);

  // Compute rank display info from newHighscore (no rank for zero score)
  const levelRank = (total > 0 && newHighscore?.levelRank != null) ? newHighscore.levelRank : null;
  const runRank = (total > 0 && newHighscore?.runRank != null) ? newHighscore.runRank : null;

  // Determine primary (better = lower number) and secondary rank
  let bestRank = null;
  let bestType = null;
  let secondaryRank = null;
  let secondaryType = null;

  if (levelRank != null && runRank != null) {
    if (levelRank <= runRank) {
      bestRank = levelRank;
      bestType = 'level';
      secondaryRank = runRank;
      secondaryType = 'run';
    } else {
      bestRank = runRank;
      bestType = 'run';
      secondaryRank = levelRank;
      secondaryType = 'level';
    }
  } else if (levelRank != null) {
    bestRank = levelRank;
    bestType = 'level';
  } else if (runRank != null) {
    bestRank = runRank;
    bestType = 'run';
  }

  const subRankLabel = secondaryRank != null
    ? (secondaryType === 'level'
        ? `${t.level} ${levelNumber}: ${t.rank} ${secondaryRank}`
        : `${t.run}: ${t.rank} ${secondaryRank}`)
    : null;

  return (
    <div className="end-overlay">
      <div className="end-overlay-panel">
        <h1 className="end-overlay-title">{title}</h1>

        <div className="end-overlay-buttons">
          {buttons}
        </div>

        {showTotal && bestRank === 1 && (
          <div
            className={`end-overlay-highscore-box${onShowHighscores ? '' : ' no-click'}`}
            onClick={onShowHighscores || undefined}
          >
            <span className="end-overlay-highscore-label">
              {'\u2605'} {t.newHighscore}:&nbsp;
              <span className={`end-overlay-highscore-value${flash ? ' flash' : ''}`}>
                {total}
              </span> {'\u2605'}
            </span>
            <div className="end-overlay-highscore-detail">
              {newHighscore.level && <span>{t.level} {levelNumber}</span>}
              {newHighscore.level && newHighscore.run && <span>&</span>}
              {newHighscore.run && <span>{t.run}</span>}
            </div>
            {subRankLabel && (
              <div className="end-overlay-sub-rank">{subRankLabel}</div>
            )}
            {twoPlayer && hsName && (
              <div className="end-overlay-highscore-names">
                {hsName}{hsPlayer2Name ? ` & ${hsPlayer2Name}` : ''}
              </div>
            )}
          </div>
        )}

        {showTotal && bestRank != null && bestRank >= 2 && bestRank <= 10 && (
          <div
            className={`end-overlay-rank-box${onShowHighscores ? '' : ' no-click'}`}
            onClick={onShowHighscores || undefined}
          >
            <span className="end-overlay-rank-label">
              {t.top10Rank.replace('{rank}', bestRank)}
            </span>
            <span className={`end-overlay-rank-score${flash ? ' flash' : ''}`}>
              {total}
            </span>
            {subRankLabel && (
              <div className="end-overlay-sub-rank">{subRankLabel}</div>
            )}
          </div>
        )}

        {showTotal && (bestRank === null || bestRank > 10) && (
          <div className={`end-overlay-score-box${flash ? ' flash' : ''}`}>
            <span>{totalLabel}: {total}{bestRank != null && <span className="end-overlay-score-rank"> ({t.rank} {bestRank})</span>}</span>
            {subRankLabel && (
              <div className="end-overlay-sub-rank">{subRankLabel}</div>
            )}
          </div>
        )}

        
        <div className="end-overlay-breakdown">
          {breakdown.map((item, i) => (
            visibleRow >= i && (
              <div key={item.key} className="end-overlay-breakdown-row">
                <span>{item.label}</span>
                <span>{displayedValues[i]}</span>
              </div>
            )
          ))}
        </div>

        {playerName !== undefined && (
          <div className="end-overlay-player-names">
            <div className="end-overlay-player-row">
              <span className="end-overlay-player-label">{networkRole === 'host' ? t.player1 : t.yourName}</span>
              <PlayerNameInput
                playerName={hsName || playerName}
                onPlayerNameChange={onPlayerNameChange}
                readOnly={networkRole === 'host'}
              />
            </div>
            {twoPlayer && player2Name !== undefined && (
              <div className="end-overlay-player-row">
                <span className="end-overlay-player-label">{networkRole === 'host' ? t.yourName : t.player2}</span>
                <PlayerNameInput
                  playerName={hsPlayer2Name || player2Name}
                  onPlayerNameChange={onPlayer2NameChange}
                  readOnly={networkRole !== 'host'}
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
