import React, { useEffect, useState } from 'react'
import Landing from './components/Landing'
import Player from './components/Player'
import AdminModal from './components/AdminModal'
import { initFirebase } from './firebase'

initFirebase()

export default function App(){
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminClicks, setAdminClicks] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState(null)

  useEffect(()=>{
    let timer
    if(adminClicks>0){
      timer = setTimeout(()=> setAdminClicks(0), 3000)
    }
    return ()=> clearTimeout(timer)
  },[adminClicks])

  // 7-click anywhere to open admin
  useEffect(()=>{
    const onClick = ()=>{
      setAdminClicks(c=>{
        const nc = c+1
        if(nc>=7){
          setShowAdmin(true)
          return 0
        }
        return nc
      })
    }
    window.addEventListener('click', onClick)
    return ()=> window.removeEventListener('click', onClick)
  },[])

  return (
    <div className="app-root">
      <Landing onSelectTrack={t=> setSelectedTrack(t)} />

      {selectedTrack && (
        <Player track={selectedTrack} onClose={()=> setSelectedTrack(null)} />
      )}

      {showAdmin && (
        <AdminModal onClose={()=> setShowAdmin(false)} />
      )}

      <footer className="hint">(7 taps anywhere opens admin)</footer>
    </div>
  )
}
