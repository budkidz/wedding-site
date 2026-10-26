import { COUPLE, DEVELOPER, WEDDING_DATE } from '../config.js'
import '../styles/footer.css'

export default function Footer() {
  const year = WEDDING_DATE.slice(0, 4)

  return (
    <footer className="site-footer">
      <p className="site-footer__copyright">
        © {year} {COUPLE.partnerA} &amp; {COUPLE.partnerB}. All rights reserved.
      </p>
      <p className="site-footer__credit">
        Website developed by{' '}
        {DEVELOPER.url ? (
          <a href={DEVELOPER.url} target="_blank" rel="noreferrer">
            {DEVELOPER.name}
          </a>
        ) : (
          DEVELOPER.name
        )}
      </p>
    </footer>
  )
}
