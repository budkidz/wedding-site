import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import TicketPage from './pages/TicketPage.jsx'
import CheckInPage from './pages/CheckInPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Shown right after a guest successfully RSVPs "yes" */}
        <Route path="/ticket/:rsvpId" element={<TicketPage />} />
        {/* Staff-only gate scanner — not linked from the public site */}
        <Route path="/staff/check-in" element={<CheckInPage />} />
      </Routes>
    </BrowserRouter>
  )
}
