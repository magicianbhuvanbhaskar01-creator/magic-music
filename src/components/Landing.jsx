import React, { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, doc, onSnapshot as onDocSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function Landing({ onSelectTrack }){
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [operatorPass, setOperatorPass] = useState(null)

  useEffect(()=>{
    if(!db) return
    setLoading(true)
    const q = query(collection(db, 'tracks'), orderBy('createdAt','desc'))
    const unsub = onSnapshot(q, snap=>{
      const docs = snap.docs.map(d=> ({ id: d.id, ...d.data() }))
      setTracks(docs)
      setLoading(false)
    }, err=>{ console.error(err); setLoading(false) })
    return ()=> unsub()
  },[])

  useEffect(()=>{
    const onVis = ()=>{
      if(document.hidden){
        setUnlocked(false)
        setPassword('')
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return ()=> document.removeEventListener('visibilitychange', onVis)
  },[])

  useEffect(()=>{
    if(!db) return
    const settingsRef = doc(db, 'settings', 'config')
    const unsub = onDocSnapshot(settingsRef, snap=>{
      if(snap.exists()){
        const data = snap.data()
        setOperatorPass(data.operatorPassword || import.meta.env.VITE_OPERATOR_PASSWORD || 'Music@123')
      }else{
        setOperatorPass(import.meta.env.VITE_OPERATOR_PASSWORD || 'Music@123')
      }
    })
    return ()=> unsub()
  },[])

  function tryUnlock(e){
    e.preventDefault()
    const pass = operatorPass || import.meta.env.VITE_OPERATOR_PASSWORD || 'Music@123'
    if(password === pass) setUnlocked(true)
    else alert('Ghalat password')
  }

  return (
    <div className="landing">
      {!unlocked ? (
        <form className="pw-box" onSubmit={tryUnlock}>
          <h2>Hello magician bhuvan</h2>
          <input type="password" value={password} placeholder="Password" onChange={e=> setPassword(e.target.value)} />
          <button type="submit">Open</button>
          <p className="note">Enter operator password to see music list</p>
        </form>
      ) : (
        <div className="track-list">
          <h2>Tracks</h2>
          {loading && <p>Loading...</p>}
          {tracks.map(t=> (
            <div className="track" key={t.id} onClick={()=> onSelectTrack(t)}>
              <div className="title">{t.title || 'Untitled'}</div>
              <div className="instructions">{t.instructions || 'No instructions'}</div>
            </div>
          ))}
          {tracks.length===0 && !loading && <p>No tracks yet (admin can upload)</p>}
        </div>
      )}
    </div>
  )
}
