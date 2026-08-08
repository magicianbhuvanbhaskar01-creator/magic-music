import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAa_ZVk_m6aXXm8ygCKNd0EQtaQZDMnBrg',
  authDomain: 'music-site-d1baf.firebaseapp.com',
  projectId: 'music-site-d1baf',
  appId: '1:813329988297:web:79347fd497edb8a5562b18'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
