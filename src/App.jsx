import React, { useEffect, useState } from 'react'
import Landing from './components/Landing'
import Player from './components/Player'
import AdminModal from './components/AdminModal'
import { initFirebase } from './firebase'

initFirebase()

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminClicks, setAdminClicks] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState(null)

  // 7 consecutive rapid taps → Admin Panel
useEffect(() => {
  let timer = null

  const handleClick = () => {
    setAdminClicks(prev => {
      const next = prev + 1

      // Exactly 7 consecutive taps
      if (next === 7) {
        setShowAdmin(true)

        if (timer) {
          clearTimeout(timer)
          timer = null
        }

        return 0
      }

      return next
    })

    // If the next tap doesn't happen quickly,
    // the sequence starts again from 0.
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      setAdminClicks(0)
      timer = null
    }, 1000)
  }

  window.addEventListener('click', handleClick)

  return () => {
    window.removeEventListener('click', handleClick)

    if (timer) {
      clearTimeout(timer)
    }
  }
}, [])

  return (
    <div className="app-root">

      <Landing
        onSelectTrack={(track) => {
          setSelectedTrack(track)
        }}
      />

      {selectedTrack && (
        <Player
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}

      {showAdmin && (
        <AdminModal
          onClose={() => setShowAdmin(false)}
        />
      )}

    </div>
  )
}
