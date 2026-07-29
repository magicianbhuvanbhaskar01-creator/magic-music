import React, { useEffect, useRef, useState } from 'react'

export default function Player({ track, onClose }){
  const audioRef = useRef()
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(1)

  useEffect(()=>{
    const a = audioRef.current
    if(!a) return
    a.volume = volume
  },[volume])

  useEffect(()=>{
    const onVis = ()=>{
      if(document.hidden){
        audioRef.current && audioRef.current.pause()
        setPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return ()=> document.removeEventListener('visibilitychange', onVis)
  },[])

  function toggle(){
    const a = audioRef.current
    if(!a) return
    if(playing){ a.pause(); setPlaying(false) }
    else { a.play().catch(()=>{}); setPlaying(true) }
  }

  return (
    <div className="player-full">
      <button className="close" onClick={onClose}>✕</button>
      <div className="player-center">
        <audio ref={audioRef} src={track.url} preload="auto" />
        <button className="big-play" onClick={toggle}>{playing? 'Pause' : 'Play'}</button>
        <div className="volume-vertical">
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e=> setVolume(e.target.value)} />
        </div>
        <div className="track-meta">
          <h3>{track.title}</h3>
          <p>{track.instructions}</p>
        </div>
      </div>
    </div>
  )
}
