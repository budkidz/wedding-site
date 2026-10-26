import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'

// Loaded only when someone opens these pages, so the home page stays small and fast.
const TicketPage = lazy(() => import('./pages/TicketPage.jsx'))
const CheckInPage = lazy(() => import('./pages/CheckInPage.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="page-shell" style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Shown right after a guest successfully RSVPs "yes" */}
          <Route path="/ticket/:rsvpId" element={<TicketPage />} />
          {/* Staff-only gate scanner — not linked from the public site */}
          <Route path="/staff/check-in" element={<CheckInPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
