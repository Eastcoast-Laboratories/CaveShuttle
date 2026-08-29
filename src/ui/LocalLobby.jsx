import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { capacitorManager } from '../capacitor/capacitor-manager.js'
import { useNetwork } from '../network/NetworkContext.jsx'
import { localLobbyTranslations } from '../i18n/localLobby.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import WebQrScanner from './WebQrScanner.jsx'
import './cave-theme.css'

function extractLocalIp(sdp) {
  if (!sdp) return null
  const matches = [...sdp.matchAll(/a=candidate:[^ ]+ \d+ udp \d+ ([\d.]+) /g)]
  for (const m of matches) {
    const ip = m[1]
    if (ip && !ip.startsWith('127.') && !ip.startsWith('0.') && !ip.startsWith('169.254')) {
      return ip
    }
  }
  return null
}

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
  wordBreak: 'break-all',
}

export default function LocalLobby({ onBack }) {
  const { manager, state } = useNetwork()
  const [view, setView] = useState('select')
  const [manualOffer, setManualOffer] = useState('')
  const [manualAnswer, setManualAnswer] = useState('')
  const [scanError, setScanError] = useState('')
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const { language } = useLanguage()
  const [copied, setCopied] = useState('')
  const [webScanMode, setWebScanMode] = useState(null)

  const t = localLobbyTranslations[language]
  const isNative = capacitorManager.isNativePlatform()

  const localIp = state.localOffer ? extractLocalIp(state.localOffer) : null

  async function handleCreateHost() {
    setCreating(true)
    try {
      await manager.createLocalLobby()
    } catch (e) {
      manager.addStatus(`${t.error}: ${e.message}`, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleScanOffer() {
    setScanError('')
    if (!isNative) {
      setWebScanMode('offer')
      return
    }
    try {
      const { granted } = await BarcodeScanner.requestPermissions()
      if (!granted) {
        setScanError(t.cameraRequired)
        return
      }
      const result = await new Promise((resolve, reject) => {
        document.body.classList.add('barcode-scanner-active')
        BarcodeScanner.addListener('barcodeScanned', async (scanResult) => {
          await BarcodeScanner.stopScan()
          document.body.classList.remove('barcode-scanner-active')
          resolve(scanResult.barcode?.rawValue || scanResult.barcode?.displayValue || scanResult.barcode)
        }).then(listener => {
          BarcodeScanner.startScan().catch(err => {
            document.body.classList.remove('barcode-scanner-active')
            reject(err)
          })
        })
      })
      setManualOffer(result)
    } catch (e) {
      setScanError(`${t.scanError}: ${e.message}`)
    } finally {
      document.body.classList.remove('barcode-scanner-active')
    }
  }

  async function handleConnectClient() {
    try {
      await manager.joinLocalLobby(manualOffer)
    } catch (e) {
      manager.addStatus(`${t.error}: ${e.message}`, 'error')
    }
  }

  async function handleConnectHostWithAnswer() {
    setConnecting(true)
    try {
      console.log('[LOCAL_LOBBY] Submitting answer SDP, length:', manualAnswer.length)
      await manager.provideLocalAnswer(manualAnswer)
      console.log('[LOCAL_LOBBY] Answer SDP accepted successfully')
    } catch (e) {
      console.error('[LOCAL_LOBBY] Failed to apply answer SDP:', e.message)
      manager.addStatus(`${t.error}: ${e.message}`, 'error')
    } finally {
      setConnecting(false)
    }
  }

  async function handleScanAnswer() {
    setScanError('')
    if (!isNative) {
      setWebScanMode('answer')
      return
    }
    try {
      const { granted } = await BarcodeScanner.requestPermissions()
      if (!granted) {
        setScanError(t.cameraRequired)
        return
      }
      const result = await new Promise((resolve, reject) => {
        document.body.classList.add('barcode-scanner-active')
        BarcodeScanner.addListener('barcodeScanned', async (scanResult) => {
          await BarcodeScanner.stopScan()
          document.body.classList.remove('barcode-scanner-active')
          resolve(scanResult.barcode?.rawValue || scanResult.barcode?.displayValue || scanResult.barcode)
        }).then(() => {
          BarcodeScanner.startScan().catch(err => {
            document.body.classList.remove('barcode-scanner-active')
            reject(err)
          })
        })
      })
      setManualAnswer(result)
      await manager.provideLocalAnswer(result)
    } catch (e) {
      setScanError(`${t.scanError}: ${e.message}`)
    } finally {
      document.body.classList.remove('barcode-scanner-active')
    }
  }

  async function handleCopy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    } catch (e) {
      manager.addStatus(t.copyFailed, 'error')
    }
  }

  useEffect(() => {
    return () => {
      document.body.classList.remove('barcode-scanner-active')
    }
  }, [])

  function renderWebScanner() {
    if (!webScanMode) return null
    return (
      <WebQrScanner
        onScan={handleWebScanResult}
        onError={handleWebScanError}
        onClose={() => setWebScanMode(null)}
      />
    )
  }

  function handleWebScanResult(value) {
    setWebScanMode(null)
    if (webScanMode === 'offer') {
      setManualOffer(value)
    } else if (webScanMode === 'answer') {
      setManualAnswer(value)
      manager.provideLocalAnswer(value)
    }
  }

  function handleWebScanError(msg) {
    setWebScanMode(null)
    setScanError(msg)
  }

  if (state.state === 'lobby' || state.state === 'ready' || state.state === 'playing') {
    return null
  }

  if (view === 'select') {
    return (
      <>
      <div className="cave-background cave-overlay">
        <div className="cave-panel cave-overlay-panel">
        <h2 style={{ margin: 0, fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0' }}>{t.title}</h2>
          <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
            {t.subtitle}
          </p>
          <button style={buttonBase} onClick={() => setView('host')}>{t.createHost}</button>
          <button style={buttonBase} onClick={() => setView('client')}>{t.joinClient}</button>
          <button style={secondaryButtonBase} onClick={onBack}>{t.back}</button>
        </div>
      </div>
      {renderWebScanner()}
      </>
    )
  }

  if (view === 'host') {
    return (
      <>
      <div className="cave-background cave-overlay">
        <div className="cave-panel cave-overlay-panel" style={{ maxWidth: '520px' }}>
        <h2 style={{ margin: 0, fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0' }}>{t.hostTitle}</h2>

          {!state.localOffer ? (
            <button style={buttonBase} onClick={handleCreateHost} disabled={creating}>
              {creating ? t.creating : t.createLobby}
            </button>
          ) : (
            <>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
                <QRCodeSVG value={state.localOffer} size={200} level="L" />
              </div>
              {localIp && (
                <p style={{ color: '#0f0', margin: 0, fontSize: '14px' }}>
                  {t.localIp}: {localIp}
                </p>
              )}
              <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
                {t.waitingLine1}<br />
                {t.waitingLine2}
              </p>
              <textarea
                readOnly
                value={state.localOffer}
                style={{ ...inputStyle, height: '80px', resize: 'none' }}
              />
              <button style={secondaryButtonBase} onClick={() => handleCopy(state.localOffer, 'offer')}>
                {copied === 'offer' ? t.copied : t.copy}
              </button>
              <hr style={{ borderColor: '#333', width: '100%' }} />
              <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
                {t.pasteAnswer}
              </p>
              <textarea
                value={manualAnswer}
                onChange={(e) => setManualAnswer(e.target.value)}
                placeholder={t.answerPlaceholder}
                style={{ ...inputStyle, height: '80px' }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button style={buttonBase} onClick={handleConnectHostWithAnswer} disabled={connecting || !manualAnswer}>{connecting ? '...' : t.connect}</button>
                <button style={secondaryButtonBase} onClick={handleScanAnswer}>{t.scanAnswer}</button>
              </div>
            </>
          )}

          {scanError && <p style={{ color: '#f66', fontSize: '12px' }}>{scanError}</p>}
          <button style={secondaryButtonBase} onClick={() => { manager.reset(); setView('select'); setManualAnswer('') }}>{t.back}</button>
        </div>
      </div>
      {renderWebScanner()}
      </>
    )
  }

  // client view
  return (
    <>
    <div className="cave-background cave-overlay">
      <div className="cave-panel cave-overlay-panel" style={{ maxWidth: '520px' }}>
        <h2 style={{ margin: 0, fontFamily: '"Commodore 64", "Courier New", monospace', color: '#0f0' }}>{t.clientTitle}</h2>

        {!state.connected && !state.localAnswer && (
          <>
            <p style={{ color: '#0f0', fontSize: '12px', textTransform: 'none' }}>
              {t.clientStep1}
            </p>
            <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
              {t.clientLine1}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={buttonBase} onClick={handleScanOffer}>{t.scanOffer}</button>
            </div>
            <textarea
              value={manualOffer}
              onChange={(e) => setManualOffer(e.target.value)}
              placeholder={t.offerPlaceholder}
              style={{ ...inputStyle, height: '100px' }}
            />
            <button style={buttonBase} onClick={handleConnectClient} disabled={!manualOffer}>{t.connect}</button>
          </>
        )}

        {state.localAnswer && !state.connected && (
          <>
            <p style={{ color: '#0f0', fontSize: '14px' }}>{t.clientStep2}</p>
            <p style={{ color: '#aaa', fontSize: '12px', textTransform: 'none' }}>
              {t.connected}
            </p>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
              <QRCodeSVG value={state.localAnswer} size={200} level="L" />
            </div>
            <textarea
              readOnly
              value={state.localAnswer}
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
            />
            <button style={secondaryButtonBase} onClick={() => handleCopy(state.localAnswer, 'answer')}>
              {copied === 'answer' ? t.copied : t.copy}
            </button>
          </>
        )}

        <button style={secondaryButtonBase} onClick={() => { manager.reset(); setView('select'); setManualOffer('') }}>{t.back}</button>
      </div>
      {renderWebScanner()}
    </div>
    </>
  )
}
