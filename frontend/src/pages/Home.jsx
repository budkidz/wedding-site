import { useEffect, useRef, useState } from 'react'
import Hero from '../components/Hero.jsx'
import Countdown from '../components/Countdown.jsx'
import Timeline from '../components/Timeline.jsx'
import LocationSection from '../components/LocationSection.jsx'
import RSVPForm from '../components/RSVPForm.jsx'
import Notes from '../components/Notes.jsx'
import Gallery from '../components/Gallery.jsx'
import Footer from '../components/Footer.jsx'
import '../styles/sections.css'
import { api } from '../lib/api.js'

export default function Home() {
  const rsvpRef = useRef(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api
      .getEventSummary()
      .then(setSummary)
      .catch(() => {
        // Backend not running yet during early frontend-only development — that's fine.
      })
  }, [])

  function scrollToRsvp() {
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="page-shell">
      <Hero onRsvpClick={scrollToRsvp} />
      <main className="event-details">
        <Countdown />
        <Timeline />
        <LocationSection />
        <RSVPForm formRef={rsvpRef} summary={summary} />
      </main>
      <Notes />
      <Gallery />
      <Footer />
    </div>
  )
}
