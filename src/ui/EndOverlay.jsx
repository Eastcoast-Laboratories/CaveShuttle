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

  return (
    <div className="end-overlay">
      <div className="end-overlay-panel">
        <h1 className="end-overlay-title">{title}</h1>

        <div className="end-overlay-buttons">
          {buttons}
        </div>

        {showTotal && newHighscore && (newHighscore.level || newHighscore.run) && (
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
            {twoPlayer && hsName && (
              <div className="end-overlay-highscore-names">
                {hsName}{hsPlayer2Name ? ` & ${hsPlayer2Name}` : ''}
              </div>
            )}
          </div>
        )}

        {showTotal && !(newHighscore && (newHighscore.level || newHighscore.run)) && (
          <div className={`end-overlay-score-box${flash ? ' flash' : ''}`}>
            {totalLabel}: {total}
          </div>
        )}

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

      </div>
    </div>
  );
}
