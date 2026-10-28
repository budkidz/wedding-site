import { useState, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { GUEST_CAPACITY } from '../config.js'
import { PatternFormat } from 'react-number-format'

export default function RSVPForm({ formRef, summary }) {
  const navigate = useNavigate()
  const nameId = useId()
  const phoneId = useId()
  const submissionInProgress = useRef(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [attending, setAttending] = useState(null) // true | false | null
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (submissionInProgress.current) return
    setError('')

    // Guard check for empty values
    if (!name.trim() || !phone.trim() || attending === null) {
      setError('Please fill in your name, phone number, and let us know if you can make it.')
      return
    }

    // Exact length check for the 9-digit Zambian subscriber number
    if (phone.length < 9) {
      setError('Please enter a valid 9-digit Zambian phone number.')
      return
    }
        
    submissionInProgress.current = true
    setSubmitting(true)
    try {
      // Prepend +260 to the phone number before sending it to the backend
      const result = await api.submitRsvp({
        name: name.trim(),
        phone: `+260${phone}`, // Combines +260 with the 9 digits (e.g., "+260971234567")
        attending
      })

      if (attending) {
        navigate(`/ticket/${result.id}`)
      } else {
        setError('')
        alert("Thanks for letting us know — we'll miss you!")
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      submissionInProgress.current = false
      setSubmitting(false)
    }
  }

  function shareOnWhatsApp() {
    const text = encodeURIComponent(
      "You're invited to Dingani & Gloria's wedding! RSVP here: " + window.location.href
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <section className="rsvp" ref={formRef}>
      <h2 className="rsvp__heading">RSVP</h2>
      <div className="divider" style={{ margin: '10px 0' }}>
        <span className="line" />
        <span className="diamond" />
        <span className="line" />
      </div>
      <p className="rsvp__subtitle">Please confirm your attendance</p>
      <form onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <div className="field">
          <label htmlFor={nameId}>Name</label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thandiwe Mwansa"
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor={phoneId}>Phone number</label>
          <PatternFormat
            id={phoneId}
            type="tel"
            value={phone}

            //Enforces +260 code and spaces dynamically
            format="+260 ### ### ###"
            mask="_"
            allowEmptyFormatting={true}


            onValueChange={(values) => {
              setPhone(values.value);
            }}

            autoComplete="tel"
            disabled={submitting}
          />
        </div>

        <p className="rsvp__choice-label">
          Will you attend?
        </p>
        <div className="attend-toggle">
          <button
            type="button"
            className={attending === true ? 'selected' : ''}
            aria-pressed={attending === true}
            onClick={() => setAttending(true)}
          >
            Joyfully accept
          </button>
          <button
            type="button"
            className={attending === false ? 'selected' : ''}
            aria-pressed={attending === false}
            onClick={() => setAttending(false)}
          >
            Regretfully decline
          </button>
        </div>

        <div className="rsvp__actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send RSVP'}
          </button>
          <button type="button" className="btn-secondary" onClick={shareOnWhatsApp}>
            <Share2 size={15} />
            Share via WhatsApp
          </button>
        </div>
      </form>
    </section>
  )
}
