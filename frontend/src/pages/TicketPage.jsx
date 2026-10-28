import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PersonalizedEvite from '../components/PersonalizedEvite.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'
import '../styles/sections.css'

export default function TicketPage() {
  const { rsvpId } = useParams()
  const [rsvp, setRsvp] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const refreshRsvp = useCallback(async () => {
    setChecking(true)
    setError('')
    try {
      setRsvp(await api.getRsvp(rsvpId))
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }, [rsvpId])

  useEffect(() => {
    refreshRsvp()
  }, [refreshRsvp])

  if (error) {
    return (
      <main className="page-shell ticket-page">
        <p>Couldn't load this ticket: {error}</p>
      </main>
    )
  }

  if (!rsvp) {
    return (
      <main className="page-shell ticket-page">
        <p>Loading your ticket…</p>
      </main>
    )
  }

  return (
    <>
      <main className="page-shell ticket-page">
        {rsvp.attending && !rsvp.approved ? (
          <section className="ticket-page__pending" aria-live="polite">
            <h1>RSVP received</h1>
            <p>
              Thank you, {rsvp.name.trim()}. Your RSVP is awaiting approval from the hosts.
              Your personalized invitation and check-in QR code will appear here once approved.
            </p>
            <button
              className="btn-primary ticket-page__refresh"
              type="button"
              onClick={refreshRsvp}
              disabled={checking}
            >
              {checking ? 'Checking…' : 'Check approval status'}
            </button>
          </section>
        ) : rsvp.attending ? (
          <>
            <h1 className="ticket-page__confirmation">
              Thank you, {rsvp.name.trim()}! Your attendance has been confirmed.
            </h1>
            <PersonalizedEvite
              guestName={rsvp.name}
              guestCount={rsvp.guest_count}
              ticketCode={rsvp.ticket_code}
            />
          </>
        ) : (
          <p className="ticket-page__confirmation">
            Thank you, {rsvp.name.trim()}, for letting us know. We&apos;ll miss you!
          </p>
        )}
      </main>
      <Footer />
    </>
  )
}
