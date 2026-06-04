import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CreateEventPage from './pages/CreateEventPage'
import MyRegistrationsPage from './pages/MyRegistrationsPage'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create-event" element={
            <ProtectedRoute><CreateEventPage /></ProtectedRoute>
          } />
          <Route path="/my-registrations" element={
            <ProtectedRoute><MyRegistrationsPage /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}