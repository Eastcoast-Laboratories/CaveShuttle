import React, { useState, useEffect, useRef } from 'react';
import PlayerNameInput from './PlayerNameInput.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getHighscoreTranslations } from '../i18n/highscores.js';

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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.45)', zIndex: 1000, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px', background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.55), rgba(20, 20, 20, 0.65))', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(2px)', boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#00ff88', fontWeight: '800', fontSize: '48px', letterSpacing: '-2px', textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>{title}</h1>

        <div style={{ display: 'flex', gap: '15px' }}>
          {buttons}
        </div>

        {showTotal && newHighscore && (newHighscore.level || newHighscore.run) && (
          <div style={{
            margin: '0 0 10px 0',
            padding: '8px 20px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
            border: '1px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            alignItems: 'center',
            cursor: onShowHighscores ? 'pointer' : 'default',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onClick={onShowHighscores || undefined}
          onMouseEnter={(e) => { if (onShowHighscores) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 215, 0, 0.3)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ color: '#ffd700', fontSize: '20px', fontWeight: '800', textShadow: '0 0 10px rgba(255, 215, 0, 0.6)' }}>
              {'\u2605'} {t.newHighscore} {'\u2605'} {onShowHighscores ? '\u2192' : ''}
            </span>
            <div style={{ display: 'flex', gap: '4px', fontSize: '13px', color: '#fff' }}>
              {newHighscore.level && <span>{t.level} {levelNumber}</span>}
              {newHighscore.level && newHighscore.run && <span>&</span>}
              {newHighscore.run && <span>{t.run}</span>}
            </div>
            {twoPlayer && hsName && (
              <div style={{ fontSize: '14px', color: '#ffd700', fontWeight: '600' }}>
                {hsName}{hsPlayer2Name ? ` & ${hsPlayer2Name}` : ''}
              </div>
            )}
          </div>
        )}

        {playerName !== undefined && (
          <div style={{ marginBottom: '15px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fff', fontSize: '14px', whiteSpace: 'nowrap', width: '72px', textAlign: 'right' }}>{networkRole === 'host' ? t.player1 : t.yourName}</span>
              <PlayerNameInput 
                playerName={hsName || playerName} 
                onPlayerNameChange={onPlayerNameChange}
                readOnly={networkRole === 'host'}
              />
            </div>
            {twoPlayer && player2Name !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fff', fontSize: '14px', whiteSpace: 'nowrap', width: '72px', textAlign: 'right' }}>{networkRole === 'host' ? t.yourName : t.player2}</span>
                <PlayerNameInput 
                  playerName={hsPlayer2Name || player2Name} 
                  onPlayerNameChange={onPlayer2NameChange}
                  readOnly={networkRole !== 'host'}
                />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px', minWidth: '240px' }}>
          {breakdown.map((item, i) => (
            visibleRow >= i && (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', fontWeight: 'normal', textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)' }}>
                <span>{item.label}</span>
                <span>{displayedValues[i]}</span>
              </div>
            )
          ))}
        </div>

        {showTotal && (
          <div style={{
            margin: '10px 0 20px 0',
            padding: '8px 24px',
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 204, 102, 0.15))',
            border: '1px solid rgba(0, 255, 136, 0.4)',
            borderRadius: '12px',
            color: '#00ff88',
            fontSize: '22px',
            fontWeight: '700',
            textShadow: flash ? '0 0 12px #00ff88, 0 0 24px #00ff88' : '0 0 8px rgba(0, 255, 136, 0.4)',
            transition: 'text-shadow 0.35s ease'
          }}>
            {totalLabel}: {total}
          </div>
        )}
      </div>
    </div>
  );
}
