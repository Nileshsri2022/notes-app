import {
  collection, doc, setDoc, getDoc, onSnapshot,
} from 'firebase/firestore'
import { db, appId } from '../firebase.js'

export function historyRef(user) {
  return collection(db, 'artifacts', appId, 'users', user.uid, 'history')
}

export function sessionRef(user) {
  return doc(db, 'artifacts', appId, 'users', user.uid, 'session', 'current')
}

export function subscribeHistory(user, cb) {
  return onSnapshot(historyRef(user), (snapshot) => {
    const items = []
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }))
    items.sort((a, b) => b.createdAt - a.createdAt)
    cb(items)
  }, (err) => console.error('History fetch error:', err))
}

export async function getSession(user) {
  const snap = await getDoc(sessionRef(user))
  return snap.exists() ? snap.data() : null
}

export async function setSession(user, payload) {
  await setDoc(sessionRef(user), payload)
}

export async function addHistory(user, item) {
  const ref = doc(historyRef(user))
  await setDoc(ref, item)
}
