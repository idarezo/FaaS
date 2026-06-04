import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getEvent, registerForEvent, cancelRegistration, getMyRegistrations, deleteEvent, trackView } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function EventDetailPage() {
  const { eventId } = useParams()
  const { user, token, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [myReg, setMyReg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      getEvent(eventId),
      isLoggedIn ? getMyRegistrations(token) : Promise.resolve({ registrations: [] }),
    ])
      .then(([ev, regs]) => {
        setEvent(ev)
        const reg = regs.registrations?.find(r => r.eventId === eventId && r.status === 'active')
        setMyReg(reg || null)
        trackView(eventId)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId, isLoggedIn, token])

  const handleRegister = async () => {
    setActionLoading(true)
    setError('')
    try {
      const reg = await registerForEvent(token, eventId)
      setMyReg(reg)
      setEvent(ev => ({ ...ev, currentRegistrations: ev.currentRegistrations + 1 }))
      setSuccess('Uspešno ste se prijavili!')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Ali res želite odpovedati prijavo?')) return
    setActionLoading(true)
    setError('')
    try {
      await cancelRegistration(token, eventId, myReg.registrationId)
      setMyReg(null)
      setEvent(ev => ({ ...ev, currentRegistrations: Math.max(0, ev.currentRegistrations - 1) }))
      setSuccess('Prijava odpovedana.')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Ali res želite izbrisati ta dogodek?')) return
    try {
      await deleteEvent(token, eventId)
      navigate('/events')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">Nalagam...</div>
  if (!event) return <div className="alert alert-error">Dogodek ni bil najden.</div>

  const isOrganizer = user?.userId === event.organizerId
  const isFull = event.currentRegistrations >= event.maxCapacity
  const date = new Date(event.date).toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="event-detail">
      <Link to="/events" className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        ← Nazaj
      </Link>

      <div className="card">
        <div className="event-detail-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1>{event.title}</h1>
            <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
              {isFull ? 'Razprodano' : 'Mesta prosta'}
            </span>
          </div>
          <span className="badge badge-blue" style={{ marginTop: '0.5rem' }}>{event.category}</span>
        </div>

        <div className="event-detail-meta">
          <div className="event-detail-meta-item">
            <span className="label">Datum</span>
            <span className="value">📅 {date}</span>
          </div>
          <div className="event-detail-meta-item">
            <span className="label">Kraj</span>
            <span className="value">📍 {event.location}</span>
          </div>
          <div className="event-detail-meta-item">
            <span className="label">Prijavljeni</span>
            <span className="value">👥 {event.currentRegistrations} / {event.maxCapacity}</span>
          </div>
        </div>

        {event.description && (
          <p className="event-detail-description">{event.description}</p>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="event-detail-actions">
          {!isLoggedIn && (
            <Link to="/login" className="btn btn-primary">Prijavi se za registracijo</Link>
          )}

          {isLoggedIn && !isOrganizer && (
            myReg ? (
              <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
                {actionLoading ? 'Odpovedajem...' : 'Odpovej prijavo'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleRegister} disabled={actionLoading || isFull}>
                {actionLoading ? 'Prijavljam...' : isFull ? 'Razprodano' : 'Prijavi se'}
              </button>
            )
          )}

          {isOrganizer && (
            <>
              <Link to={`/events/${eventId}/edit`} className="btn btn-outline">Uredi</Link>
              <button className="btn btn-danger" onClick={handleDelete}>Izbriši</button>
            </>
          )}
        </div>

        {myReg && (
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--success)' }}>
            ✓ Prijavljeni ste na ta dogodek
          </p>
        )}
      </div>
    </div>
  )
}