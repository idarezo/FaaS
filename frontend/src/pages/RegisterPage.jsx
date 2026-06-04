import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Geslo mora imeti vsaj 6 znakov')
    setLoading(true)
    try {
      const data = await register(form.email, form.password, form.name)
      loginUser({ userId: data.userId, name: data.name, email: data.email }, data.token)
      navigate('/events')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="card">
        <h1>Registracija</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ime in priimek</label>
            <input type="text" value={form.name} onChange={set('name')} required autoFocus />
          </div>
          <div className="form-group">
            <label>E-poštni naslov</label>
            <input type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label>Geslo</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Registriram...' : 'Ustvari račun'}
            </button>
          </div>
        </form>
        <p className="auth-link">Imaš račun? <Link to="/login">Prijava</Link></p>
      </div>
    </div>
  )
}