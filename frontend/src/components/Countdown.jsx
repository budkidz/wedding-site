import { useEffect, useState } from 'react'
import { WEDDING_DATE } from '../config.js'

function getTimeLeft() {
  const diff = Math.max(0, new Date(WEDDING_DATE).getTime() - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60)
  }
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const stats = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds }
  ]

  return (
    <section className="countdown">
      <p className="countdown__label">Countdown</p>
      <div className="countdown__grid">
        {stats.map((stat) => (
          <div className="countdown__stat" key={stat.label}>
            <div className="countdown__value">{String(stat.value).padStart(2, '0')}</div>
            <div className="countdown__unit">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
