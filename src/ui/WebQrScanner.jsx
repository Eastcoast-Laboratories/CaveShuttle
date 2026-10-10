import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

// Web-based QR code scanner using getUserMedia.
// Detection uses the native BarcodeDetector API where available (Chromium)
// and falls back to jsQR canvas decoding elsewhere — iOS WKWebView has no
// BarcodeDetector, so the jsQR path is what runs on iOS.
export default function WebQrScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let detector = null
    let canvas = null
    let ctx = null
    let cancelled = false

    async function start() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const msg = 'Camera not available. Use copy/paste instead.'
          console.error('[WEB_QR]', msg)
          setErrorMsg(msg)
          return
        }
        if ('BarcodeDetector' in window) {
          detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        } else {
          console.log('[WEB_QR] BarcodeDetector unavailable, using jsQR fallback')
          canvas = document.createElement('canvas')
          ctx = canvas.getContext('2d', { willReadFrequently: true })
        }
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

    function detectJsQr() {
      const video = videoRef.current
      if (!video || !ctx || video.readyState < 2 || !video.videoWidth) return null
      const scale = Math.min(1, 640 / video.videoWidth)
      const w = Math.max(1, Math.floor(video.videoWidth * scale))
      const h = Math.max(1, Math.floor(video.videoHeight * scale))
      canvas.width = w
      canvas.height = h
      ctx.drawImage(video, 0, 0, w, h)
      const img = ctx.getImageData(0, 0, w, h)
      const code = jsQR(img.data, w, h)
      return code?.data || null
    }

    function scanLoop() {
      if (cancelled || !videoRef.current) return
      rafRef.current = requestAnimationFrame(async () => {
        try {
          let value = null
          if (detector) {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes && barcodes.length > 0) {
              value = barcodes[0].rawValue || barcodes[0].displayValue
            }
          } else {
            value = detectJsQr()
          }
          if (value) {
            cleanup()
            setScanning(false)
            onScan(value)
            return
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
