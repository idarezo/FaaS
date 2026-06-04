import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyRegistrations, cancelRegistration } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function MyRegistrationsPage() {
  const { token } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyRegistrations(token)
      .then(data => setRegistrations(data.registrations))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleCancel = async (reg) => {
    if (!confirm('Ali res želite odpovedati prijavo?')) return
    try {
      await cancelRegistration(token, reg.eventId, reg.registrationId)
      setRegistrations(prev => prev.map(r => r.registrationId === reg.registrationId ? { ...r, status: 'cancelled' } : r))
    } catch (err) {
      setError(err.message)
    }
  }

  const active = registrations.filter(r => r.status === 'active')
  const cancelled = registrations.filter(r => r.status === 'cancelled')

  if (loading) return <div className="loading">Nalagam...</div>

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Moje prijave</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
        Aktivne ({active.length})
      </h2>

      {active.length === 0 ? (
        <div className="empty" style={{ padding: '2rem' }}>
          <p>Niste prijavljeni na noben dogodek.</p>
          <Link to="/events" className="btn btn-primary" style={{ marginTop: '1rem' }}>Poišči dogodke</Link>
        </div>
      ) : (
        <div className="reg-list" style={{ marginBottom: '2rem' }}>
          {active.map(reg => (
            <div key={reg.registrationId} className="reg-item">
              <div className="reg-item-info">
                <Link to={`/events/${reg.eventId}`} className="reg-item-title" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {reg.eventTitle}
                </Link>
                <span className="reg-item-date">
                  📅 {new Date(reg.eventDate).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {reg.eventLocation && ` · 📍 ${reg.eventLocation}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-green">Aktivna</span>
                <button className="btn btn-outline btn-sm" onClick={() => handleCancel(reg)}>
                  Odpovej
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelled.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Odpovedane ({cancelled.length})
          </h2>
          <div className="reg-list">
            {cancelled.map(reg => (
              <div key={reg.registrationId} className="reg-item" style={{ opacity: 0.6 }}>
                <div className="reg-item-info">
                  <span className="reg-item-title">{reg.eventTitle}</span>
                  <span className="reg-item-date">
                    📅 {new Date(reg.eventDate).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className="badge badge-gray">Odpovedana</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}