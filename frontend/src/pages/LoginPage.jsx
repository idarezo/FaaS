import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
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
        <h1>Prijava</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-poštni naslov</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>Geslo</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Prijavljam...' : 'Prijava'}
            </button>
          </div>
        </form>
        <p className="auth-link">Nimaš računa? <Link to="/register">Registracija</Link></p>
      </div>
    </div>
  )
}