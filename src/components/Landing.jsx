import React, { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc
} from 'firebase/firestore'

import { db } from '../firebase'

const DEFAULT_OPERATOR_PASSWORD_HASH =
  '10d0babae0f518ec6a5d49e740bf6ffb55bac87613674c7ebb11734148561663'

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    data
  )

  const hashArray = Array.from(
    new Uint8Array(hashBuffer)
  )

  return hashArray
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export default function Landing({ onSelectTrack }) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [tracks, setTracks] = useState([])
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /*
   * Load tracks only after password unlock.
   */
  useEffect(() => {
    if (!unlocked) {
      setTracks([])
      return
    }

    setLoading(true)
    setError('')

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
        console.error('Tracks error:', err)
        setError('Music load nahi ho saka.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [unlocked])

  /*
   * Load operator instructions.
   */
  useEffect(() => {
    if (!unlocked) {
      setInstructions('')
      return
    }

    const settingsRef = doc(
      db,
      'settings',
      'config'
    )

    const unsubscribe = onSnapshot(
      settingsRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data()

          setInstructions(
            data.instructions || ''
          )
        } else {
          setInstructions('')
        }
      },
      err => {
        console.error(
          'Instructions error:',
          err
        )
      }
    )

    return () => unsubscribe()
  }, [unlocked])

  /*
   * Automatically lock when the browser/tab
   * becomes hidden.
   */
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        setUnlocked(false)
        setPassword('')
        setTracks([])
        setInstructions('')
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
      const enteredHash =
        await hashPassword(password)

      const settingsRef = doc(
        db,
        'settings',
        'config'
      )

      let storedHash =
        DEFAULT_OPERATOR_PASSWORD_HASH

      /*
       * Read the password hash from Firestore.
       * If the document does not exist yet,
       * the default Music@123 hash is used.
       */
      try {
        const { getDoc } = await import(
          'firebase/firestore'
        )

        const snapshot =
          await getDoc(settingsRef)

        if (snapshot.exists()) {
          const data = snapshot.data()

          if (
            typeof data.operatorPasswordHash ===
            'string' &&
            data.operatorPasswordHash.length > 0
          ) {
            storedHash =
              data.operatorPasswordHash
          }
        }
      } catch (readError) {
        console.error(
          'Password settings error:',
          readError
        )
      }

      if (enteredHash === storedHash) {
        setUnlocked(true)
        setPassword('')
        setError('')
      } else {
        setError('Incorrect password.')
        setPassword('')
      }
    } catch (err) {
      console.error(err)
      setError('Login error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function lockSite() {
    setUnlocked(false)
    setPassword('')
    setTracks([])
    setInstructions('')
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
              maxLength={100}
              onChange={event =>
                setPassword(
                  event.target.value
                )
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
          onClick={lockSite}
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
              onClick={() =>
                onSelectTrack(track)
              }
            >

              <div className="track-icon">
                🎵
              </div>

              <div className="track-info">

                <strong>
                  {track.title ||
                    'Untitled'}
                </strong>

                <span>
                  {track.duration
                    ? formatDuration(
                        track.duration
                      )
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
            formatInstructions(
              instructions
            )
          ) : (
            <>
              <p>
                • Jab audience ko stage par
                bulao, music slow ya band
                kar dena.
              </p>

              <p>
                • Jab main akele stage par
                magic karu, sound full rakhna.
              </p>

              <p>
                • Show ke situation ke
                according volume adjust karna.
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
  const secondsPart =
    Math.floor(total % 60)

  return `${minutes}:${String(
    secondsPart
  ).padStart(2, '0')}`
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
