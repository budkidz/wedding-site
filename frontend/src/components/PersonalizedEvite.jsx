import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { downloadEvite } from '../lib/evite.js'
import '../styles/evite.css'

const THANK_YOU_GIFT_MESSAGE =
  'Our most important gift is your presence. However, if you wish to honour us with a gift, a contribution of not less than K500 for the newlyweds would be appreciated. We’re deeply grateful for your generosity and for sharing this day with us.'

function getGuestNameFontSize(name) {
  return Math.max(12, 24 - Math.max(0, name.length - 18) * 0.2)
}

export default function PersonalizedEvite({ guestName, guestCount, ticketCode }) {
  const eviteRef = useRef(null)
  const qrRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const name = guestName.trim()
  const fileName = `Dingani-Gloria-Wedding-${name}`

  async function handleDownload() {
    if (!eviteRef.current || busy) return

    setBusy(true)
    setMessage('')
    setError('')
    try {
      await downloadEvite(eviteRef.current, fileName)
      setMessage('Your e-vite has been downloaded.')
    } catch (err) {
      setError(err.message || 'Could not create the e-vite image. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadQr() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas || busy) return

    setBusy(true)
    setMessage('')
    setError('')
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result)
          else reject(new Error('The browser could not create the QR code image.'))
        }, 'image/png')
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}-QR.png`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('Your check-in QR code has been downloaded.')
    } catch (err) {
      setError(err.message || 'Could not download the QR code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const nameStyle = { fontSize: `${getGuestNameFontSize(name)}px` }

  return (
    <section className="evite-section" aria-label="Your personalized wedding e-vite">
      <div className="evite" ref={eviteRef}>
        <div className="evite__content">
          <p className="evite__confirmed">RSVP Confirmed!</p>

          <div className="evite__greeting">
            <p className="evite__dear">DEAR</p>
            <p className="evite__guest-name" style={nameStyle}>{name}</p>
          </div>

          <p className="evite__gift-message">{THANK_YOU_GIFT_MESSAGE}</p>

          <div className="evite__event-details">
            <p>7TH NOVEMBER 2026</p>
            <p>ZAF HQ BANQUET HALL LONGACRES</p>
          </div>

          <footer className="evite__closing">
            <p className="evite__closing-line">We look forward to celebrating with you!</p>
          </footer>
        </div>
      </div>

      <div className="evite__qr-card">
        <p className="evite__qr-instruction">Show this check-in QR code at the entrance</p>
        <div className="evite__qr" ref={qrRef}>
          <QRCodeCanvas value={ticketCode} size={200} level="M" />
        </div>
        <p className="evite__guest-count">
          Admitting {guestCount} guest{guestCount === 1 ? '' : 's'}
        </p>
      </div>

      <div className="evite__actions">
        <button className="btn-primary" type="button" onClick={handleDownload} disabled={busy}>
          {busy ? 'Preparing…' : 'Download E-vite'}
        </button>
        <button className="btn-secondary" type="button" onClick={handleDownloadQr} disabled={busy}>
          {busy ? 'Preparing…' : 'Download QR Code'}
        </button>
      </div>
      {message && <p className="evite__status" role="status">{message}</p>}
      {error && <p className="evite__error" role="alert">{error}</p>}
    </section>
  )
}
