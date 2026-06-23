import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const appId = import.meta.env.VITE_APP_ID || 'default-app-id'

// Google Analytics: lazy-loaded so it stays out of the initial bundle.
// Only in production builds, in a browser that supports it. (Dev clicks
// would pollute the GA dashboard; isSupported() is false in test/SSR.)
if (import.meta.env.PROD) {
  import('firebase/analytics')
    .then(({ isSupported, getAnalytics }) =>
      isSupported().then((ok) => { if (ok) getAnalytics(app) })
    )
    .catch(() => {})
}
