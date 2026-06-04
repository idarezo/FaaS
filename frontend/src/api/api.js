const BASE = '/api'

const headers = (token = null) => {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

const handle = async (res) => {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Napaka pri zahtevi')
  return data.data
}

// Auth
export const register = (email, password, name) =>
  fetch(`${BASE}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password, name }) }).then(handle)

export const login = (email, password) =>
  fetch(`${BASE}/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) }).then(handle)

// Events
export const getEvents = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return fetch(`${BASE}/events${query ? '?' + query : ''}`).then(handle)
}

export const getEvent = (eventId) =>
  fetch(`${BASE}/events/${eventId}`).then(handle)

export const createEvent = (token, data) =>
  fetch(`${BASE}/events`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) }).then(handle)

export const updateEvent = (token, eventId, data) =>
  fetch(`${BASE}/events/${eventId}`, { method: 'PUT', headers: headers(token), body: JSON.stringify(data) }).then(handle)

export const deleteEvent = (token, eventId) =>
  fetch(`${BASE}/events/${eventId}`, { method: 'DELETE', headers: headers(token) }).then(handle)

// Registrations
export const registerForEvent = (token, eventId) =>
  fetch(`${BASE}/events/${eventId}/register`, { method: 'POST', headers: headers(token) }).then(handle)

export const cancelRegistration = (token, eventId, registrationId) =>
  fetch(`${BASE}/events/${eventId}/register/${registrationId}`, { method: 'DELETE', headers: headers(token) }).then(handle)

export const getMyRegistrations = (token) =>
  fetch(`${BASE}/my/registrations`, { headers: headers(token) }).then(handle)

export const getEventRegistrations = (token, eventId) =>
  fetch(`${BASE}/events/${eventId}/registrations`, { headers: headers(token) }).then(handle)

// Analytics
export const trackView = (eventId) =>
  fetch(`${BASE}/events/${eventId}/view`, { method: 'POST' }).catch(() => {})