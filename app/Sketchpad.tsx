'use client'

import { useEffect, useRef } from 'react'

type Stroke = { points: { x: number; y: number }[]; ended: number | null }

const FADE_MS = 4000

// A small strip visitors can doodle on. Strokes fade a few seconds after the pen lifts,
// so it never fills up and nothing is stored.
export default function Sketchpad() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let color = ''
    let frame = 0
    const strokes: Stroke[] = []
    let current: { stroke: Stroke; id: number } | null = null

    const readTheme = () => { color = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const now = performance.now()
      for (let i = strokes.length - 1; i >= 0; i--) {
        const { ended } = strokes[i]
        if (ended !== null && now - ended > FADE_MS) strokes.splice(i, 1)
      }
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const { points, ended } of strokes) {
        ctx.globalAlpha = ended === null ? 1 : 1 - (now - ended) / FADE_MS
        ctx.beginPath()
        points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
        if (points.length === 1) ctx.lineTo(points[0].x + 0.1, points[0].y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      frame = strokes.length ? requestAnimationFrame(draw) : 0
    }
    const wake = () => { if (!frame) frame = requestAnimationFrame(draw) }

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      const stroke = { points: [local(e)], ended: null }
      strokes.push(stroke)
      current = { stroke, id: e.pointerId }
      wake()
    }
    const onMove = (e: PointerEvent) => {
      if (current && e.pointerId === current.id) current.stroke.points.push(local(e))
    }
    const onUp = (e: PointerEvent) => {
      if (!current || e.pointerId !== current.id) return
      current.stroke.ended = performance.now()
      current = null
    }

    readTheme()
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const themeObserver = new MutationObserver(readTheme)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="life-strip sketchpad">
      <canvas ref={canvasRef} aria-label="Sketchpad: draw with your cursor or finger" role="img" />
    </div>
  )
}
