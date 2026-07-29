import React, { useEffect, useState } from 'react'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { db } from '../firebase'
import { uploadToCloudinary } from '../cloudinary'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'

export default function AdminModal({ onClose }){
  const [step, setStep] = useState('login')
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '')
  const [password, setPassword] = useState('')
  const [tracks, setTracks] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')

  useEffect(()=>{
    if(!db) return
    const q = query(collection(db,'tracks'), orderBy('createdAt','desc'))
    const unsub = onSnapshot(q, snap=> setTracks(snap.docs.map(d=> ({ id:d.id, ...d.data() }))))
    return ()=> unsub()
  },[])

  async function login(e){
    e.preventDefault()
    try{
      const auth = getAuth()
      await signInWithEmailAndPassword(auth, email, password)
      setStep('panel')
    }catch(err){
      alert('Login failed: '+err.message)
    }
  }

  async function logout(){
    const auth = getAuth()
    await signOut(auth)
    setStep('login')
  }

  async function handleUpload(e){
    e.preventDefault()
    if(!file) return alert('Choose file')
    try{
      const res = await uploadToCloudinary(file)
      await addDoc(collection(db,'tracks'),{
        title: title || file.name,
        instructions,
        url: res.secure_url,
        public_id: res.public_id,
        bytes: res.bytes,
        createdAt: serverTimestamp()
      })
      setTitle(''); setInstructions(''); setFile(null)
      alert('Uploaded')
    }catch(err){
      console.error(err)
      alert('Upload error: '+err.message)
    }
  }

  async function removeTrack(t){
    if(!confirm('Delete this track?')) return
    try{
      await deleteDoc(doc(db,'tracks', t.id))
      alert('Deleted (Cloudinary asset remains unless you delete from Cloudinary console)')
    }catch(err){ alert('Delete failed: '+err.message) }
  }

  async function editInstructions(t){
    const ni = prompt('Edit instructions', t.instructions || '')
    if(ni==null) return
    await updateDoc(doc(db,'tracks', t.id), { instructions: ni })
  }

  return (
    <div className="admin-modal">
      <div className="admin-box">
        <button className="close" onClick={onClose}>✕</button>
        {step==='login' && (
          <form onSubmit={login} className="admin-login">
            <h3>Admin login</h3>
            <input placeholder="Email" value={email} onChange={e=> setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={e=> setPassword(e.target.value)} />
            <button type="submit">Login</button>
            <p className="note">Use Firebase console to create admin user if needed</p>
          </form>
        )}

        {step==='panel' && (
          <div className="admin-panel">
            <h3>Admin Panel</h3>
            <form onSubmit={handleUpload} className="upload-form">
              <input placeholder="Title" value={title} onChange={e=> setTitle(e.target.value)} />
              <textarea placeholder="Instructions (point by point)" value={instructions} onChange={e=> setInstructions(e.target.value)} />
              <input type="file" accept="audio/*" onChange={e=> setFile(e.target.files[0])} />
              <button type="submit">Upload to Cloudinary</button>
            </form>

            <div className="tracks-admin">
              <h4>Tracks</h4>
              {tracks.map(t=> (
                <div key={t.id} className="admin-track">
                  <div>
                    <strong>{t.title}</strong>
                    <div className="small">{t.instructions}</div>
                  </div>
                  <div className="actions">
                    <a href={t.url} target="_blank" rel="noreferrer">Download</a>
                    <button onClick={()=> editInstructions(t)}>Edit</button>
                    <button onClick={()=> removeTrack(t)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-logout">
              <button onClick={logout}>Logout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
