import { Heart, Camera, Users } from 'lucide-react'
import { TIMELINE } from '../config.js'

const ICONS = { heart: Heart, camera: Camera, users: Users }

export default function Timeline() {
  return (
    <section className="timeline">
      <h2 className="timeline__heading">Wedding timeline</h2>
      <div className="divider" style={{ margin: '10px 0 24px' }}>
        <span className="line" />
        <span className="diamond" />
        <span className="line" />
      </div>

      {TIMELINE.map((item, i) => {
        const Icon = ICONS[item.icon] ?? Heart
        const isLast = i === TIMELINE.length - 1
        return (
          <div className="timeline__row" key={item.id}>
            <div className="timeline__icon-col">
              <div className="timeline__icon">
                <Icon size={16} />
              </div>
              {!isLast && <div className="timeline__connector" />}
            </div>
            <div className="timeline__content">
              <p className="timeline__title">{item.title}</p>
              <p className="timeline__time">{item.time}</p>
            </div>
          </div>
        )
      })}

      <p className="timeline__note">Wedding Ceremony at Civic Centre <br/ > 
        <br/ >Come together at Zambia Air Force HQ Banquet Hall</p>
    </section>
  )
}
