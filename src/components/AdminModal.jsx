import React, { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc
} from 'firebase/firestore'

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth'

import { auth, db } from '../firebase'
import { uploadToCloudinary } from '../cloudinary'

const DEFAULT_ADMIN_EMAIL =
  'bhuvanbhaskar924@gmail.com'

const DEFAULT_OPERATOR_PASSWORD =
  'Music@123'

const DEFAULT_ADMIN_PASSWORD =
  'Bhuvan@123'

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    data
  )

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map(byte =>
      byte.toString(16).padStart(2, '0')
    )
    .join('')
}

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes'

  const units = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(
    Math.log(bytes) / Math.log(1024)
  )

  return (
    (bytes / Math.pow(1024, i)).toFixed(
      i === 0 ? 0 : 2
    ) +
    ' ' +
    units[i]
  )
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(
    0,
    Math.round(seconds || 0)
  )

  const minutes = Math.floor(
    totalSeconds / 60
  )

  const remainingSeconds =
    totalSeconds % 60

  return (
    minutes +
    ':' +
    String(remainingSeconds).padStart(2, '0')
  )
}
function getDuration(file) {
  return new Promise(resolve => {
    try {
      const url = URL.createObjectURL(file)
      const audio = new Audio()

      audio.preload = 'metadata'
      audio.src = url

      audio.onloadedmetadata = () => {
        const duration = Number(audio.duration)

        URL.revokeObjectURL(url)

        resolve(
          Number.isFinite(duration)
            ? Math.round(duration)
            : 0
        )
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(0)
      }
    } catch {
      resolve(0)
    }
  })
}

export default function AdminModal({ onClose }) {
  const [step, setStep] = useState('login')

  const [email, setEmail] = useState(
    import.meta.env.VITE_ADMIN_EMAIL ||
      DEFAULT_ADMIN_EMAIL
  )

  const [password, setPassword] = useState('')

  const [tracks, setTracks] = useState([])

  const [title, setTitle] = useState('')
  const [instructions, setInstructions] =
    useState('')

  const [file, setFile] = useState(null)

  const [operatorPassword, setOperatorPassword] =
    useState('')

  const [currentAdminPassword, setCurrentAdminPassword] =
    useState('')

  const [newAdminPassword, setNewAdminPassword] =
    useState('')

  const [uploading, setUploading] = useState(false)

  /*
   * Load tracks for admin
   */
  useEffect(() => {
    if (step !== 'panel') return

    const tracksQuery = query(
      collection(db, 'tracks'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      tracksQuery,
      snapshot => {
        setTracks(
          snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
          }))
        )
      },
      error => {
        console.error(
          'Admin tracks error:',
          error
        )
      }
    )

    return () => unsubscribe()
  }, [step])

  /*
   * Load current operator instructions
   */
  useEffect(() => {
    if (step !== 'panel') return

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
        }
      },
      error => {
        console.error(
          'Settings error:',
          error
        )
      }
    )

    return () => unsubscribe()
  }, [step])

  /*
   * ADMIN LOGIN
   */
  async function handleLogin(event) {
    event.preventDefault()

    if (!email.trim()) {
      alert('Admin email enter karo.')
      return
    }

    if (!password) {
      alert('Admin password enter karo.')
      return
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      setPassword('')
      setStep('panel')
    } catch (error) {
      console.error(error)

      alert(
        'Admin login failed: ' +
          (error?.message ||
            'Incorrect email or password')
      )
    }
  }

  /*
   * LOGOUT
   */
  async function handleLogout() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error(error)
    }

    setStep('login')
    setPassword('')
  }

  /*
   * UPLOAD MUSIC
   */
  async function handleUpload(event) {
    event.preventDefault()

    if (!file) {
      alert('Audio file select karo.')
      return
    }

    if (!title.trim()) {
      alert('Music title enter karo.')
      return
    }

    if (
      file.size >
      200 * 1024 * 1024
    ) {
      alert(
        'Audio file 200 MB se badi hai.'
      )
      return
    }

    setUploading(true)

    try {
      let duration = 0

try {
  duration = await Promise.race([
    getDuration(file),
    new Promise(resolve =>
      setTimeout(() => resolve(0), 5000)
    )
  ])
} catch {
  duration = 0
}

const cloudinary =
  await uploadToCloudinary(file)

      await addDoc(
        collection(db, 'tracks'),
        {
          title: title.trim(),

          instructions:
            instructions.trim(),

          audioUrl:
            cloudinary.secure_url,

          public_id:
            cloudinary.public_id,

          bytes:
            cloudinary.bytes || file.size,

          format:
            cloudinary.format || '',

          duration,

          cloudinaryFolder:
            'magic-music',

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      )

      setTitle('')
      setFile(null)

      const fileInput =
        document.getElementById(
          'magic-music-file'
        )

      if (fileInput) {
        fileInput.value = ''
      }

      alert(
        'Music successfully uploaded.'
      )
    } catch (error) {
      console.error(
        'Upload error:',
        error
      )

      alert(
        'Upload failed: ' +
          (error?.message ||
            'Unknown error')
      )
    } finally {
      setUploading(false)
    }
  }

  /*
   * DELETE TRACK FROM WEBSITE
   */
  async function handleDelete(track) {
    const confirmed =
      window.confirm(
        `Delete "${track.title}" from Magic Music?`
      )

    if (!confirmed) return

    try {
      await deleteDoc(
        doc(
          db,
          'tracks',
          track.id
        )
      )

      /*
       * IMPORTANT:
       * We intentionally DO NOT call
       * Cloudinary delete API here.
       *
       * Cloudinary API secret must never
       * be placed inside this frontend.
       *
       * Therefore your existing Cloudinary
       * photos/videos remain safe.
       */

      alert(
        'Music website se delete ho gaya.'
      )
    } catch (error) {
      console.error(
        'Delete error:',
        error
      )

      alert(
        'Delete failed: ' +
          (error?.message ||
            'Unknown error')
      )
    }
  }

  /*
   * EDIT TRACK INSTRUCTIONS
   */
  async function editTrack(track) {
    const newInstructions =
      window.prompt(
        'Instructions edit karo:',
        track.instructions || ''
      )

    if (newInstructions === null) {
      return
    }

    try {
      await updateDoc(
        doc(
          db,
          'tracks',
          track.id
        ),
        {
          instructions:
            newInstructions,
          updatedAt:
            serverTimestamp()
        }
      )

      alert(
        'Instructions updated.'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Update failed: ' +
          (error?.message ||
            'Unknown error')
      )
    }
  }

  /*
   * SAVE GLOBAL OPERATOR INSTRUCTIONS
   */
  async function saveInstructions() {
    try {
      await setDoc(
        doc(
          db,
          'settings',
          'config'
        ),
        {
          instructions:
            instructions.trim(),
          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      )

      alert(
        'Operator instructions saved.'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Instructions save failed: ' +
          (error?.message ||
            'Unknown error')
      )
    }
  }

  /*
   * CHANGE OPERATOR PASSWORD
   */
  async function changeOperatorPassword() {
    const newPassword =
      operatorPassword.trim()

    if (!newPassword) {
      alert(
        'New operator password enter karo.'
      )
      return
    }

    if (newPassword.length < 6) {
      alert(
        'Operator password minimum 6 characters ka hona chahiye.'
      )
      return
    }

    try {
      const passwordHash =
        await hashPassword(
          newPassword
        )

      await setDoc(
        doc(
          db,
          'settings',
          'config'
        ),
        {
          operatorPasswordHash:
            passwordHash,

          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      )

      setOperatorPassword('')

      alert(
        'Operator password successfully changed.'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Password update failed: ' +
          (error?.message ||
            'Unknown error')
      )
    }
  }

  /*
   * CHANGE FIREBASE ADMIN PASSWORD
   */
  async function changeAdminPassword() {
    if (!currentAdminPassword) {
      alert(
        'Current admin password enter karo.'
      )
      return
    }

    if (!newAdminPassword) {
      alert(
        'New admin password enter karo.'
      )
      return
    }

    if (newAdminPassword.length < 6) {
      alert(
        'New admin password minimum 6 characters ka hona chahiye.'
      )
      return
    }

    const currentUser =
      auth.currentUser

    if (!currentUser) {
      alert(
        'Admin session expired. Dobara login karo.'
      )

      setStep('login')
      return
    }

    try {
      /*
       * Re-authenticate before changing
       * Firebase Authentication password.
       */
      await signInWithEmailAndPassword(
        auth,
        currentUser.email,
        currentAdminPassword
      )

      await updatePassword(
        auth.currentUser,
        newAdminPassword
      )

      setCurrentAdminPassword('')
      setNewAdminPassword('')

      alert(
        'Admin password successfully changed.'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Admin password change failed: ' +
          (error?.message ||
            'Check current password')
      )
    }
  }

  /*
   * CLOSE
   */
  async function handleClose() {
    try {
      if (auth.currentUser) {
        await signOut(auth)
      }
    } catch (error) {
      console.error(error)
    }

    onClose()
  }

  return (
    <div className="admin-modal">

      <div className="admin-box">

        <button
          className="admin-close"
          onClick={handleClose}
          aria-label="Close admin panel"
        >
          ✕
        </button>

        {step === 'login' && (
          <form
            className="admin-login"
            onSubmit={handleLogin}
          >

            <div className="admin-icon">
              ⚙️
            </div>

            <h2>
              Admin Panel
            </h2>

            <p>
              Authorized admin access
            </p>

            <input
              type="email"
              value={email}
              placeholder="Admin Email"
              autoComplete="username"
              onChange={event =>
                setEmail(
                  event.target.value
                )
              }
            />

            <input
              type="password"
              value={password}
              placeholder="Admin Password"
              autoComplete="current-password"
              onChange={event =>
                setPassword(
                  event.target.value
                )
              }
            />

            <button
              type="submit"
              className="admin-primary"
            >
              LOGIN
            </button>

          </form>
        )}

        {step === 'panel' && (
          <div className="admin-panel">

            <div className="admin-title">
              <div>
                <span>
                  🪄 MAGIC MUSIC
                </span>

                <h2>
                  Admin Control
                </h2>
              </div>
            </div>

            {/* UPLOAD */}

            <section className="admin-section">

              <h3>
                🎵 Upload Music
              </h3>

              <form
                onSubmit={
                  handleUpload
                }
              >

                <input
                  type="text"
                  value={title}
                  maxLength={100}
                  placeholder="Music title"
                  onChange={event =>
                    setTitle(
                      event.target.value
                    )
                  }
                />

                <input
                  id="magic-music-file"
                  type="file"
                  accept="audio/*"
                  onChange={event =>
                    setFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />

                {file && (
                  <div className="selected-file">
                    Selected:
                    <br />
                    <strong>
                      {file.name}
                    </strong>
                    <br />
                    {formatBytes(
                      file.size
                    )}
                  </div>
                )}

                <p className="admin-note">
                  Maximum file size: 200 MB
                </p>

                <button
                  type="submit"
                  className="admin-primary"
                  disabled={uploading}
                >
                  {uploading
                    ? 'UPLOADING...'
                    : 'UPLOAD MUSIC'}
                </button>

              </form>

            </section>

            {/* INSTRUCTIONS */}

            <section className="admin-section">

              <h3>
                📝 Operator Instructions
              </h3>

              <textarea
                value={instructions}
                maxLength={3000}
                rows={8}
                placeholder={
                  '• Jab audience ko stage par bulao to music slow ya band kar dena.\n• Jab main akele stage par magic karu to sound full rakhna.'
                }
                onChange={event =>
                  setInstructions(
                    event.target.value
                  )
                }
              />

              <button
                className="admin-primary"
                onClick={
                  saveInstructions
                }
              >
                SAVE INSTRUCTIONS
              </button>

            </section>

            {/* MUSIC LIST */}

            <section className="admin-section">

              <h3>
                🎼 Manage Music
              </h3>

              {tracks.length === 0 ? (
                <div className="admin-empty">
                  No music uploaded yet.
                </div>
              ) : (
                <div className="admin-track-list">

                  {tracks.map(track => (
                    <div
                      className="admin-track"
                      key={track.id}
                    >

                      <div className="admin-track-info">

                        <strong>
                          {track.title ||
                            'Untitled'}
                        </strong>

                        <span>
                          {track.duration
                            ? formatDuration(
                                track.duration
                              )
                            : 'Unknown duration'}
                        </span>

                        <span>
                          {track.bytes
                            ? formatBytes(
                                track.bytes
                              )
                            : ''}
                        </span>

                      </div>

                      <div className="admin-track-actions">

                        <a
                          href={
                            track.audioUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="admin-download"
                        >
                          Download
                        </a>

                        <button
                          onClick={() =>
                            editTrack(
                              track
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="danger"
                          onClick={() =>
                            handleDelete(
                              track
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* PASSWORDS */}

            <section className="admin-section">

              <h3>
                🔐 Password Settings
              </h3>

              <div className="password-group">

                <h4>
                  Operator Password
                </h4>

                <input
                  type="password"
                  value={
                    operatorPassword
                  }
                  placeholder="New operator password"
                  autoComplete="new-password"
                  onChange={event =>
                    setOperatorPassword(
                      event.target.value
                    )
                  }
                />

                <button
                  className="admin-primary"
                  onClick={
                    changeOperatorPassword
                  }
                >
                  CHANGE OPERATOR PASSWORD
                </button>

              </div>

              <div className="password-group">

                <h4>
                  Admin Password
                </h4>

                <input
                  type="password"
                  value={
                    currentAdminPassword
                  }
                  placeholder="Current admin password"
                  autoComplete="current-password"
                  onChange={event =>
                    setCurrentAdminPassword(
                      event.target.value
                    )
                  }
                />

                <input
                  type="password"
                  value={
                    newAdminPassword
                  }
                  placeholder="New admin password"
                  autoComplete="new-password"
                  onChange={event =>
                    setNewAdminPassword(
                      event.target.value
                    )
                  }
                />

                <button
                  className="admin-primary"
                  onClick={
                    changeAdminPassword
                  }
                >
                  CHANGE ADMIN PASSWORD
                </button>

              </div>

            </section>

            {/* LOGOUT */}

            <button
              className="admin-logout"
              onClick={
                handleLogout
              }
            >
              🔒 LOGOUT
            </button>

          </div>
        )}

      </div>

    </div>
  )
}
