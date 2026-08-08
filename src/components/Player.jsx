import React, { useEffect, useRef, useState } from 'react'

export default function Player({ track, onClose }) {
  const audioRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(
    Number(track?.duration) || 0
  )

  /*
   * Start selected track
   */
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    audio.volume = volume

    audio.load()

    const playPromise = audio.play()

    if (playPromise) {
      playPromise
        .then(() => {
          setPlaying(true)
        })
        .catch(() => {
          setPlaying(false)
        })
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [track])

  /*
   * Volume
   */
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    audio.volume = volume
  }, [volume])

  /*
   * Pause when browser/tab becomes hidden
   */
  useEffect(() => {
    function handleVisibility() {
      const audio = audioRef.current

      if (!audio) return

      if (document.hidden) {
        audio.pause()
        setPlaying(false)
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

  /*
   * Audio events
   */
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    function handleLoadedMetadata() {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    function handleTimeUpdate() {
      setCurrentTime(audio.currentTime)
    }

    function handlePlay() {
      setPlaying(true)
    }

    function handlePause() {
      setPlaying(false)
    }

    function handleEnded() {
      setPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata
    )

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate
    )

    audio.addEventListener(
      'play',
      handlePlay
    )

    audio.addEventListener(
      'pause',
      handlePause
    )

    audio.addEventListener(
      'ended',
      handleEnded
    )

    return () => {
      audio.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      )

      audio.removeEventListener(
        'timeupdate',
        handleTimeUpdate
      )

      audio.removeEventListener(
        'play',
        handlePlay
      )

      audio.removeEventListener(
        'pause',
        handlePause
      )

      audio.removeEventListener(
        'ended',
        handleEnded
      )
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current

    if (!audio) return

    if (audio.paused) {
      audio
        .play()
        .then(() => {
          setPlaying(true)
        })
        .catch(() => {
          setPlaying(false)
        })
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  function handleVolumeChange(event) {
    const value = Number(event.target.value)

    setVolume(value)
  }

  function handleClose() {
    const audio = audioRef.current

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }

    setPlaying(false)

    onClose()
  }

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) {
      return '0:00'
    }

    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)

    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  if (!track) {
    return null
  }

  return (
    <div
      className="player-fullscreen"
      onContextMenu={event => event.preventDefault()}
    >

      <audio
        ref={audioRef}
        src={track.audioUrl}
        preload="auto"
        controls={false}
        controlsList="nodownload noplaybackrate"
        onContextMenu={event =>
          event.preventDefault()
        }
      />

      {/* Close */}
      <button
        className="player-close"
        onClick={handleClose}
        aria-label="Close player"
      >
        ✕
      </button>

      <div className="player-content">

        <div className="player-magic-icon">
          🪄
        </div>

        <p className="player-label">
          NOW PLAYING
        </p>

        <h1 className="player-title">
          {track.title || 'Untitled'}
        </h1>

        <p className="player-instructions">
          {track.instructions ||
            'Use volume according to the show.'}
        </p>

        {/* Play / Pause */}
        <button
          className="big-play-button"
          onClick={togglePlay}
          aria-label={
            playing ? 'Pause music' : 'Play music'
          }
        >
          {playing ? '❚❚' : '▶'}
        </button>

        <div className="play-status">
          {playing ? 'Playing' : 'Paused'}
        </div>

        {/* Time */}
        <div className="time-row">
          <span>
            {formatTime(currentTime)}
          </span>

          <span>
            {formatTime(duration)}
          </span>
        </div>

        {/* Large volume control */}
        <div className="volume-area">

          <div className="volume-heading">
            <span>🔊</span>
            <span>VOLUME</span>
            <strong>
              {Math.round(volume * 100)}%
            </strong>
          </div>

          <input
            className="big-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
          />

        </div>

        <p className="privacy-note">
          Private Magic Music
        </p>

      </div>
    </div>
  )
      }
