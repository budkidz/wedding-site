import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PersonalizedEvite from '../components/PersonalizedEvite.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'
import '../styles/sections.css'

export default function TicketPage() {
  const { rsvpId } = useParams()
  const [rsvp, setRsvp] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRsvp(rsvpId)
      .then(setRsvp)
      .catch((err) => setError(err.message))
  }, [rsvpId])

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
        {rsvp.attending ? (
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
