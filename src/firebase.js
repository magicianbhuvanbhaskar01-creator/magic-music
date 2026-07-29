import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

let app, auth, db

export async function ensureSettings(){
  if(!db) return
  try{
    const settingsRef = doc(db, 'settings', 'config')
    const snap = await getDoc(settingsRef)
    if(!snap.exists()){
      const defaultPass = import.meta.env.VITE_OPERATOR_PASSWORD || 'Music@123'
      await setDoc(settingsRef, {
        operatorPassword: defaultPass,
        appSettings: {}
      })
      console.log('Created default settings document')
    }
  }catch(err){
    console.error('ensureSettings error', err)
  }
}

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

  // Ensure settings doc exists on first start
  ensureSettings()
}

export { auth, db }
