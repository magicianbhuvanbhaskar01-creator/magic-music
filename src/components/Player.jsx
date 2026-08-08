import React, { useEffect, useRef, useState } from 'react'

export default function Player({ track, onClose }) {
  const audioRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(
    Number(track?.duration) || 0
  )

  const audioUrl = track?.audioUrl || ''

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    audio.volume = volume

    return () => {
      audio.pause()
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    audio.volume = volume
  }, [volume])

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
        'ended',
        handleEnded
      )
    }
  }, [])

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        const audio = audioRef.current

        if (audio) {
          audio.pause()
        }

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

  async function togglePlay() {
    const audio = audioRef.current

    if (!audio || !audioUrl) return

    try {
      if (audio.paused) {
        await audio.play()
        setPlaying(true)
      } else {
        audio.pause()
        setPlaying(false)
      }
    } catch (error) {
      console.error(
        'Audio playback error:',
        error
      )

      setPlaying(false)
    }
  }

  function changeVolume(event) {
    const value = Number(event.target.value)

    setVolume(value)

    if (audioRef.current) {
      audioRef.current.volume = value
    }
  }

  function closePlayer() {
    const audio = audioRef.current

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }

    setPlaying(false)
    onClose()
  }

  function formatTime(value) {
    const seconds = Math.floor(
      Number(value) || 0
    )

    const minutes = Math.floor(
      seconds / 60
    )

    const remaining =
      seconds % 60

    return `${minutes}:${String(
      remaining
    ).padStart(2, '0')}`
  }

  return (
    <div className="player-full">

      <button
        className="player-close"
        onClick={closePlayer}
        aria-label="Close player"
      >
        ✕
      </button>

      <div className="player-content">

        <div className="player-icon">
          🎵
        </div>

        <h1 className="player-title">
          {track?.title ||
            'Magic Music'}
        </h1>

        <p className="player-subtitle">
          Bhuvan Magic
        </p>

        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />

        {!audioUrl ? (
          <p className="player-error">
            Audio file unavailable.
          </p>
        ) : (
          <>
            <button
              className="big-play"
              onClick={togglePlay}
              aria-label={
                playing
                  ? 'Pause'
                  : 'Play'
              }
            >
              {playing ? '❚❚' : '▶'}
            </button>

<div className="progress-area">

  <div className="time-row">
    <span>
      {formatTime(currentTime)}
    </span>

    <span>
      {formatTime(duration)}
    </span>
  </div>

  <input
    className="progress-slider"
    type="range"
    min="0"
    max={duration || 0}
    step="0.1"
    value={Math.min(
      currentTime,
      duration || 0
    )}
    onChange={event => {
      const value =
        Number(event.target.value)

      if (audioRef.current) {
        audioRef.current.currentTime =
          value
      }

      setCurrentTime(value)
    }}
    disabled={!duration}
    aria-label="Music progress"
  />

</div>

            <div className="volume-area">

              <div className="volume-label">
                🔊 Volume
              </div>

              <input
                className="volume-slider-large"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={
                  changeVolume
                }
                aria-label="Volume"
              />

              <div className="volume-value">
                {Math.round(
                  volume * 100
                )}%
              </div>

            </div>

          </>
        )}

        <div className="player-instructions">
          {track?.instructions ? (
            <>
              <h3>
                📝 Instructions
              </h3>

              <div>
                {track.instructions
                  .split('\n')
                  .filter(line =>
                    line.trim()
                  )
                  .map(
                    (line, index) => (
                      <p key={index}>
                        {line}
                      </p>
                    )
                  )}
              </div>
            </>
          ) : null}
        </div>

      </div>
    </div>
  )
            }
