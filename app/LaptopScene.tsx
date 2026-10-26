'use client'

import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Float, Image, OrbitControls, RoundedBox, Text, useTexture } from '@react-three/drei'
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Theme } from './useTheme'

const LID_CLOSED = Math.PI / 2 - 0.02
const LID_OPEN = -0.28
const FONT = '/fonts/GeistMono-Regular.ttf'

// The screen stays dark in both themes; the body and lighting change. The canvas is transparent,
// so the page (and the flatlines behind it) shows through.
const PALETTES = {
  dark: { body: '#202722', deck: '#0c110e', keyboard: '#10241b', keyboardHover: '#173828', key: '#ffcf6b', ambient: 0.7, sun: 2.4, sunColor: '#eaffdf', glow: 18, shadow: 0.55 },
  light: { body: '#c9ccc3', deck: '#adb1a7', keyboard: '#2a312c', keyboardHover: '#34403a', key: '#2fbf62', ambient: 1.2, sun: 2.6, sunColor: '#ffffff', glow: 5, shadow: 0.3 },
}

type Palette = (typeof PALETTES)[Theme]

// Show a pointer over clickable parts of the scene. Set on the canvas itself so it wins over the
// hero's grab cursor (from the flatlines behind it).
function usePointerCursor(active: boolean) {
  const canvas = useThree((state) => state.gl.domElement)
  useEffect(() => {
    if (!active) return
    canvas.style.cursor = 'pointer'
    return () => { canvas.style.cursor = '' }
  }, [active, canvas])
}

// A glowing key on the deck that flips the site between night and day.
function LightKey({ palette, onToggle }: { palette: Palette; onToggle?: () => void }) {
  const [hovered, setHovered] = useState(false)

  usePointerCursor(hovered)

  return (
    <group
      // Sits in the deck margin right of the keyboard (keyboard spans x ±1.65, z -1.075..0.675).
      position={[1.9, 0.14, -1.18]}
      onClick={(e) => { e.stopPropagation(); if (e.delta <= 4) onToggle?.() }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Invisible, generous hit area so the small key is easy to press while the laptop floats. */}
      <mesh position={[0, 0.05, 0.1]}>
        <boxGeometry args={[0.44, 0.2, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <RoundedBox args={[0.34, 0.05, 0.2]} radius={0.02} smoothness={3} position={[0, hovered ? -0.008 : 0, 0]}>
        <meshStandardMaterial color={palette.key} emissive={palette.key} emissiveIntensity={hovered ? 2.2 : 1.2} toneMapped={false} />
      </RoundedBox>
      <Suspense fallback={null}>
        <Text position={[0, 0.006, 0.22]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.085} color={palette.key} anchorX="center" font={FONT}>
          LIGHTS
        </Text>
      </Suspense>
    </group>
  )
}

const CARD_GREEN = '#8fe69d'

// Fetch the card photo up front so the card can pop in the moment boot finishes.
useTexture.preload('/profile-card.jpg')

const BOOT_TEXT = '> booting vinsline.dev\n> loading portfolio...\n> access granted'
const TERM_FONT_SIZE = 0.18
const TERM_ORIGIN = [-1.95, 2.6] as const
// Geist Mono advances 600/1000 em per glyph, which lets the cursor be placed without measuring text.
const TERM_ADVANCE = TERM_FONT_SIZE * 0.6
const TERM_LINE = TERM_FONT_SIZE * 1.3

// Delay before each character appears, so the boot sequence reads like a real shell:
// prompts print instantly, commands type with a little jitter, and the loading dots tick slowly.
function bootDelays(text: string) {
  return [...text].map((ch, i) => {
    const col = i - (text.lastIndexOf('\n', i - 1) + 1)
    if (ch === '\n') return 380
    if (col < 2) return 0
    if (ch === '.' && text.slice(i - 1, i + 3).includes('..')) return 260
    return 35 + Math.random() * 45
  })
}

function Terminal({ active, onDone }: { active: boolean; onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const cursor = useRef<THREE.Mesh>(null)
  const done = shown >= BOOT_TEXT.length

  useEffect(() => {
    if (!active) { setShown(0); return }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(BOOT_TEXT.length); onDone(); return }
    const delays = bootDelays(BOOT_TEXT)
    const timers: ReturnType<typeof setTimeout>[] = []
    let t = 650 // let the lid swing up first
    delays.forEach((d, i) => {
      t += d
      timers.push(setTimeout(() => setShown(i + 1), t))
    })
    timers.push(setTimeout(onDone, t + 300))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Solid while typing, blinking once idle.
  useFrame(({ clock }) => {
    if (cursor.current) cursor.current.visible = active && (!done || Math.floor(clock.elapsedTime * 1.8) % 2 === 0)
  })

  const lines = BOOT_TEXT.slice(0, shown).split('\n')
  const row = lines.length - 1
  const col = lines[row].length

  return (
    <>
      {/* Text loads its font asynchronously; keep it from blocking the rest of the scene. */}
      <Suspense fallback={null}>
        <Text position={[TERM_ORIGIN[0], TERM_ORIGIN[1], 0.12]} fontSize={TERM_FONT_SIZE} lineHeight={1.3} color="#8fe69d" anchorX="left" anchorY="top" font={FONT} maxWidth={3.2}>
          {BOOT_TEXT.slice(0, shown) || ' '}
        </Text>
      </Suspense>
      <mesh ref={cursor} position={[TERM_ORIGIN[0] + (col + 0.5) * TERM_ADVANCE, TERM_ORIGIN[1] - (row + 0.5) * TERM_LINE, 0.12]}>
        <planeGeometry args={[TERM_ADVANCE * 0.9, TERM_FONT_SIZE * 1.05]} />
        <meshBasicMaterial color="#8fe69d" toneMapped={false} />
      </mesh>
    </>
  )
}

// Name card drawn on the screen itself (bottom-right corner), so it always stays inside the bezel.
// Screen face spans x ±2.17, y 0.22–2.82 in lid space; the card is 2.0 × 0.72 drawn at 1.3× (right edge 2.02, bottom 0.37).
function ProfileCard() {
  const [hovered, setHovered] = useState(false)

  usePointerCursor(hovered)

  return (
    <group position={[0.72, 0.84, 0.12]} scale={1.3}>
      {/* 1px-style border: green plate with a slightly smaller dark plate on top */}
      <mesh><planeGeometry args={[2.0, 0.72]} /><meshBasicMaterial color={CARD_GREEN} transparent opacity={0.65} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.002]}><planeGeometry args={[1.98, 0.7]} /><meshBasicMaterial color="#030c07" toneMapped={false} /></mesh>
      <Suspense fallback={null}>
        <Image url="/profile-card.jpg" scale={[0.5, 0.5]} position={[-0.68, 0, 0.004]} toneMapped={false} />
        <Text position={[-0.33, 0.21, 0.004]} fontSize={0.095} color={CARD_GREEN} anchorX="left" anchorY="middle" font={FONT}>Vinsline Voltaire</Text>
        <Text position={[-0.33, 0.07, 0.004]} fontSize={0.072} color="#7f9c86" anchorX="left" anchorY="middle" font={FONT}>software engineer</Text>
      </Suspense>
      <group
        position={[-0.02, -0.16, 0.004]}
        onClick={(e) => { e.stopPropagation(); if (e.delta <= 4) document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh><planeGeometry args={[0.62, 0.18]} /><meshBasicMaterial color={CARD_GREEN} toneMapped={false} /></mesh>
        <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.6, 0.16]} /><meshBasicMaterial color={hovered ? CARD_GREEN : '#030c07'} toneMapped={false} /></mesh>
        <Suspense fallback={null}>
          <Text position={[0, 0, 0.002]} fontSize={0.068} letterSpacing={0.04} color={hovered ? '#030c07' : CARD_GREEN} anchorX="center" anchorY="middle" font={FONT}>ENTER SITE</Text>
        </Suspense>
      </group>
    </group>
  )
}

function Laptop({ palette, onToggleTheme }: { palette: Palette; onToggleTheme?: () => void }) {
  const lid = useRef<THREE.Group>(null)
  const [open, setOpen] = useState(false)
  const [booted, setBooted] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Open the lid shortly after mount as an intro.
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 350)
    return () => clearTimeout(id)
  }, [])

  // Closing the lid "shuts down" the machine; the boot sequence replays on the next open.
  useEffect(() => { if (!open) setBooted(false) }, [open])

  usePointerCursor(hovered)

  useFrame((_, delta) => {
    if (!lid.current) return
    lid.current.rotation.x = THREE.MathUtils.damp(lid.current.rotation.x, open ? LID_OPEN : LID_CLOSED, 4, delta)
  })

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // Ignore clicks that were really the end of an orbit drag.
    if (e.delta > 4) return
    setOpen((o) => !o)
  }

  return (
    <Float speed={1.7} rotationIntensity={0.16} floatIntensity={0.4}>
      <group
        rotation={[0.05, -0.12, 0]}
        position={[0, -0.2, 0]}
        onClick={toggle}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <RoundedBox args={[4.8, 0.18, 3.05]} radius={0.085} smoothness={4}>
          <meshStandardMaterial color={palette.body} metalness={0.45} roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[4.25, 0.035, 2.48]} radius={0.015} smoothness={4} position={[0, 0.105, -0.08]}>
          <meshStandardMaterial color={palette.deck} metalness={0.35} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.13, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.3, 1.75]} />
          <meshBasicMaterial color={hovered ? palette.keyboardHover : palette.keyboard} />
        </mesh>
        <LightKey palette={palette} onToggle={onToggleTheme} />
        {/* Lid pivots at the back edge of the base; its panel extends up local +y with the screen facing +z. */}
        <group ref={lid} position={[0, 0.25, -1.48]} rotation={[LID_CLOSED, 0, 0]}>
          <RoundedBox args={[4.8, 3.0, 0.16]} radius={0.07} smoothness={4} position={[0, 1.5, 0]}>
            <meshStandardMaterial color={palette.body} metalness={0.45} roughness={0.32} />
          </RoundedBox>
          <RoundedBox args={[4.34, 2.6, 0.05]} radius={0.02} smoothness={4} position={[0, 1.52, 0.085]}>
            <meshBasicMaterial color={hovered ? '#15351f' : '#0e2619'} />
          </RoundedBox>
          <Terminal active={open} onDone={() => setBooted(true)} />
          {booted && <ProfileCard />}
        </group>
      </group>
    </Float>
  )
}

class SceneErrorBoundary extends Component<{ onError?: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) {
    console.error('3D scene failed to load', error)
    this.props.onError?.()
  }
  render() { return this.state.failed ? null : this.props.children }
}

export default function LaptopScene({ theme = 'dark', onToggleTheme, onReady, onError }: { theme?: Theme; onToggleTheme?: () => void; onReady?: () => void; onError?: () => void }) {
  const palette = PALETTES[theme]

  return (
    <SceneErrorBoundary onError={onError}>
      <Canvas camera={{ position: [0, 3.1, 8.2], fov: 37 }} dpr={[1, 2]} gl={{ antialias: true }} onCreated={() => onReady?.()}>
        <ambientLight intensity={palette.ambient} />
        <directionalLight position={[4, 6, 5]} intensity={palette.sun} color={palette.sunColor} />
        <pointLight position={[-4, 2, 2]} intensity={palette.glow} distance={10} color="#3cff75" />
        <Laptop palette={palette} onToggleTheme={onToggleTheme} />
        <ContactShadows position={[0, -0.85, 0]} scale={10} blur={2.4} far={2.5} opacity={palette.shadow} />
        <OrbitControls makeDefault target={[0, 0.95, -0.5]} enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} minPolarAngle={Math.PI * 0.32} maxPolarAngle={Math.PI * 0.62} minAzimuthAngle={-Math.PI * 0.32} maxAzimuthAngle={Math.PI * 0.32} />
      </Canvas>
    </SceneErrorBoundary>
  )
}
