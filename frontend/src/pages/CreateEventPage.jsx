import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function CreateEventPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', date: '', location: '', maxCapacity: 100, category: 'splošno'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const event = await createEvent(token, {
        ...form,
        maxCapacity: parseInt(form.maxCapacity),
        date: new Date(form.date).toISOString(),
      })
      navigate(`/events/${event.eventId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page" style={{ maxWidth: 560 }}>
      <div className="card">
        <h1>Nov dogodek</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Naslov *</label>
            <input type="text" value={form.title} onChange={set('title')} required autoFocus />
          </div>
          <div className="form-group">
            <label>Opis</label>
            <textarea value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Datum in čas *</label>
              <input type="datetime-local" value={form.date} onChange={set('date')} required />
            </div>
            <div className="form-group">
              <label>Maks. kapaciteta</label>
              <input type="number" min={1} max={10000} value={form.maxCapacity} onChange={set('maxCapacity')} />
            </div>
          </div>
          <div className="form-group">
            <label>Kraj *</label>
            <input type="text" value={form.location} onChange={set('location')} required placeholder="npr. Ljubljana, BTC" />
          </div>
          <div className="form-group">
            <label>Kategorija</label>
            <select value={form.category} onChange={set('category')}>
              <option value="splošno">Splošno</option>
              <option value="tehnologija">Tehnologija</option>
              <option value="kultura">Kultura</option>
              <option value="šport">Šport</option>
              <option value="izobraževanje">Izobraževanje</option>
              <option value="zabava">Zabava</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/events')}>
              Prekliči
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Ustvarjam...' : 'Ustvari dogodek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}