import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isLoggedIn, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/events')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/events" className="navbar-brand">FaaS Events</NavLink>
        <div className="navbar-links">
          <NavLink to="/events" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Dogodki
          </NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/create-event" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                + Nov dogodek
              </NavLink>
              <NavLink to="/my-registrations" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                Moje prijave
              </NavLink>
              <span className="nav-user">{user?.name}</span>
              <button className="btn-nav-logout" onClick={handleLogout}>Odjava</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                Prijava
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Registracija
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}