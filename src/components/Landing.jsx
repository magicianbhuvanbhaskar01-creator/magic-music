import React, { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '../firebase'

export default function Landing({ onSelectTrack }) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [tracks, setTracks] = useState([])
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db) return

    setLoading(true)

    const q = query(
      collection(db, 'tracks'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }))

        setTracks(list)
        setLoading(false)
      },
      err => {
        console.error(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!db) return

    const settingsRef = doc(db, 'settings', 'config')

    getDoc(settingsRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          setInstructions(data.instructions || '')
        }
      })
      .catch(error => {
        console.error('Instructions error:', error)
      })
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setUnlocked(false)
        setPassword('')
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      )
    }
  }, [])

  async function unlockSite(e) {
    e.preventDefault()

    if (!db) {
      setError('Database unavailable')
      return
    }

    try {
      const settingsRef = doc(db, 'settings', 'config')
      const snapshot = await getDoc(settingsRef)

      if (!snapshot.exists()) {
        setError('Password settings not found')
        return
      }

      const data = snapshot.data()
      const correctPassword = data.operatorPassword

      if (password === correctPassword) {
        setUnlocked(true)
        setPassword('')
        setError('')
      } else {
        setError('❌ Incorrect password')
        setPassword('')
      }
    } catch (err) {
      console.error(err)
      setError('Unable to verify password')
    }
  }

  if (!unlocked) {
    return (
      <div className="landing">
        <div className="pw-box">
          <div className="magic-icon">🪄</div>

          <h1>MAGIC MUSIC</h1>

          <p className="welcome">
            Hello Magician Bhuvan
          </p>

          <p className="subtitle">
            Enter operator password to continue
          </p>

          <form onSubmit={unlockSite}>
            <input
              type="password"
              value={password}
              placeholder="Enter Password"
              autoComplete="off"
              onChange={e => setPassword(e.target.value)}
            />

            <button type="submit">
              OPEN MUSIC
            </button>
          </form>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="landing unlocked">

      <div className="music-header">
        <div>
          <div className="brand-small">
            🪄 MAGIC MUSIC
          </div>

          <h2>
            Bhuvan's Magic Music
          </h2>
        </div>
      </div>

      <div className="track-list">

        {loading && (
          <div className="loading">
            Loading music...
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <div className="empty">
            No music uploaded yet
          </div>
        )}

        {tracks.map(track => (
          <button
            key={track.id}
            className="track-card"
            onClick={() => onSelectTrack(track)}
          >
            <div className="track-icon">
              ▶
            </div>

            <div className="track-info">
              <div className="track-title">
                {track.title || 'Untitled Track'}
              </div>

              {track.duration > 0 && (
                <div className="track-duration">
                  {formatDuration(track.duration)}
                </div>
              )}
            </div>

            <div className="track-arrow">
              ›
            </div>
          </button>
        ))}

      </div>

      <div className="operator-instructions">

        <h3>
          📝 Operator Instructions
        </h3>

        {instructions ? (
          <div className="instructions-content">
            {instructions
              .split('\n')
              .filter(line => line.trim())
              .map((line, index) => (
                <div
                  key={index}
                  className="instruction-line"
                >
                  <span>•</span>
                  <span>{line.trim()}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="instructions-content">
            <div className="instruction-line">
              <span>•</span>
              <span>
                Jab main kisi audience ko stage par bulaun,
                music slow ya band kar dena.
              </span>
            </div>

            <div className="instruction-line">
              <span>•</span>
              <span>
                Jab main akele stage par magic karun,
                sound full rakhna.
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}

function formatDuration(seconds) {
  const total = Math.round(Number(seconds))

  if (!total || total < 1) {
    return ''
  }

  const minutes = Math.floor(total / 60)
  const secs = total % 60

  return `${minutes}:${secs
    .toString()
    .padStart(2, '0')}`
}
