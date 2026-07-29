import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

let app, auth, db

export function initFirebase(){
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if(!apiKey){
    console.warn('Firebase config missing. Fill .env.local')
    return
  }
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { auth, db }
