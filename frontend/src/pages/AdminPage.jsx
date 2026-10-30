import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Clock3,
  LogOut,
  MessageCircle,
  RefreshCw,
  Search,
  Users,
  XCircle
} from 'lucide-react'
import { api } from '../lib/api.js'
import '../styles/admin.css'

const STORAGE_KEY = 'wedding-admin-key'

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

// wa.me needs digits only, with the country code and no leading 0 or +.
function whatsAppUrl(rsvp) {
  let digits = rsvp.phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = `260${digits.slice(1)}`

  const ticketUrl = `${window.location.origin}/ticket/${rsvp.id}`
  const message =
    `Hello ${rsvp.name.trim()}, your RSVP for Dingani & Gloria's wedding has been approved! ` +
    `Open your invitation and check-in QR code here: ${ticketUrl}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [keyInput, setKeyInput] = useState('')
  const [rsvps, setRsvps] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(Boolean(adminKey))
  const [approvingId, setApprovingId] = useState('')
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!adminKey) return

    let active = true
    setLoading(true)
    api.getAdminRsvps(adminKey)
      .then((rows) => {
        if (active) {
          setRsvps(rows)
          setError('')
          sessionStorage.setItem(STORAGE_KEY, adminKey)
        }
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        if (err.status === 401) {
          sessionStorage.removeItem(STORAGE_KEY)
          setAdminKey('')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [adminKey, refreshIndex])

  const counts = useMemo(() => ({
    total: rsvps.length,
    pending: rsvps.filter((rsvp) => rsvp.attending && !rsvp.approved).length,
    approved: rsvps.filter((rsvp) => rsvp.attending && rsvp.approved).length,
    declined: rsvps.filter((rsvp) => !rsvp.attending).length,
    checkedIn: rsvps.filter((rsvp) => rsvp.checked_in).length
  }), [rsvps])

  const visibleRsvps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return rsvps.filter((rsvp) => {
      const matchesQuery = !normalizedQuery
        || rsvp.name.toLowerCase().includes(normalizedQuery)
        || rsvp.phone.toLowerCase().includes(normalizedQuery)
      const matchesFilter = filter === 'all'
        || (filter === 'pending' && rsvp.attending && !rsvp.approved)
        || (filter === 'approved' && rsvp.attending && rsvp.approved)
        || (filter === 'declined' && !rsvp.attending)
      return matchesQuery && matchesFilter
    })
  }, [filter, query, rsvps])

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY)
    setAdminKey('')
    setKeyInput('')
    setRsvps([])
    setError('')
    setNotice('')
  }

  function handleLogin(event) {
    event.preventDefault()
    if (!keyInput.trim()) {
      setError('Enter the admin key configured on the API server.')
      return
    }
    setError('')
    setNotice('')
    setAdminKey(keyInput.trim())
  }

  async function handleApprove(rsvp) {
    setApprovingId(rsvp.id)
    setError('')
    setNotice('')
    try {
      const approved = await api.approveRsvp(rsvp.id, adminKey)
      setRsvps((current) => current.map((row) => row.id === approved.id ? approved : row))
      setNotice(`${approved.name} approved. Their ticket page is now available.`)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY)
        setAdminKey('')
      }
    } finally {
      setApprovingId('')
    }
  }

  async function handleReject(rsvp) {
    const confirmed = window.confirm(
      `Reject and permanently delete the RSVP from ${rsvp.name}? ` +
      'Their phone number will be free to RSVP again. This cannot be undone.'
    )
    if (!confirmed) return

    setApprovingId(rsvp.id)
    setError('')
    setNotice('')
    try {
      await api.rejectRsvp(rsvp.id, adminKey)
      setRsvps((current) => current.filter((row) => row.id !== rsvp.id))
      setNotice(`${rsvp.name}'s RSVP was rejected and deleted.`)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY)
        setAdminKey('')
      }
    } finally {
      setApprovingId('')
    }
  }

  if (!adminKey) {
    return (
      <main className="admin-login">
        <form className="admin-login__card" onSubmit={handleLogin}>
          <p className="admin-eyebrow">Dingani &amp; Gloria</p>
          <h1>Wedding admin</h1>
          <p className="admin-login__description">
            Sign in to review RSVPs and manage invitation approvals.
          </p>
          <label htmlFor="admin-key">Admin key</label>
          <input
            id="admin-key"
            type="password"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            autoComplete="current-password"
            autoFocus
          />
          {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
          <button className="admin-button admin-button--primary" type="submit">
            Open dashboard
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Dingani &amp; Gloria</p>
          <h1>Invitation dashboard</h1>
          <p className="admin-header__subtitle">Review guest responses and release approved invitations.</p>
        </div>
        <div className="admin-header__actions">
          <button
            className="admin-button admin-button--quiet"
            type="button"
            onClick={() => setRefreshIndex((value) => value + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="admin-button admin-button--quiet" type="button" onClick={signOut}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-stats" aria-label="RSVP summary">
        <article className="admin-stat">
          <span className="admin-stat__icon"><Users size={18} /></span>
          <span className="admin-stat__label">Total responses</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="admin-stat admin-stat--pending">
          <span className="admin-stat__icon"><Clock3 size={18} /></span>
          <span className="admin-stat__label">Awaiting approval</span>
          <strong>{counts.pending}</strong>
        </article>
        <article className="admin-stat admin-stat--approved">
          <span className="admin-stat__icon"><CheckCircle2 size={18} /></span>
          <span className="admin-stat__label">Approved</span>
          <strong>{counts.approved}</strong>
        </article>
        <article className="admin-stat admin-stat--declined">
          <span className="admin-stat__icon"><XCircle size={18} /></span>
          <span className="admin-stat__label">Declined</span>
          <strong>{counts.declined}</strong>
        </article>
        <article className="admin-stat">
          <span className="admin-stat__icon"><Check size={18} /></span>
          <span className="admin-stat__label">Checked in</span>
          <strong>{counts.checkedIn}</strong>
        </article>
      </section>

      <section className="admin-records">
        <div className="admin-records__heading">
          <div>
            <h2>Guest responses</h2>
            <p>Guest details are visible only to admins.</p>
          </div>
          <label className="admin-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search name or phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-filters" aria-label="Filter responses">
          {[
            ['all', 'All responses'],
            ['pending', 'Awaiting approval'],
            ['approved', 'Approved'],
            ['declined', 'Declined']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'is-selected' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
              {value === 'pending' && counts.pending > 0 && <span>{counts.pending}</span>}
            </button>
          ))}
        </div>

        {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
        {notice && <p className="admin-alert admin-alert--success" role="status">{notice}</p>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Phone</th>
                <th>Response received</th>
                <th>Status</th>
                <th>Check-in</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="admin-table__empty" colSpan="6">Loading guest responses…</td></tr>
              ) : visibleRsvps.length === 0 ? (
                <tr><td className="admin-table__empty" colSpan="6">No guest responses found.</td></tr>
              ) : visibleRsvps.map((rsvp) => {
                const status = !rsvp.attending
                  ? 'Declined'
                  : rsvp.approved ? 'Approved' : 'Awaiting approval'
                const statusClass = !rsvp.attending
                  ? 'declined'
                  : rsvp.approved ? 'approved' : 'pending'
                return (
                  <tr key={rsvp.id}>
                    <td data-label="Guest">
                      <strong>{rsvp.name}</strong>
                      <span className="admin-table__subtext">{rsvp.guest_count} guest{rsvp.guest_count === 1 ? '' : 's'}</span>
                    </td>
                    <td data-label="Phone">{rsvp.phone}</td>
                    <td data-label="Response received">{formatDate(rsvp.created_at)}</td>
                    <td data-label="Status">
                      <span className={`admin-status admin-status--${statusClass}`}>{status}</span>
                    </td>
                    <td data-label="Check-in">
                      {rsvp.checked_in ? <span className="admin-checkin">Checked in</span> : '—'}
                    </td>
                    <td className="admin-table__action">
                      {rsvp.attending && !rsvp.approved && (
                        <div className="admin-table__buttons">
                          <button
                            className="admin-button admin-button--approve"
                            type="button"
                            onClick={() => handleApprove(rsvp)}
                            disabled={Boolean(approvingId)}
                          >
                            {approvingId === rsvp.id ? 'Working…' : 'Approve & release'}
                          </button>
                          <button
                            className="admin-button admin-button--reject"
                            type="button"
                            onClick={() => handleReject(rsvp)}
                            disabled={Boolean(approvingId)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {rsvp.attending && rsvp.approved && (
                        <a
                          className="admin-button admin-button--whatsapp"
                          href={whatsAppUrl(rsvp)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={14} />
                          Send on WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="admin-records__footer">
          Showing {visibleRsvps.length} of {rsvps.length} responses
        </p>
      </section>
    </main>
  )
}
