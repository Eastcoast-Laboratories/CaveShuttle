import React, { useEffect, useState } from 'react'
import { useNetwork } from '../network/NetworkContext.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { multiplayerTranslations } from '../i18n/multiplayer.js'
import './cave-theme.css'

const buttonBase = {
  padding: '12px 32px',
  fontSize: '14px',
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

const secondaryButtonBase = {
  ...buttonBase,
  background: 'linear-gradient(135deg, #333, #444)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
}

export default function LobbyRoom({ onStartGame, onLeave, onSyncHighscores }) {
  const { manager, state } = useNetwork()
  const { language } = useLanguage()
  const t = multiplayerTranslations[language] || multiplayerTranslations.en

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsubscribe = manager.on('game:start', () => {
      onStartGame?.(manager.role)
    })
    return unsubscribe
  }, [manager, onStartGame])

  const meReady = state.players.find(p => p.role === state.role)?.ready || false
  const allReady = state.players.length === 2 && state.players.every(p => p.ready)

  return (
    <div className="cave-background" style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 2000,
    }}>
      <div className="cave-panel" style={{
        width: '100%', maxWidth: '560px', padding: 'clamp(20px, 5vw, 40px)',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <h2 style={{
          margin: 0, textAlign: 'center', fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0'
        }}>
          {t.waitingRoom}
        </h2>

        {state.lobbyCode && state.players.length < 2 && !state.isPublic && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            padding: '12px 16px', background: '#111', border: '1px solid #333', borderRadius: '8px',
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
              {t.shareCodeHint}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: '#0f0',
                letterSpacing: '2px', padding: '4px 12px', background: '#000', borderRadius: '6px',
                border: '1px solid #333',
              }}>
                {state.lobbyCode}
              </span>
              <button
                style={{ ...buttonBase, padding: '8px 16px', fontSize: '12px' }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(state.lobbyCode)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    manager.addStatus('Code konnte nicht kopiert werden.', 'error')
                  }
                }}
              >
                {copied ? t.copied : t.copyCode}
              </button>
            </div>
          </div>
        )}

        {state.isPublic && state.players.length < 2 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            padding: '12px 16px', background: '#111', border: '1px solid #333', borderRadius: '8px',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0f0', textAlign: 'center' }}>
              {t.searchingOpponent}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {state.players.map((p, i) => (
            <div key={p.role} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: '#111', border: '1px solid #333', borderRadius: '8px',
            }}>
              <span style={{ color: '#fff' }}>
                {t.player} {i + 1} {p.role === 'host' ? `(${t.host})` : ''}
                {p.name ? `: ${p.name}` : ''}
              </span>
              <span style={{ color: p.ready ? '#0f0' : '#888' }}>
                {p.ready ? t.ready : t.waiting}
              </span>
            </div>
          ))}
          {state.players.length < 2 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: '#111', border: '1px dashed #333', borderRadius: '8px',
            }}>
              <span style={{ color: '#888' }}>{t.waitingPlayer2}</span>
              <span style={{ color: '#888' }}>{t.waiting}</span>
            </div>
          )}
        </div>

        <div style={{
          flex: 1, minHeight: '120px', maxHeight: '200px', overflowY: 'auto',
          background: '#000', border: '1px solid #333', borderRadius: '8px', padding: '12px',
          fontFamily: 'monospace', fontSize: '12px', color: '#aaa', textAlign: 'left',
        }}>
          {state.statusMessages.length === 0 && <div>{t.systemReady}</div>}
          {state.statusMessages.map(m => (
            <div key={m.id} style={{ color: m.type === 'error' ? '#f66' : m.type === 'success' ? '#0f0' : '#aaa', marginBottom: '4px' }}>
              {new Date(m.ts).toLocaleTimeString()}: {m.text}
            </div>
          ))}
        </div>

        {state.latency > 0 && (
          <p style={{ margin: 0, textAlign: 'center', color: '#0f0', fontSize: '12px' }}>
            {t.latency}: {state.latency} ms
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            style={{ ...buttonBase, background: meReady ? 'linear-gradient(135deg, #ffaa00, #cc8800)' : buttonBase.background }}
            onClick={() => manager.setReady(!meReady)}
          >
            {meReady ? t.notReady : t.ready}
          </button>

          {state.role === 'host' && (
            <button
              style={{ ...buttonBase, opacity: allReady ? 1 : 0.5, cursor: allReady ? 'pointer' : 'not-allowed' }}
              onClick={() => allReady && manager.startGame()}
              disabled={!allReady}
            >
              {t.startGame}
            </button>
          )}
        </div>

        {onSyncHighscores && state.players.length === 2 && (
          <button
            style={{ ...secondaryButtonBase, background: 'linear-gradient(135deg, #6644ff, #4422cc)' }}
            onClick={onSyncHighscores}
          >
            {t.syncHighscores}
          </button>
        )}

        <button style={secondaryButtonBase} onClick={onLeave}>{t.leaveLobby}</button>
      </div>
    </div>
  )
}
