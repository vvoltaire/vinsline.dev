'use client'

import { useEffect, useRef } from 'react'

const GAUGES = [0.8, 1, 1.3, 1.6, 2, 2.4] // px, high e at the top down to low E
const FRETS = [0.2, 0.4, 0.58, 0.74, 0.88] // fret positions as a fraction of the width
const SEGMENTS = 80
const TENSION = 0.3 // wave speed along a string (stable below 1)
const DAMPING = 0.985 // per substep; lower settles faster
const SUBSTEPS = 2
const MAX_PULL = 16 // px a string can be pulled

// Six strummable strings. Each is a 1D wave-equation string: moving the mouse across a string
// strums it, dragging pulls it, and on touch a tap plucks the nearest one. Purely visual.
export default function GuitarStrings() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    const u = GAUGES.map(() => new Float32Array(SEGMENTS + 1))
    const v = GAUGES.map(() => new Float32Array(SEGMENTS + 1))
    let stringColor = ''
    let fretColor = ''
    let frame = 0
    let last: { x: number; y: number } | null = null
    let grab: { string: number; id: number; x: number; y: number } | null = null

    const baseY = (i: number) => 8 + (i * (height - 16)) / (GAUGES.length - 1)
    const column = (x: number) => (x / width) * SEGMENTS

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement)
      stringColor = styles.getPropertyValue('--green').trim()
      fretColor = styles.getPropertyValue('--ink-faint').trim()
    }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Bend the string at x by `amount` px. Displacing it (rather than pushing its velocity) makes it
    // ring like a real pluck instead of sagging into a plateau.
    const kick = (i: number, x: number, amount: number) => {
      const c = column(x)
      for (let j = 1; j < SEGMENTS; j++) u[i][j] += amount * Math.exp(-(((j - c) / 6) ** 2))
    }

    const step = () => {
      if (grab) {
        const c = Math.max(1, Math.min(SEGMENTS - 1, column(grab.x)))
        const pull = Math.max(-MAX_PULL, Math.min(MAX_PULL, grab.y - baseY(grab.string)))
        const line = u[grab.string], vel = v[grab.string]
        for (let j = 1; j < SEGMENTS; j++) {
          // Tent shape from both fixed ends to the finger, like a string pushed sideways.
          line[j] = pull * (j <= c ? j / c : (SEGMENTS - j) / (SEGMENTS - c))
          vel[j] = 0
        }
      }
      let energy = 0
      for (let s = 0; s < SUBSTEPS; s++) {
        for (let i = 0; i < GAUGES.length; i++) {
          if (grab?.string === i) continue
          const line = u[i], vel = v[i]
          for (let j = 1; j < SEGMENTS; j++) vel[j] = (vel[j] + TENSION * (line[j - 1] - 2 * line[j] + line[j + 1])) * DAMPING
          for (let j = 1; j < SEGMENTS; j++) line[j] += vel[j]
        }
      }
      for (let i = 0; i < GAUGES.length; i++) for (let j = 1; j < SEGMENTS; j++) energy += Math.abs(u[i][j]) + Math.abs(v[i][j])
      return energy
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = fretColor
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 1
      for (const f of FRETS) {
        ctx.beginPath()
        ctx.moveTo(f * width, 2)
        ctx.lineTo(f * width, height - 2)
        ctx.stroke()
      }
      ctx.strokeStyle = stringColor
      GAUGES.forEach((gauge, i) => {
        const y0 = baseY(i), line = u[i]
        let peak = 0
        ctx.beginPath()
        for (let j = 0; j <= SEGMENTS; j++) {
          peak = Math.max(peak, Math.abs(line[j]))
          const x = (j / SEGMENTS) * width
          if (j === 0) ctx.moveTo(x, y0 + line[j])
          else ctx.lineTo(x, y0 + line[j])
        }
        ctx.lineWidth = gauge
        ctx.globalAlpha = Math.min(1, 0.55 + peak / 12)
        ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    const tick = () => {
      const energy = step()
      draw()
      frame = energy > 0.05 || grab ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!frame && !reducedMotion) frame = requestAnimationFrame(tick) }

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const nearest = (y: number) => {
      let best = 0
      GAUGES.forEach((_, i) => { if (Math.abs(baseY(i) - y) < Math.abs(baseY(best) - y)) best = i })
      return best
    }

    const onMove = (e: PointerEvent) => {
      const p = local(e)
      if (grab && e.pointerId === grab.id) { grab.x = p.x; grab.y = p.y; wake(); return }
      if (e.pointerType !== 'mouse') return
      // Strum: kick every string the cursor crossed since the last move.
      if (last) {
        GAUGES.forEach((_, i) => {
          const y0 = baseY(i)
          if ((last!.y - y0) * (p.y - y0) < 0) {
            const t = (y0 - last!.y) / (p.y - last!.y)
            kick(i, last!.x + (p.x - last!.x) * t, Math.sign(p.y - last!.y) * Math.min(5, 2 + Math.abs(p.y - last!.y) * 0.2))
          }
        })
        wake()
      }
      last = p
    }
    const onLeave = () => { last = null }
    const onDown = (e: PointerEvent) => {
      if (reducedMotion || e.button !== 0) return
      const p = local(e)
      if (e.pointerType !== 'mouse') { kick(nearest(p.y), p.x, 6); wake(); return }
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      grab = { string: nearest(p.y), id: e.pointerId, x: p.x, y: p.y }
      canvas.classList.add('is-grabbing')
      wake()
    }
    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return
      grab = null
      canvas.classList.remove('is-grabbing')
      wake()
    }

    readTheme()
    resize()
    draw()
    const resizeObserver = new ResizeObserver(() => { resize(); draw() })
    resizeObserver.observe(canvas)
    const themeObserver = new MutationObserver(() => { readTheme(); draw() })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas ref={canvasRef} className="life-strip guitar-strings" aria-label="Six guitar strings: move across them to strum" role="img" />
}
