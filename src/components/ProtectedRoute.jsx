import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setAuthed(!!user)
      setChecking(false)
    })
  }, [])

  if (checking) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>
  if (!authed) return <Navigate to="/login" replace />
  return children
}
