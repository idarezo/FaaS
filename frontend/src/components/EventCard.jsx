import { Link } from 'react-router-dom'

export default function EventCard({ event }) {
  const fillPercent = Math.min((event.currentRegistrations / event.maxCapacity) * 100, 100)
  const isFull = event.currentRegistrations >= event.maxCapacity
  const date = new Date(event.date).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Link to={`/events/${event.eventId}`} className="event-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="event-card-title">{event.title}</span>
        <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
          {isFull ? 'Razprodano' : 'Prosto'}
        </span>
      </div>
      <div className="event-card-meta">
        <span>📅 {date}</span>
        <span>📍 {event.location}</span>
      </div>
      {event.description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {event.description.length > 80 ? event.description.slice(0, 80) + '…' : event.description}
        </p>
      )}
      <div className="event-card-footer">
        <span className={`badge badge-blue`}>{event.category}</span>
        <div className="capacity">
          {event.currentRegistrations} / {event.maxCapacity}
          <div className="capacity-bar">
            <div className="capacity-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
      </div>
    </Link>
  )
}