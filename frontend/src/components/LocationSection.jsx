import { MapPin } from 'lucide-react'
import { VENUE } from '../config.js'

export default function LocationSection() {
  return (
    <section className="location">
      <MapPin size={22} className="location__icon" />
      <p className="location__venue">
        {VENUE.name}, {VENUE.city}
      </p>
      <p className="location__note">One location for the ceremony and come together</p>
      <a className="location__btn" href={VENUE.mapsUrl} target="_blank" rel="noreferrer">
        Open in maps
      </a>
    </section>
  )
}
