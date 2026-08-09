import React, { useEffect, useState } from 'react';
import Impressum from './Impressum';
import Datenschutz from './Datenschutz';
import AccountDeletion from './AccountDeletion';
import HighscoresPage from './HighscoresPage';
import { ENABLE_LEVEL_EDITOR } from '../core/constants.js';
import './cave-theme.css';

function getLegalPageFromHash() {
  const hash = window.location.hash.replace(/^#/, '').replace(/^\//, '').toLowerCase();
  if (hash === 'impressum' || hash === 'imprint') return 'impressum';
  if (hash === 'datenschutz' || hash === 'privacy' || hash === 'privacypolicy') return 'datenschutz';
  if (hash === 'account-deletion' || hash === 'accountdeletion' || hash === 'deleteaccount') return 'account-deletion';
  if (hash === 'highscores' || hash === 'highscore') return 'highscores';
  return null;
}

function setLegalPageHash(page) {
  if (!page) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }
  window.location.hash = `#/${page}`;
}

export default function Menu({ onStart, onMultiplayer, onOpenLevelEditor, installedPacks, currentPackId, twoPlayer = false, onTogglePlayerMode }) {
  const [legalPage, setLegalPage] = useState(() => getLegalPageFromHash());

  // Sync legal page when the URL hash changes (e.g. browser back/forward).
  useEffect(() => {
    const handleHashChange = () => {
      setLegalPage(getLegalPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Allow starting the game with Space or Enter, open the editor with E
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onStart(twoPlayer);
      } else if (ENABLE_LEVEL_EDITOR && (e.key === 'e' || e.key === 'E') && onOpenLevelEditor) {
        e.preventDefault();
        onOpenLevelEditor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, onOpenLevelEditor, twoPlayer]);

  if (legalPage === 'impressum') {
    return <Impressum onBack={() => { setLegalPage(null); setLegalPageHash(null); }} />;
  }
  if (legalPage === 'datenschutz') {
    return <Datenschutz onBack={() => { setLegalPage(null); setLegalPageHash(null); }} />;
  }
  if (legalPage === 'account-deletion') {
    return <AccountDeletion onBack={() => { setLegalPage(null); setLegalPageHash(null); }} />;
  }
  if (legalPage === 'highscores') {
    return <HighscoresPage onBack={() => { setLegalPage(null); setLegalPageHash(null); }} onPlay={onStart} installedPacks={installedPacks || []} currentPackId={currentPackId} twoPlayer={twoPlayer} />;
  }

  return (
    <div id="menu" className="cave-background" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      position: 'relative',
      padding: '20px',
    }}>
      <div id="menu-content" className="cave-panel" style={{
        textAlign: 'center',
        padding: 'clamp(20px, 5vw, 60px)',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(20px, 5vw, 40px)',
        margin: 'auto',
        position: 'relative',
      }}>
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 48px)',
          fontWeight: '400',
          margin: '0',
          fontFamily: '"Commodore 64", "Courier New", monospace',
          background: 'linear-gradient(135deg, #00ff88, #00ccff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '2px',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          lineHeight: '1.4',
        }}>
          CAVE SHUTTLE
        </h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => onStart(twoPlayer)}
            style={{
              padding: 'clamp(12px, 3vw, 20px) clamp(24px, 6vw, 60px)',
              fontSize: 'clamp(12px, 3vw, 18px)',
              fontWeight: '600',
              fontFamily: '"Commodore 64", "Courier New", monospace',
              color: '#fff',
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 136, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.3)';
            }}
          >
            START GAME
          </button>

          {twoPlayer && (
            <button
              onClick={() => onMultiplayer?.()}
              style={{
                padding: 'clamp(12px, 3vw, 20px) clamp(24px, 6vw, 60px)',
                fontSize: 'clamp(12px, 3vw, 18px)',
                fontWeight: '600',
                fontFamily: '"Commodore 64", "Courier New", monospace',
                color: '#fff',
                background: 'linear-gradient(135deg, #6644ff, #4422cc)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(102, 68, 255, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 30px rgba(102, 68, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 20px rgba(102, 68, 255, 0.3)'
              }}
            >
              Multiplayer
            </button>
          )}

          <div
            onClick={() => onTogglePlayerMode && onTogglePlayerMode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{
              width: '160px',
              height: '36px',
              backgroundColor: '#333',
              borderRadius: '18px',
              border: '1px solid #00ff88',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: twoPlayer ? '30%' : '70%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: '"Commodore 64", "Courier New", monospace',
                zIndex: 0,
              }}>
                1
              </div>
              <div style={{
                position: 'absolute',
                left: twoPlayer ? '30%' : '70%',
                top: 0,
                bottom: 0,
                width: twoPlayer ? '70%' : '30%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: '"Commodore 64", "Courier New", monospace',
                zIndex: 0,
              }}>
                2
              </div>
              <div style={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                left: twoPlayer ? 'calc(30% + 2px)' : '2px',
                width: 'calc(70% - 4px)',
                backgroundColor: '#00aa66',
                borderRadius: '14px',
                transition: 'left 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '600',
                fontSize: '12px',
                fontFamily: '"Commodore 64", "Courier New", monospace',
                zIndex: 1,
                whiteSpace: 'nowrap',
              }}>
                {twoPlayer ? '2 Player' : '1 Player'}
              </div>
            </div>
          </div>
        </div>

        <p style={{
          fontSize: 'clamp(12px, 3vw, 18px)',
          fontFamily: '"Commodore 64 Thin", "Courier New", monospace',
          fontWeight: '400',
          margin: '0',
          color: '#aaa',
          letterSpacing: '1px',
        }}>
          Collect the Pod and escape the Caves
        </p>

        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={() => { setLegalPage('impressum'); setLegalPageHash('impressum'); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(110, 230, 110, 0.5)',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '0',
              fontFamily: 'inherit',
            }}
          >
            Imprint
          </button>
          <button
            onClick={() => { setLegalPage('datenschutz'); setLegalPageHash('datenschutz'); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(110, 230, 110, 0.5)',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '0',
              fontFamily: 'inherit',
            }}
          >
            Privacy
          </button>
          <button
            onClick={() => { setLegalPage('account-deletion'); setLegalPageHash('account-deletion'); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(110, 230, 110, 0.5)',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '0',
              fontFamily: 'inherit',
            }}
          >
            Delete account
          </button>
        </div>
        <button
          onClick={() => { setLegalPage('highscores'); setLegalPageHash('highscores'); }}
          style={{
            background: 'none',
            border: '1px solid #6ee66ec5',
            color: '#6ee66ec5',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 2.5vw, 16px)',
            padding: '6px 16px',
            borderRadius: '8px',
            fontFamily: 'inherit',
            fontWeight: 'bold',
          }}
        >
          HIGHSCORES
        </button>
      </div>
    </div>
  );
}
