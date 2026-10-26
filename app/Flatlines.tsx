'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SPACING = 18 // px between lines
const SEGMENTS = 120 // points per line
const TENSION = 0.25 // wave speed along a line (stable below 1)
const COUPLING = 0.02 // how much a line tugs its neighbours
const DAMPING = 0.992 // per substep; lower settles faster
const SUBSTEPS = 2
const MAX_PULL = 140 // px a line can be dragged from rest
// Presses here keep their own behavior instead of grabbing a line.
const IGNORE = 'a, button, input, textarea, select, label, .scene-wrap'

const STORAGE_KEY = 'waves'

// On/off setting for the hero lines, remembered per visitor. On by default.
export function useWavesSetting() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    try { setOn(localStorage.getItem(STORAGE_KEY) !== 'off') } catch {}
  }, [])
  const toggle = useCallback(() => {
    setOn((prev) => {
      try { localStorage.setItem(STORAGE_KEY, prev ? 'off' : 'on') } catch {}
      return !prev
    })
  }, [])
  return { on, toggle }
}

// Stacked "flatlines" behind the hero. Each line is a string simulated with the 1D wave equation:
// hover bends lines around the cursor, and a grabbed line vibrates when released, then settles flat.
export default function Flatlines({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !hero || !ctx) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let lines = 0
    let u: Float32Array[] = [] // displacement from rest, per line point
    let v: Float32Array[] = [] // velocity
    let h: Float32Array[] = [] // eased hover bend (drawn on top of u, not simulated)
    let color = ''
    let baseAlpha = 0.16
    let frame = 0
    const pointer = { x: 0, y: 0, inside: false }
    let grab: { line: number; id: number } | null = null

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement)
      const light = document.documentElement.dataset.theme === 'light'
      color = styles.getPropertyValue(light ? '--foreground' : '--green').trim() || '#8fe69d'
      baseAlpha = light ? 0.13 : 0.17
    }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      lines = Math.max(1, Math.floor(height / SPACING))
      const make = () => Array.from({ length: lines }, () => new Float32Array(SEGMENTS + 1))
      u = make(); v = make(); h = make()
      grab = null
    }

    const baseY = (i: number) => (height - (lines - 1) * SPACING) / 2 + i * SPACING
    const colX = (j: number) => (j / SEGMENTS) * width

    const step = () => {
      let energy = 0

      // Pin the grabbed line to the pointer with a smooth bump around it.
      if (grab) {
        const c = (pointer.x / width) * SEGMENTS
        const pull = Math.max(-MAX_PULL, Math.min(MAX_PULL, pointer.y - baseY(grab.line)))
        const line = u[grab.line], vel = v[grab.line]
        for (let j = 1; j < SEGMENTS; j++) {
          const w = Math.exp(-(((j - c) / 9) ** 2))
          line[j] += (pull * w - line[j]) * Math.min(1, w * 1.5)
          vel[j] *= 1 - w
        }
      }

      for (let s = 0; s < SUBSTEPS; s++) {
        // All velocities first, then all positions: updating lines one at a time lets neighbours
        // read each other mid-step, which pumps energy in and the sheet blows up.
        for (let i = 0; i < lines; i++) {
          const line = u[i], vel = v[i]
          const above = u[i - 1], below = u[i + 1]
          for (let j = 1; j < SEGMENTS; j++) {
            let a = TENSION * (line[j - 1] - 2 * line[j] + line[j + 1])
            if (above) a += COUPLING * (above[j] - line[j])
            if (below) a += COUPLING * (below[j] - line[j])
            vel[j] = (vel[j] + a) * DAMPING
          }
        }
        for (let i = 0; i < lines; i++) {
          const line = u[i], vel = v[i]
          for (let j = 1; j < SEGMENTS; j++) line[j] += vel[j]
        }
      }

      // Ease the hover bend toward lines parting around the cursor.
      for (let i = 0; i < lines; i++) {
        const y0 = baseY(i), line = u[i], bend = h[i]
        for (let j = 0; j <= SEGMENTS; j++) {
          let target = 0
          if (pointer.inside && !grab) {
            const dx = colX(j) - pointer.x
            const dy = y0 + line[j] - pointer.y
            target = Math.sign(dy || 1) * 16 * Math.exp(-(dx * dx) / (2 * 90 * 90)) * Math.exp(-(dy * dy) / (2 * 34 * 34))
          }
          bend[j] += (target - bend[j]) * 0.12
          energy += Math.abs(line[j]) + Math.abs(v[i][j]) + Math.abs(bend[j] - target) + Math.abs(target)
        }
      }
      return energy
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      for (let i = 0; i < lines; i++) {
        const y0 = baseY(i), line = u[i], bend = h[i]
        let peak = 0
        ctx.beginPath()
        for (let j = 0; j <= SEGMENTS; j++) {
          const d = line[j] + bend[j]
          peak = Math.max(peak, Math.abs(d))
          if (j === 0) ctx.moveTo(colX(j), y0 + d)
          else ctx.lineTo(colX(j), y0 + d)
        }
        // A disturbed line "lights up" a little, like a signal coming through.
        ctx.globalAlpha = Math.min(0.6, baseAlpha + peak / 90)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    const tick = () => {
      const energy = step()
      draw()
      frame = energy > 0.5 || grab || pointer.inside ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!frame && !reducedMotion) frame = requestAnimationFrame(tick) }

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.inside = pointer.y >= 0 && pointer.y <= height
    }
    const nearestLine = () => Math.max(0, Math.min(lines - 1, Math.round((pointer.y - baseY(0)) / SPACING)))

    const onMove = (e: PointerEvent) => {
      if (!enabledRef.current || (e.pointerType !== 'mouse' && !grab)) return
      toLocal(e)
      wake()
    }
    const onLeave = () => { pointer.inside = false }
    const onDown = (e: PointerEvent) => {
      if (!enabledRef.current || reducedMotion || e.button !== 0 || (e.target as Element).closest(IGNORE)) return
      toLocal(e)
      if (e.pointerType !== 'mouse') {
        // Touch: a tap plucks the nearest line; dragging stays page scroll.
        const i = nearestLine(), c = Math.round((pointer.x / width) * SEGMENTS)
        for (let j = Math.max(1, c - 6); j <= Math.min(SEGMENTS - 1, c + 6); j++) v[i][j] += 6 * Math.cos(((j - c) / 6) * (Math.PI / 2))
        wake()
        return
      }
      e.preventDefault() // no text selection while pulling a line
      grab = { line: nearestLine(), id: e.pointerId }
      hero.classList.add('is-grabbing')
      wake()
    }
    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return
      grab = null
      hero.classList.remove('is-grabbing')
      wake()
    }

    readTheme()
    resize()
    draw()
    const resizeObserver = new ResizeObserver(() => { resize(); draw() })
    resizeObserver.observe(canvas)
    const themeObserver = new MutationObserver(() => { readTheme(); draw() })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    hero.addEventListener('pointerdown', onDown)
    hero.addEventListener('pointerleave', onLeave)
    addEventListener('pointermove', onMove)
    addEventListener('pointerup', onUp)
    addEventListener('pointercancel', onUp)
    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      hero.removeEventListener('pointerdown', onDown)
      hero.removeEventListener('pointerleave', onLeave)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerup', onUp)
      removeEventListener('pointercancel', onUp)
      cancelAnimationFrame(frame)
      hero.classList.remove('is-grabbing')
    }
  }, [])

  return <canvas ref={canvasRef} className={`flatlines${enabled ? '' : ' is-off'}`} aria-hidden="true" />
}
