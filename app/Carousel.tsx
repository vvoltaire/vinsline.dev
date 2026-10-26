'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// A slide without a src renders as a styled placeholder until a real image is added.
// `position` picks the focal point when a photo is cropped to fit; `fit: 'contain'` shows the whole image instead.
export type Slide = { src?: string; alt: string; position?: string; fit?: 'contain' }

const pad = (n: number) => String(n).padStart(2, '0')
// Past this many slides, dots no longer fit and a counter replaces them.
const MAX_DOTS = 6

// `viewfinder` dresses the carousel as a camera: corner brackets, a REC light, and a shutter flash
// whenever the photo changes.
export default function Carousel({ slides, label, variant }: { slides: Slide[]; label: string; variant?: 'viewfinder' }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  // Slide the buttons are heading to; stays correct while a smooth scroll is still in flight.
  const target = useRef(0)
  const [shots, setShots] = useState(0)
  const shown = useRef(0)

  useEffect(() => {
    if (index === shown.current) return
    shown.current = index
    setShots((n) => n + 1)
  }, [index])

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const next = (i + slides.length) % slides.length
    target.current = next
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className={`carousel${variant ? ` is-${variant}` : ''}`} role="group" aria-roledescription="carousel" aria-label={label}>
      <div className="carousel-track" ref={track} onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} onScrollEnd={(e) => { target.current = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth) }}>
        {slides.map((slide, i) => (
          <div className="carousel-slide" key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
            {slide.src
              ? <img src={slide.src} alt={slide.alt} loading="lazy" className={slide.fit === 'contain' ? 'is-contained' : undefined} style={slide.position ? { objectPosition: slide.position } : undefined} />
              : <div className="carousel-placeholder"><span>{pad(i + 1)} / {pad(slides.length)}</span><span>{slide.alt}</span></div>}
          </div>
        ))}
      </div>
      {variant === 'viewfinder' && (
        <div className="viewfinder" aria-hidden="true">
          <i className="vf-corner tl" /><i className="vf-corner tr" /><i className="vf-corner bl" /><i className="vf-corner br" />
          <span className="vf-rec">REC</span>
          {shots > 0 && <span key={shots} className="vf-flash" />}
        </div>
      )}
      {slides.length > 1 && <>
        <button className="carousel-btn prev" type="button" aria-label="Previous image" onClick={() => go(target.current - 1)}><ChevronLeft size={14} /></button>
        <button className="carousel-btn next" type="button" aria-label="Next image" onClick={() => go(target.current + 1)}><ChevronRight size={14} /></button>
        {slides.length <= MAX_DOTS
          ? <div className="carousel-dots">
              {slides.map((_, i) => <button key={i} type="button" aria-label={`Show image ${i + 1}`} aria-current={i === index} onClick={() => go(i)} />)}
            </div>
          : <span className="carousel-count" aria-live="polite">{pad(index + 1)} / {pad(slides.length)}</span>}
      </>}
    </div>
  )
}
