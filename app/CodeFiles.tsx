'use client'

import { Fragment, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

const about: [string, string][] = [
  ['name', 'Vinsline Voltaire'],
  ['role', 'Software Engineer'],
  ['focus', 'real-time graphics + systems'],
  ['based', 'Boston, MA'],
  ['school', 'Oberlin College'],
  ['building', 'Fragment'],
]

const stack: [string, string[]][] = [
  ['languages', ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'SQL', 'GLSL', 'HTML', 'CSS']],
  ['frameworks', ['React', 'Next.js', 'Node.js', 'Spring Boot', 'Three.js', 'React Three Fiber', 'WebGL']],
  ['data', ['PostgreSQL', 'Neon', 'Drizzle', 'MySQL', 'Snowflake', 'REST APIs']],
  ['infra', ['Docker', 'Kubernetes (AKS)', 'Vercel', 'Cloudflare R2', 'GitHub Actions', 'Git', 'New Relic']],
  ['testing', ['Vitest', 'Playwright', 'GoogleTest']],
  ['build', ['pnpm', 'CMake']],
  ['tools', ['Salesforce Health Cloud', 'MuleSoft', 'Tableau', 'Figma']],
]

const str = (s: string) => <span className="green">&quot;{s}&quot;</span>

const files: { name: string; body: ReactNode }[] = [
  {
    name: 'about.ts',
    body: <>
      <p className="muted">// a little context</p>
      <p><b>const</b> engineer = {'{'}</p>
      {about.map(([key, value], i) => <p className="indent" key={key}><b>{key}:</b> {str(value)}{i < about.length - 1 && ','}</p>)}
      <p>{'}'}</p>
      <p className="terminal-note">Most at home where software, graphics, and playful systems meet.</p>
    </>,
  },
  {
    name: 'stack.ts',
    body: <>
      <p className="muted">// what I reach for</p>
      <p><b>const</b> stack = {'{'}</p>
      {/* Arrays wrap with a hanging indent, so long lists stay readable on narrow screens. */}
      {stack.map(([key, items], i) => (
        <p className="indent code-array" key={key}>
          <b>{key}:</b> [{items.map((item, j) => <Fragment key={item}><span className="code-item">{str(item)}{j < items.length - 1 && ','}</span>{j < items.length - 1 && ' '}</Fragment>)}]{i < stack.length - 1 && ','}
        </p>
      ))}
      <p>{'}'}</p>
    </>,
  },
]

const pad = (n: number) => String(n).padStart(2, '0')

// The about card as a tiny editor: each file is a tab, and arrow keys move between them.
export default function CodeFiles() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + files.length) % files.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="terminal-card">
      <div className="terminal-head">
        <span><i /> <i /> <i /></span>
        <div className="terminal-tabs" role="tablist" aria-label="Files" onKeyDown={onKeyDown}>
          {files.map((file, i) => (
            <button
              key={file.name}
              ref={(el) => { tabs.current[i] = el }}
              type="button"
              role="tab"
              id={`file-tab-${i}`}
              aria-selected={i === active}
              aria-controls="file-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
            >
              {file.name}
            </button>
          ))}
        </div>
        <span>{pad(active + 1)} / {pad(files.length)}</span>
      </div>
      <div className="terminal-body" id="file-panel" role="tabpanel" aria-labelledby={`file-tab-${active}`}>
        {files[active].body}
      </div>
    </div>
  )
}
