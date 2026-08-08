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

  // 7 clicks anywhere → Admin Panel
  useEffect(() => {
    let timer

    const handleClick = () => {
      setAdminClicks(prev => {
        const next = prev + 1

        if (next >= 7) {
          setShowAdmin(true)
          return 0
        }

        return next
      })

      clearTimeout(timer)

      timer = setTimeout(() => {
        setAdminClicks(0)
      }, 3000)
    }

    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('click', handleClick)
      clearTimeout(timer)
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
