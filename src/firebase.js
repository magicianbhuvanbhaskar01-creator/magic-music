import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore'

let app = null
let auth = null
let db = null

export async function ensureSettings() {
  if (!db) return

  try {
    const settingsRef = doc(db, 'settings', 'config')
    const snap = await getDoc(settingsRef)

    if (!snap.exists()) {
      await setDoc(settingsRef, {
        operatorPassword: 'Music@123',
        appSettings: {}
      })

      console.log('Default settings created')
    }
  } catch (error) {
    console.error('Settings error:', error)
  }
}

export function initFirebase() {
  if (app) return

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.appId
  ) {
    console.error('Firebase configuration is missing.')
    return
  }

  try {
    app = initializeApp(firebaseConfig)

    auth = getAuth(app)
    db = getFirestore(app)

    ensureSettings()
  } catch (error) {
    console.error('Firebase initialization failed:', error)
  }
}

export { app, auth, db }
