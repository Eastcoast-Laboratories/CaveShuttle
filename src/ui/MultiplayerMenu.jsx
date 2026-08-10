import React from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { multiplayerTranslations } from '../i18n/multiplayer.js'
import './cave-theme.css'

export default function MultiplayerMenu({ onLocal, onOnline, onBack }) {
  const { language } = useLanguage()
  const t = multiplayerTranslations[language] || multiplayerTranslations.en

  const buttonStyle = {
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
    textTransform: 'uppercase',
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #333, #444)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  }

  return (
    <div className="cave-background cave-overlay">
      <div className="cave-panel cave-overlay-panel" style={{ gap: '24px' }}>
        <h2 style={{
          fontSize: 'clamp(18px, 4vw, 32px)',
          margin: 0,
          fontFamily: '"Commodore 64", "Courier New", monospace',
          background: 'linear-gradient(135deg, #00ff88, #00ccff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '2px',
        }}>
          {t.multiplayer}
        </h2>

        <button
          onClick={onLocal}
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 136, 0.5)' }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.3)' }}
        >
          {t.localGame}
        </button>

        <button
          onClick={onOnline}
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 136, 0.5)' }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.3)' }}
        >
          {t.onlineGame}
        </button>

        <button
          onClick={onBack}
          style={secondaryButtonStyle}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.5)' }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)' }}
        >
          {t.back}
        </button>
      </div>
    </div>
  )
}
