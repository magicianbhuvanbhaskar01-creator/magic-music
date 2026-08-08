import React, { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'

import { auth, db } from '../firebase'

const OPERATOR_EMAIL = 'operator@magicmusic.com'

export default function Landing({ onSelectTrack }) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [tracks, setTracks] = useState([])
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check operator login session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user && user.email === OPERATOR_EMAIL) {
        setUnlocked(true)
      } else {
        setUnlocked(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Load music only after operator login
  useEffect(() => {
    if (!unlocked) {
      setTracks([])
      return
    }

    setLoading(true)

    const tracksQuery = query(
      collection(db, 'tracks'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      tracksQuery,
      snapshot => {
        const list = snapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }))

        setTracks(list)
        setLoading(false)
      },
      err => {
        console.error('Music loading error:', err)
        setError('Music load nahi ho saka.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [unlocked])

  // Load operator instructions
  useEffect(() => {
    if (!unlocked) {
      setInstructions('')
      return
    }

    const instructionsRef = query(
      collection(db, 'settings')
    )

    const unsubscribe = onSnapshot(
      instructionsRef,
      snapshot => {
        const publicSettings = snapshot.docs.find(
          item => item.id === 'public'
        )

        if (publicSettings) {
          setInstructions(
            publicSettings.data().instructions || ''
          )
        } else {
          setInstructions('')
        }
      },
      err => {
        console.error('Instruction loading error:', err)
      }
    )

    return () => unsubscribe()
  }, [unlocked])

  // Lock the operator session when leaving the page/tab
  useEffect(() => {
    async function handleVisibility() {
      if (document.hidden && auth.currentUser) {
        try {
          await signOut(auth)
        } catch (err) {
          console.error(err)
        }

        setUnlocked(false)
        setPassword('')
        setTracks([])
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

  async function handleLogin(event) {
    event.preventDefault()

    if (!password.trim()) {
      setError('Password enter karo.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(
        auth,
        OPERATOR_EMAIL,
        password
      )

      setPassword('')
      setUnlocked(true)
    } catch (err) {
      console.error(err)

      setError('Incorrect password.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  async function handleLock() {
    try {
      await signOut(auth)
    } catch (err) {
      console.error(err)
    }

    setUnlocked(false)
    setPassword('')
    setTracks([])
  }

  if (!unlocked) {
    return (
      <main className="login-page">
        <div className="login-card">

          <div className="magic-symbol">
            🪄
          </div>

          <h1>
            MAGIC MUSIC
          </h1>

          <p className="subtitle">
            Hello Magician Bhuvan
          </p>

          <form onSubmit={handleLogin}>

            <input
              type="password"
              value={password}
              placeholder="Enter Password"
              autoComplete="off"
              onChange={event =>
                setPassword(event.target.value)
              }
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'OPENING...'
                : 'OPEN MUSIC'}
            </button>

          </form>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}

          <p className="login-note">
            Private operator access
          </p>

        </div>
      </main>
    )
  }

  return (
    <main className="music-page">

      <header className="music-header">

        <div>
          <div className="brand-small">
            🪄 MAGIC MUSIC
          </div>

          <h2>
            Choose Music
          </h2>
        </div>

        <button
          className="small-logout"
          onClick={handleLock}
        >
          🔒 Lock
        </button>

      </header>

      <section className="track-list">

        {loading && (
          <div className="empty-state">
            Loading music...
          </div>
        )}

        {!loading &&
          tracks.map(track => (
            <button
              className="track-card"
              key={track.id}
              onClick={() => onSelectTrack(track)}
            >

              <div className="track-icon">
                🎵
              </div>

              <div className="track-info">

                <strong>
                  {track.title || 'Untitled'}
                </strong>

                <span>
                  {track.duration
                    ? formatDuration(track.duration)
                    : 'Audio track'}
                </span>

              </div>

              <div className="track-arrow">
                ›
              </div>

            </button>
          ))}

        {!loading &&
          tracks.length === 0 && (
            <div className="empty-state">
              No music uploaded yet.
            </div>
          )}

      </section>

      <section className="instructions-card">

        <div className="section-title">
          📝 Operator Instructions
        </div>

        <div className="instruction-content">

          {instructions ? (
            formatInstructions(instructions)
          ) : (
            <>
              <p>
                • Jab audience ko stage par bulao,
                music slow ya band kar dena.
              </p>

              <p>
                • Jab main akele stage par magic
                karu, sound full rakhna.
              </p>

              <p>
                • Show ke situation ke according
                volume adjust karna.
              </p>
            </>
          )}

        </div>

      </section>

    </main>
  )
}

function formatDuration(seconds) {
  const total = Number(seconds)

  if (!Number.isFinite(total)) {
    return ''
  }

  const minutes = Math.floor(total / 60)
  const secondsPart = Math.floor(total % 60)

  return `${minutes}:${String(secondsPart).padStart(2, '0')}`
}

function formatInstructions(text) {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map((line, index) => (
      <p key={index}>
        {line}
      </p>
    ))
              }
