import React, { useEffect, useState } from 'react'

import Landing from './components/Landing'
import Player from './components/Player'
import AdminModal from './components/AdminModal'

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminClicks, setAdminClicks] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState(null)

  // 7 clicks within 3 seconds = Admin Panel
  useEffect(() => {
    if (adminClicks === 0) return

    const timer = setTimeout(() => {
      setAdminClicks(0)
    }, 3000)

    return () => clearTimeout(timer)
  }, [adminClicks])

  useEffect(() => {
    function handleGlobalClick() {
      setAdminClicks(current => {
        const next = current + 1

        if (next >= 7) {
          setShowAdmin(true)
          return 0
        }

        return next
      })
    }

    window.addEventListener('click', handleGlobalClick)

    return () => {
      window.removeEventListener('click', handleGlobalClick)
    }
  }, [])

  // Close player when browser/tab becomes hidden
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        setSelectedTrack(null)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      )
    }
  }, [])

  return (
    <div className="app-root">

      <Landing
        onSelectTrack={track => {
          setSelectedTrack(track)
        }}
      />

      {selectedTrack && (
        <Player
          track={selectedTrack}
          onClose={() => {
            setSelectedTrack(null)
          }}
        />
      )}

      {showAdmin && (
        <AdminModal
          onClose={() => {
            setShowAdmin(false)
            setAdminClicks(0)
          }}
        />
      )}

    </div>
  )
}
