'use client'

import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'lidia-waterings'
const POUR_MS = 1400
const DROPS = [0, 1, 2, 3, 4]

// Line-drawn watering can. Clicking it tips the can, drips water down onto the photo in the same
// card, and briefly perks that photo up. The count is remembered in this visitor's browser only.
export default function WateringCan() {
  const root = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [pours, setPours] = useState(0)
  const [pouring, setPouring] = useState(false)

  useEffect(() => {
    try { setCount(Number(localStorage.getItem(STORAGE_KEY)) || 0) } catch {}
  }, [])

  useEffect(() => {
    if (!pours) return
    setPouring(true)
    const photo = root.current?.closest('article')?.querySelector('.carousel')
    const landed = setTimeout(() => photo?.classList.add('is-watered'), 650)
    const done = setTimeout(() => { setPouring(false); photo?.classList.remove('is-watered') }, POUR_MS + 600)
    return () => { clearTimeout(landed); clearTimeout(done); photo?.classList.remove('is-watered') }
  }, [pours])

  const water = () => {
    if (pouring) return
    const next = count + 1
    setCount(next)
    setPours((n) => n + 1)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
  }

  return (
    <div className="life-strip watering" ref={root}>
      <button type="button" className={`watering-can${pouring ? ' is-pouring' : ''}`} onClick={water} aria-label="Water Lidia">
        <svg viewBox="0 0 90 64" aria-hidden="true">
          <path d="M20 26 C20 8 46 8 46 26" />
          <path d="M14 26 H52 L47 58 H19 Z" />
          <path d="M47 50 L78 23 M48 42 L75 20" />
          <path d="M73 16 L83 27" className="watering-rose" />
          <path d="M22 36 H44" className="watering-band" />
        </svg>
      </button>
      {pouring && (
        <span key={pours} className="watering-drops" aria-hidden="true">
          {DROPS.map((i) => <i key={i} style={{ animationDelay: `${0.35 + i * 0.12}s`, left: `${i * 4 - 8}px` }} />)}
        </span>
      )}
      <div className="watering-meta">
        <span className="watering-hint">{pouring ? 'watering…' : 'tap the can'}</span>
        <span>{count === 0 ? 'not watered yet' : `watered ${count}×`}</span>
      </div>
    </div>
  )
}
