import { useEffect, useState, useCallback, useRef } from 'react'
import { subscribeHistory, getSession, setSession } from '../lib/store.js'

const DEBOUNCE_MS = 500

function useDebouncedCallback(fn, delay) {
  const timerRef = useRef(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const debounced = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fnRef.current(...args), delay)
  }, [delay])

  const flush = useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    return fnRef.current(...args)
  }, [])

  return [debounced, flush]
}

export function useSession(user) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeHistory(user, setHistory)
    return () => unsub()
  }, [user])

  const _save = useCallback(async (status, sourceText, learningData, activeTab) => {
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
  }, [user])

  // Debounced version for high-frequency calls (e.g. textarea keystrokes).
  const [saveSession, flushSession] = useDebouncedCallback(_save, DEBOUNCE_MS)

  const loadSession = useCallback(async () => {
    if (!user) return null
    try {
      return await getSession(user)
    } catch (e) {
      console.error('Session load error', e)
      return null
    }
  }, [user])

  return { history, saveSession, flushSession, loadSession }
}
