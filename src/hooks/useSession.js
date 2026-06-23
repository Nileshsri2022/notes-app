import { useEffect, useState } from 'react'
import { subscribeHistory, getSession, setSession } from '../lib/store.js'

export function useSession(user) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeHistory(user, setHistory)
    return () => unsub()
  }, [user])

  const saveSession = async (status, sourceText, learningData, activeTab) => {
    if (!user) return
    try {
      await setSession(user, {
        status,
        sourceText: sourceText || '',
        activeTab,
        learningData: learningData || null,
        updatedAt: Date.now(),
      })
    } catch (e) {
      console.error('Failed to save session', e)
    }
  }

  const loadSession = async () => {
    if (!user) return null
    try {
      return await getSession(user)
    } catch (e) {
      console.error('Session load error', e)
      return null
    }
  }

  return { history, loadSession, saveSession }
}
