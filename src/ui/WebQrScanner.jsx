import React, { useEffect, useRef, useState } from 'react'

// Web-based QR code scanner using getUserMedia + BarcodeDetector API.
// Used as a fallback when the native Capacitor BarcodeScanner is not available
// (i.e. when running in a regular browser instead of the native app).
export default function WebQrScanner({ onScan, onError, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let detector = null
    let cancelled = false

    async function start() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const msg = 'Camera not available. HTTPS is required for camera access. Use copy/paste instead.'
          console.error('[WEB_QR]', msg)
          setErrorMsg(msg)
          return
        }
        if (!('BarcodeDetector' in window)) {
          const msg = 'BarcodeDetector API not supported in this browser. Use copy/paste instead.'
          console.error('[WEB_QR]', msg)
          setErrorMsg(msg)
          return
        }
        detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        scanLoop()
      } catch (e) {
        console.error('[WEB_QR] Camera error:', e.message)
        setErrorMsg(`Camera error: ${e.message}`)
      }
    }

    function scanLoop() {
      if (cancelled || !detector || !videoRef.current) return
      rafRef.current = requestAnimationFrame(async () => {
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes && barcodes.length > 0) {
            const value = barcodes[0].rawValue || barcodes[0].displayValue
            if (value) {
              cleanup()
              setScanning(false)
              onScan(value)
              return
            }
          }
        } catch {
          // detect can throw if video is not ready yet; just retry
        }
        scanLoop()
      })
    }

    function cleanup() {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    start()
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setScanning(false)
    onClose()
  }

  if (!scanning) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {errorMsg ? (
        <div style={{ color: '#f66', fontSize: '16px', textAlign: 'center', padding: '20px', maxWidth: '400px' }}>
          {errorMsg}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              maxWidth: '500px',
              height: 'auto',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '220px',
              height: '220px',
              border: '3px solid #00ff88',
              borderRadius: '12px',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
            }}
          />
        </>
      )}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          bottom: '30px',
          padding: '12px 24px',
          fontSize: '16px',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        ✕ Close
      </button>
    </div>
  )
}
