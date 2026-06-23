import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
    signInAnonymously(auth).catch((e) => {
      console.error('Anonymous auth failed', e)
      setReady(true)
    })
    return () => unsub()
  }, [])

  return { user, ready }
}
