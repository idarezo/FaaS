import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEvents } from '../api/api'
import EventCard from '../components/EventCard'
import { useAuth } from '../context/AuthContext'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    setLoading(true)
    const params = category ? { category } : {}
    getEvents(params)
      .then(data => setEvents(data.events))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [category])

  const categories = [...new Set(events.map(e => e.category).filter(Boolean))]

  return (
    <div>
      <div className="events-header">
        <h1>Dogodki</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {categories.length > 0 && (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ padding: '0.45rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9rem' }}
            >
              <option value="">Vse kategorije</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {isLoggedIn && (
            <Link to="/create-event" className="btn btn-primary">+ Nov dogodek</Link>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Nalagam...</div>
      ) : events.length === 0 ? (
        <div className="empty">
          <h3>Ni dogodkov</h3>
          <p>Trenutno ni aktivnih dogodkov.</p>
          {isLoggedIn && <Link to="/create-event" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ustvari prvega</Link>}
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => <EventCard key={event.eventId} event={event} />)}
        </div>
      )}
    </div>
  )
}