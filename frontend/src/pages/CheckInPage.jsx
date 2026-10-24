import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Check, QrCode, Upload } from 'lucide-react'
import { api } from '../lib/api.js'
import { GUEST_CAPACITY } from '../config.js'
import '../styles/checkin.css'

const SCANNER_ELEMENT_ID = 'gate-scanner'

export default function CheckInPage() {
  const scannerRef = useRef(null)
  const startCameraRef = useRef(null)
  const processingRef = useRef(false)
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')
  const [totalCheckedIn, setTotalCheckedIn] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [processingFile, setProcessingFile] = useState(false)

  useEffect(() => {
    let mounted = true
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner

    async function startCamera() {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          handleScanSuccess,
          () => {}
        )
        if (mounted) {
          setScanning(true)
        } else if (scanner.isScanning) {
          await scanner.stop()
        }
      } catch (err) {
        if (mounted) {
          setScanning(false)
          setError(`Camera access failed: ${err.message || err}. You can upload a QR image instead.`)
        }
      } finally {
        if (mounted) setScannerReady(true)
      }
    }

    startCameraRef.current = startCamera
    startCamera()

    return () => {
      mounted = false
      startCameraRef.current = null
      if (scanner.isScanning) {
        scanner.stop().catch((err) => console.error('Could not stop QR scanner:', err))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleScanSuccess(decodedText) {
    if (processingRef.current) return
    processingRef.current = true
    scannerRef.current?.pause(true)

    try {
      await checkInDecodedCode(decodedText)
    } catch (err) {
      setError(err.message || 'Check-in failed')
      setLastResult(null)
    } finally {
      window.setTimeout(() => {
        processingRef.current = false
        if (scannerRef.current?.isScanning) scannerRef.current.resume()
      }, 1800)
    }
  }

  async function checkInDecodedCode(decodedText) {
    const result = await api.checkIn(decodedText)
    setLastResult(result)
    setTotalCheckedIn(result.total_checked_in)
    setError('')
  }

  async function handleQrImage(event) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file || processingRef.current) return

    processingRef.current = true
    setProcessingFile(true)
    setError('')
    const scanner = scannerRef.current
    const restartCamera = scanner?.isScanning ?? false

    try {
      if (!scanner) throw new Error('The QR scanner is not ready yet.')
      if (restartCamera) {
        await scanner.stop()
        setScanning(false)
      }

      let decodedText
      try {
        decodedText = await scanner.scanFile(file, false)
      } catch {
        throw new Error('No QR code was found. Choose a clear image of the downloaded QR code.')
      }
      await checkInDecodedCode(decodedText)
    } catch (err) {
      setError(err.message || 'Could not read that QR image.')
      setLastResult(null)
    } finally {
      try {
        if (scanner) scanner.clear()
      } catch (err) {
        setError(`Could not reset the QR scanner: ${err.message || err}`)
      } finally {
        if (restartCamera) await startCameraRef.current?.()
        processingRef.current = false
        setProcessingFile(false)
      }
    }
  }

  const progressPct = Math.min(100, Math.round((totalCheckedIn / GUEST_CAPACITY) * 100))

  return (
    <div className="page-shell checkin">
      <h1 className="checkin__title">Gate check-in</h1>
      <p className="checkin__subtitle">Staff view</p>

      <div className="checkin__scanner-frame">
        <div id={SCANNER_ELEMENT_ID} className="checkin__scanner" />
        {!scanning && (
          <div className="checkin__placeholder">
            <QrCode size={40} />
            <p>{error ? 'Camera unavailable' : 'Starting camera…'}</p>
          </div>
        )}
      </div>

      <div className="checkin__upload">
        <p>Having trouble with the camera? Upload the guest&apos;s QR image.</p>
        <input
          id="checkin-qr-image"
          className="checkin__file-input"
          type="file"
          accept="image/*"
          onChange={handleQrImage}
          disabled={processingFile || !scannerReady}
        />
        <label
          className="btn-secondary checkin__upload-button"
          htmlFor="checkin-qr-image"
          aria-disabled={processingFile || !scannerReady}
        >
          <Upload size={16} />
          {processingFile ? 'Checking QR image…' : scannerReady ? 'Upload QR image' : 'Preparing scanner…'}
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {lastResult && (
        <div className="checkin__result">
          <div className="checkin__avatar">
            {lastResult.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="checkin__result-info">
            <p className="checkin__result-name">{lastResult.name}</p>
            <p className="checkin__result-guests">
              {lastResult.guest_count} guest{lastResult.guest_count === 1 ? '' : 's'}
            </p>
          </div>
          <span className={`checkin__badge${lastResult.already_checked_in ? ' checkin__badge--repeat' : ''}`}>
            <Check size={12} />
            {lastResult.already_checked_in ? 'Already checked in' : 'Checked in'}
          </span>
        </div>
      )}

      <div className="checkin__progress">
        <div className="checkin__progress-labels">
          <span>Checked in</span>
          <span>
            {totalCheckedIn} / {GUEST_CAPACITY}
          </span>
        </div>
        <div className="checkin__progress-track">
          <div className="checkin__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  )
}
