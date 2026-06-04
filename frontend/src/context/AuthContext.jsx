import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('faas_token')
    const savedUser = localStorage.getItem('faas_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const loginUser = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('faas_token', userToken)
    localStorage.setItem('faas_user', JSON.stringify(userData))
  }

  const logoutUser = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('faas_token')
    localStorage.removeItem('faas_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)