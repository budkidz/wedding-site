import { useRef, useState } from 'react'
import { WEDDING_DATE } from '../config.js'

export default function Hero({ onRsvpClick }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [year, month, day] = WEDDING_DATE.slice(0, 10).split('-')
  const monthLabel = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
    .toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()

  function toggleMusic() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play().catch(() => {
        // Autoplay can be blocked until the user interacts — this click counts.
      })
    }
    setPlaying(!playing)
  }

  return (
    <section className="hero" style={{ backgroundImage: 'url(/images/hero.webp)' }}>
      <div className="hero__overlay" />

      <div className="hero__top">
        <span className="hero__pill">You're invited</span>
        <button
          className="hero__music-toggle"
          onClick={toggleMusic}
          aria-label={playing ? 'Pause background music' : 'Play background music preview'}
        >
          {playing ? '❙❙' : '♪'}
        </button>
        {/* Drop an MP3 at /public/audio/preview.mp3 and point this at it */}
        <audio ref={audioRef} src="/audio/preview.mp3" preload="none" loop />
      </div>

      <div className="hero__bottom">
        <p className="hero__eyebrow">Together with their families</p>
        <h1 className="hero__names">Dingani  &amp; Gloria</h1>
        <div className="divider on-dark" style={{ marginBottom: 20 }}>
          <span className="line" />
          <span className="diamond" />
          <span className="line" />
        </div>
        <p className="hero__subtitle">
          Invite you to <br/ >celebrate their wedding.
        </p>
        <div className="hero__date" aria-label={`${monthLabel} ${Number(day)}, ${year}`}>
          <span className="hero__date-month">{monthLabel}</span>
          <span className="hero__date-day">{Number(day)}</span>
          <span className="hero__date-year">{year}</span>
        </div>
        {/*
        <button className="btn-on-dark" style={{ width: '100%' }} onClick={onRsvpClick}>
          RSVP now
        </button>
        */}
      </div>
    </section>
  )
}
