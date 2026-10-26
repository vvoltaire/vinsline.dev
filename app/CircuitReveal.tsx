'use client'

import { useEffect, useRef } from 'react'

type Point = { x: number; y: number }
type Trace = { points: Point[]; length: number }
type Chip = { x: number; y: number; w: number; h: number; label: string; at: number } // `at`: growth progress it appears at
type Patch = { origin: Point; traces: Trace[]; chips: Chip[]; start: number } // page coordinates

const GRID = 8 // px; traces run along this grid like PCB routing
const GROW_MS = 750
const HOLD_MS = 900
const FADE_MS = 1400
// 8 directions, clockwise from east. Traces mostly run straight and turn in 45° steps.
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
// Clicks on interactive things, the hero (it has its own strings) and the card toys are left alone.
const IGNORE = 'a, button, input, textarea, select, label, canvas, [role="group"], .hero, .life-strip'

// Small seeded RNG so a patch is generated once and then drawn identically every frame.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Route a random fan of traces out of a small IC at the click point. Traces never reuse a grid
// cell, so they stop where they would collide, which gives every patch its own ragged outline.
function makePatch(x: number, y: number, start: number): Patch {
  const rand = rng(Math.floor(start * 1000) ^ (x * 73856093) ^ (y * 19349663))
  const ox = Math.round(x / GRID), oy = Math.round(y / GRID)
  const used = new Set<string>()
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) used.add(`${ox + i},${oy + j}`)

  const traces: Trace[] = []
  const chips: Chip[] = []
  const count = 9 + Math.floor(rand() * 6)
  for (let n = 0; n < count; n++) {
    let dir = (Math.round((n / count) * 8 + rand() * 1.2)) % 8
    let cx = ox + DIRS[dir][0] * 2, cy = oy + DIRS[dir][1] * 2
    const cells: Point[] = [{ x: ox + DIRS[dir][0], y: oy + DIRS[dir][1] }, { x: cx, y: cy }]
    const steps = 5 + Math.floor(rand() * 14)
    for (let s = 0; s < steps; s++) {
      if (rand() < 0.22) dir = (dir + (rand() < 0.5 ? 1 : 7)) % 8
      const nx = cx + DIRS[dir][0], ny = cy + DIRS[dir][1]
      if (used.has(`${nx},${ny}`)) break
      used.add(`${nx},${ny}`)
      cx = nx; cy = ny
      cells.push({ x: cx, y: cy })
    }
    const points = cells.map((c) => ({ x: c.x * GRID, y: c.y * GRID }))
    let length = 0
    for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    traces.push({ points, length })
    // Occasionally a trace lands on a small component instead of a via.
    if (rand() < 0.18 && points.length > 6) {
      const end = points[points.length - 1], w = (3 + Math.floor(rand() * 3)) * GRID, h = 2 * GRID
      chips.push({ x: end.x - w / 2, y: end.y - h / 2, w, h, label: `${rand() < 0.5 ? 'U' : 'C'}${1 + Math.floor(rand() * 24)}`, at: 0.95 })
    }
  }
  chips.push({ x: ox * GRID - GRID * 1.5, y: oy * GRID - GRID * 1.5, w: GRID * 3, h: GRID * 3, label: '', at: 0 })
  return { origin: { x, y }, traces, chips, start }
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// Clicking empty background (below the hero) briefly exposes circuit board traces under the page.
export default function CircuitReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    const patches: Patch[] = []
    let frame = 0
    let ink = ''
    let paper = ''

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      canvas.width = Math.round(innerWidth * dpr)
      canvas.height = Math.round(innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const drawPatch = (patch: Patch, now: number) => {
      const age = now - patch.start
      const grow = reducedMotion ? 1 : easeOut(Math.min(1, age / GROW_MS))
      const life = age < GROW_MS + HOLD_MS ? 1 : 1 - (age - GROW_MS - HOLD_MS) / FADE_MS
      ctx.save()
      ctx.translate(-scrollX, -scrollY)
      ctx.globalAlpha = life * 0.8
      ctx.strokeStyle = ink
      ctx.lineWidth = 1.2
      ctx.lineJoin = 'round'

      for (const { points, length } of patch.traces) {
        // Each trace is revealed from the chip outward, like a signal running down it.
        let remaining = length * grow
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        let end = points[0]
        for (let i = 1; i < points.length && remaining > 0; i++) {
          const a = points[i - 1], b = points[i]
          const seg = Math.hypot(b.x - a.x, b.y - a.y)
          const t = Math.min(1, remaining / seg)
          end = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
          ctx.lineTo(end.x, end.y)
          remaining -= seg
        }
        ctx.stroke()
        if (grow > 0.9) {
          ctx.beginPath()
          ctx.arc(end.x, end.y, 2.6, 0, Math.PI * 2)
          ctx.fillStyle = paper
          ctx.fill()
          ctx.stroke()
        }
      }

      ctx.font = `8px 'Geist Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const chip of patch.chips) {
        if (grow < chip.at) continue
        ctx.fillStyle = paper
        ctx.fillRect(chip.x, chip.y, chip.w, chip.h)
        ctx.strokeRect(chip.x, chip.y, chip.w, chip.h)
        // Pins along the long edges.
        for (let px = chip.x + GRID / 2; px < chip.x + chip.w; px += GRID / 2) {
          ctx.beginPath()
          ctx.moveTo(px, chip.y - 2); ctx.lineTo(px, chip.y)
          ctx.moveTo(px, chip.y + chip.h); ctx.lineTo(px, chip.y + chip.h + 2)
          ctx.stroke()
        }
        if (chip.label) {
          ctx.fillStyle = ink
          ctx.fillText(chip.label, chip.x + chip.w / 2, chip.y + chip.h / 2 + 0.5)
        } else {
          ctx.beginPath()
          ctx.arc(chip.x + 4, chip.y + 4, 1.2, 0, Math.PI * 2)
          ctx.fillStyle = ink
          ctx.fill()
        }
      }
      ctx.restore()
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (let i = patches.length - 1; i >= 0; i--) {
        if (now - patches[i].start > GROW_MS + HOLD_MS + FADE_MS) patches.splice(i, 1)
      }
      for (const patch of patches) drawPatch(patch, now)
      ctx.globalAlpha = 1
      frame = patches.length ? requestAnimationFrame(draw) : 0
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest?.(IGNORE)) return
      const styles = getComputedStyle(document.documentElement)
      ink = styles.getPropertyValue('--green').trim()
      paper = styles.getPropertyValue('--background').trim()
      patches.push(makePatch(e.clientX + scrollX, e.clientY + scrollY, performance.now()))
      if (patches.length > 6) patches.shift()
      if (!frame) frame = requestAnimationFrame(draw)
    }

    resize()
    addEventListener('resize', resize)
    document.addEventListener('pointerdown', onDown)
    return () => {
      removeEventListener('resize', resize)
      document.removeEventListener('pointerdown', onDown)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas ref={canvasRef} className="circuit-reveal" aria-hidden="true" />
}
