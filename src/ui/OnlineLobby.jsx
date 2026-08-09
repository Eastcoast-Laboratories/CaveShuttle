import React, { useState, useEffect } from 'react'
import { useNetwork } from '../network/NetworkContext.jsx'
import { HighScoreManager } from '../game/high-score-manager.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { multiplayerTranslations } from '../i18n/multiplayer.js'
import { Capacitor } from '@capacitor/core'
import './cave-theme.css'

const buttonBase = {
  padding: '12px 24px',
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

const inputStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '14px',
  fontFamily: 'monospace',
  background: '#111',
  color: '#0f0',
  border: '1px solid #6ee66ec5',
  borderRadius: '8px',
  boxSizing: 'border-box',
}

const isCapacitorNative = typeof window !== 'undefined'
  && typeof Capacitor !== 'undefined'
  && Capacitor.isNativePlatform?.()

const PRODUCTION_SERVER_URL = 'https://caveshuttle.z11.de'

function defaultServerUrl() {
  if (typeof window === 'undefined') return 'http://localhost'
  if (isCapacitorNative) return PRODUCTION_SERVER_URL
  return `${window.location.protocol}//${window.location.hostname}`
}

export default function OnlineLobby({ onBack }) {
  const { manager, state } = useNetwork()
  const { language } = useLanguage()
  const t = multiplayerTranslations[language] || multiplayerTranslations.en
  const [view, setView] = useState('select')
  const [serverUrl, setServerUrl] = useState(defaultServerUrl())
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [publicLobbyAvailable, setPublicLobbyAvailable] = useState(false)

  useEffect(() => {
    if (view !== 'select') return
    let cancelled = false
    async function checkPublicLobby() {
      try {
        const isLocalhostDev = window.location.hostname === 'localhost' && !isCapacitorNative
        const url = isLocalhostDev
          ? `${serverUrl.replace(/\/$/, '')}:9208/public-lobby`
          : `${serverUrl.replace(/\/$/, '')}/public-lobby`
        const res = await fetch(url)
        if (!cancelled && res.ok) {
          const data = await res.json()
          setPublicLobbyAvailable(!!data.available)
        }
      } catch {
        // Server may not support the endpoint; default to false
      }
    }
    checkPublicLobby()
    const interval = setInterval(checkPublicLobby, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [view, serverUrl])

  async function handleCreatePrivate() {
    try {
      const name = HighScoreManager.getPlayerProfile().name
      await manager.createOnlineLobby(serverUrl, undefined, false, name)
    } catch (e) {
      manager.addStatus(`Fehler: ${e.message}`, 'error')
    }
  }

  async function handleRandomMatch() {
    try {
      const name = HighScoreManager.getPlayerProfile().name
      await manager.joinRandomOnlineLobby(serverUrl, undefined, name)
    } catch (e) {
      manager.addStatus(`Fehler: ${e.message}`, 'error')
    }
  }

  async function handleJoin() {
    try {
      const name = HighScoreManager.getPlayerProfile().name
      await manager.joinOnlineLobby(serverUrl, undefined, joinCode, name)
    } catch (e) {
      manager.addStatus(`Fehler: ${e.message}`, 'error')
    }
  }

  async function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}#multiplayer?code=${state.lobbyCode}&server=${encodeURIComponent(serverUrl)}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      manager.addStatus('Link konnte nicht kopiert werden.', 'error')
    }
  }

  if (state.state === 'lobby' || state.state === 'ready' || state.state === 'playing') {
    return null
  }

  if (view === 'select') {
    return (
      <div className="cave-background" style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', zIndex: 2000,
      }}>
        <div className="cave-panel" style={{
          textAlign: 'center', padding: 'clamp(20px, 5vw, 40px)', maxWidth: '480px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          <h2 style={{ margin: 0, fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0' }}>{t.onlineTitle}</h2>
          <label style={{ textAlign: 'left', fontSize: '12px', color: '#aaa' }}>
            {t.serverUrl}
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              style={{ ...inputStyle, marginTop: '6px' }}
            />
          </label>
          <button style={buttonBase} onClick={() => publicLobbyAvailable ? handleCreatePrivate() : setView('host')}>{publicLobbyAvailable ? t.createPrivate : t.createGame}</button>
          {publicLobbyAvailable ? (
            <>
              <button style={buttonBase} onClick={handleRandomMatch}>{t.joinRandomGame}</button>
              <p style={{ margin: '-8px 0 0 0', fontSize: '11px', color: '#aaa', textTransform: 'none' }}>{t.joinRandomGameDesc}</p>
            </>
          ) : (
            <>
              <button style={buttonBase} onClick={handleRandomMatch}>{t.createRandomGame}</button>
              <p style={{ margin: '-8px 0 0 0', fontSize: '11px', color: '#aaa', textTransform: 'none' }}>{t.createRandomGameDesc}</p>
            </>
          )}
          <button style={buttonBase} onClick={() => setView('client')}>{t.joinGame}</button>
          <button style={secondaryButtonBase} onClick={onBack}>{t.back}</button>
        </div>
      </div>
    )
  }

  if (view === 'host') {
    return (
      <div className="cave-background" style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', zIndex: 2000,
      }}>
        <div className="cave-panel" style={{
          textAlign: 'center', padding: 'clamp(20px, 5vw, 40px)', maxWidth: '480px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          <h2 style={{ margin: 0, fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0' }}>{t.onlineHost}</h2>
          {!state.lobbyCode ? (
            <>
              <button style={buttonBase} onClick={handleCreatePrivate}>{t.createPrivate}</button>
              <p style={{ margin: '-8px 0 0 0', fontSize: '11px', color: '#aaa', textTransform: 'none' }}>{t.createPrivateDesc}</p>
              <button style={buttonBase} onClick={handleRandomMatch}>{t.randomMatch}</button>
              <p style={{ margin: '-8px 0 0 0', fontSize: '11px', color: '#aaa', textTransform: 'none' }}>{t.randomMatchDesc}</p>
            </>
          ) : state.isPublic ? (
            <>
              <p style={{ color: '#0f0', fontSize: '16px', margin: 0 }}>{t.searchingOpponent}</p>
              <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
                {state.players.length < 2 ? t.waitingPlayer2Join : t.player2Joined}
              </p>
            </>
          ) : (
            <>
              <p style={{ color: '#0f0', fontSize: '18px', margin: 0 }}>{t.lobbyCode}: {state.lobbyCode}</p>
              <button style={buttonBase} onClick={copyLink}>{copied ? t.copied : t.copyLink}</button>
              <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
                {state.players.length < 2 ? t.waitingPlayer2Join : t.player2Joined}
              </p>
            </>
          )}
          <button style={secondaryButtonBase} onClick={() => { manager.reset(); setView('select') }}>{t.back}</button>
        </div>
      </div>
    )
  }

  // client view
  return (
    <div className="cave-background" style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 2000,
    }}>
      <div className="cave-panel" style={{
        textAlign: 'center', padding: 'clamp(20px, 5vw, 40px)', maxWidth: '480px', width: '100%',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <h2 style={{ margin: 0, fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0' }}>{t.onlineJoin}</h2>
        <label style={{ textAlign: 'left', fontSize: '12px', color: '#aaa' }}>
          {t.serverUrl}
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            style={{ ...inputStyle, marginTop: '6px' }}
          />
        </label>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder={t.lobbyCodePlaceholder}
          maxLength={5}
          style={{ ...inputStyle, textAlign: 'center', fontSize: '18px' }}
        />
        <button style={buttonBase} onClick={handleJoin} disabled={joinCode.length < 4}>{t.join}</button>
        <button style={secondaryButtonBase} onClick={() => { manager.reset(); setView('select') }}>{t.back}</button>
      </div>
    </div>
  )
}
