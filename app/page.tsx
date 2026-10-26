'use client'

import dynamic from 'next/dynamic'
import { useState, type CSSProperties } from 'react'
import Carousel, { type Slide } from './Carousel'
import Flatlines, { useWavesSetting } from './Flatlines'
import CircuitReveal from './CircuitReveal'
import CodeFiles from './CodeFiles'
import GuitarStrings from './GuitarStrings'
import WateringCan from './WateringCan'
import Sketchpad from './Sketchpad'
import { useTheme } from './useTheme'
import { ArrowDown, ArrowUpRight, Mail, Terminal, Camera, Guitar, Leaf, Palette, ExternalLink, Sun, Moon, AudioWaveform } from 'lucide-react'

const Scene = dynamic(() => import('./LaptopScene'), { ssr: false })

// A project's image panel only appears once at least one slide has a `src` (e.g. '/projects/fragment-1.jpg' in public/).
// liveUrl: a URL shows a "live site" button, '' shows a "live site soon" badge, omit it for neither.
type Project = { title: string; github: string; liveUrl?: string; status: string; tags: string; body: string; slides: Slide[] }

const projects: Project[] = [
  { title: 'Fragment', github: 'https://github.com/vvoltaire/fragment', liveUrl: '', status: 'in progress', tags: 'Next.js · TypeScript · PostgreSQL · WebGL · GLSL', body: 'A full-stack shader workspace with a live WebGL editor, accounts, a public gallery, and the ability to fork and remix GLSL work in the browser.', slides: [{ alt: 'fragment screenshot' }, { alt: 'fragment screenshot' }, { alt: 'fragment screenshot' }] },
  { title: 'Path Tracer', github: 'https://github.com/vvoltaire/path-tracer', status: 'in progress', tags: 'C++ · CMake · Multithreading', body: 'A C++ renderer built from first principles, covering physically based materials, recursive light transport, triangle meshes, SDF primitives, multithreaded rendering, and BVH acceleration.', slides: [{ alt: 'render placeholder' }, { alt: 'render placeholder' }, { alt: 'render placeholder' }] },
  { title: 'Render Farm', github: 'https://github.com/vvoltaire/render-farm', status: 'upcoming', tags: 'Java · Spring Boot · Docker · Kubernetes', body: 'A distributed rendering system for decomposing jobs, scheduling work across workers, and tracking progress as frames move through a compute pool.', slides: [{ alt: 'render farm placeholder' }, { alt: 'render farm placeholder' }, { alt: 'render farm placeholder' }] },
]

// Logos are single-color masks tinted in CSS; see .experience-logo.
const logoStyle = (src: string) => ({ '--logo': `url('${src}')` }) as CSSProperties

// lucide no longer ships brand marks, so GitHub and LinkedIn are drawn here to match its 24px stroke style.
const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)
const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const contactLinks: { label: string; value: string; href?: string; icon: (props: { size?: number }) => React.ReactNode }[] = [
  // No href renders the row as plain text (e.g. while an address is TBA).
  { label: 'email', value: 'tba', icon: Mail },
  { label: 'github', value: 'github.com/vvoltaire', href: 'https://github.com/vvoltaire', icon: GithubIcon },
  { label: 'linkedin', value: 'linkedin.com/in/vvoltaire', href: 'https://www.linkedin.com/in/vvoltaire/', icon: LinkedinIcon },
]

const lifeCards = [
  { icon: Camera, title: 'Through My Lens', variant: 'viewfinder' as const, strip: <div className="life-strip lens-readout" aria-hidden="true"><span>M</span><span>f/2.8</span><span>1/250</span><span>ISO 400</span><span className="lens-battery"><i /><i /><i /></span></div>, body: <>I love taking pictures, from city streets at night to the view from a window seat. This is a little gallery of how I see the world.</>, slides: [
    { src: '/life/lens-me-wall-1.jpg', alt: 'Vinsline sitting on a stone planter wall in a brick courtyard', position: 'center 45%' },
    { src: '/life/lens-lake-beach.jpg', alt: 'Paddleboard on a lakeside beach under big summer clouds', position: 'center 55%' },
    { src: '/life/lens-harbor-aerial.jpg', alt: 'Aerial view of a harbor, a curved beach and islands' },
    { src: '/life/lens-peonies.jpg', alt: 'Buckets of fresh peonies at a market flower stall' },
    { src: '/life/lens-plane-wing.jpg', alt: 'Airplane wing over snowy mountains and clouds', position: 'center 45%' },
    { src: '/life/lens-cave-mouth.jpg', alt: 'Sunlight pouring into a cave over still dark water' },
    { src: '/life/lens-cave-pool.jpg', alt: 'Clear turquoise pool inside a limestone cave' },
    { src: '/life/lens-harbor-dusk.jpg', alt: 'Harbor at dusk under rippled blue clouds' },
    { src: '/life/lens-red-light-sunset.jpg', alt: 'Red traffic lights against a pink and orange sunset' },
    { src: '/life/lens-scooter-alley.jpg', alt: 'Black scooter parked by a wooden patio at dusk' },
    { src: '/life/lens-flower-bus.jpg', alt: 'Vintage bus covered in flowers parked on a city street' },
    { src: '/life/lens-times-square-blue.jpg', alt: 'Times Square at night washed in blue light' },
    { src: '/life/lens-glasshouse.jpg', alt: 'Floral installation under a skylight in a glasshouse atrium' },
    { src: '/life/lens-canal-swan.jpg', alt: 'Swan paddle boat on a canal under a bridge' },
    { src: '/life/lens-canal-bridge.jpg', alt: 'Canal walk with a gondola passing under a bridge' },
  ] },
  { icon: Guitar, title: 'Six Strings & Counting', strip: <GuitarStrings />, body: <>Guitar is my newest hobby, and I&apos;m still learning as I go. When I&apos;m not coding, I&apos;m usually working through a new song, one chord at a time.</>, slides: [{ src: '/life/guitar.jpg', alt: 'Black Squier Stratocaster on a stand in afternoon light', position: 'center 62%' }] },
  { icon: Leaf, title: 'Meet Lidia', strip: <WateringCan />, body: <>Lidia is my peace lily, and she&apos;s been with me through every desk setup. Check back for new pictures as she grows, and feel free to water her while you&apos;re here.</>, slides: [{ src: '/life/lidia.jpg', alt: 'Lidia the peace lily in bloom by the window', position: 'center 38%' }] },
  { icon: Palette, title: 'Art', strip: <Sketchpad />, body: <>Art has been a passion of mine for as long as I can remember. In my free time I love to create, and I look for ways to bring that into my work.</>, slides: [
    { src: '/life/art-sketchbooks.jpg', alt: 'Sketchbooks with ink drawings, pens and a watercolor set', position: 'center 40%' },
    { src: '/life/art-heart-cup.jpg', alt: 'Hand-painted ceramic cup with pink hearts', position: 'center 60%' },
    { src: '/life/art-ceramics-table.jpg', alt: 'Painting ceramics: brushes, palettes and a unicorn figure' },
  ] },
]

export default function Home() {
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)
  const show3d = sceneReady && !sceneFailed
  const { theme, toggle: toggleTheme } = useTheme()
  const waves = useWavesSetting()

  return (
    <main className="portfolio-shell">
      <CircuitReveal />
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top"><span className="brand-mark">vv</span><span>vinsline.dev</span></a>
        <div className="nav-links"><a href="#about">about</a><a href="#work">work</a><a href="#experience">experience</a><a href="#education">education</a><a href="#contact">contact</a></div>
        <div className="topbar-actions"><a className="availability" href="#contact"><span className="availability-dot" /><span className="availability-long">open to collaboration</span><span className="availability-short">open to collab</span></a><button className={`theme-toggle waves-toggle${waves.on ? '' : ' is-off'}`} type="button" onClick={waves.toggle} aria-label="Toggle background waves" aria-pressed={waves.on} title={waves.on ? 'Turn waves off' : 'Turn waves on'}><AudioWaveform size={14} /></button><button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle light mode" aria-pressed={theme === 'light'}><Sun className="theme-icon-sun" size={14} /><Moon className="theme-icon-moon" size={14} /></button></div>
      </nav>

      <section className={`hero${waves.on ? ' waves-on' : ''}`} id="top">
        <Flatlines enabled={waves.on} />
        <div className="hero-copy">
          <p className="eyebrow"><Terminal size={14} /> ~/hello_world</p>
          <h1>Vinsline<br /><em>Voltaire</em></h1>
          <p className="role">Software Engineer<span className="cursor" /></p>
          <p className="intro">Full-stack engineer at Manulife / John Hancock. I work on payments by day and build real-time graphics tools on the side.</p>
          <div className="hero-actions"><a className="primary-button" href="#about">enter site <ArrowDown size={15} /></a><a className="text-link" href="#work">view selected work</a></div>
        </div>
        <div className={`scene-wrap${show3d ? ' is-ready' : ''}`} aria-label="Interactive 3D laptop"><Scene theme={theme} onToggleTheme={toggleTheme} onReady={() => setSceneReady(true)} onError={() => setSceneFailed(true)} />{!show3d && <div className="laptop-fallback"><div className="fallback-screen"><span>&gt; booting vinsline.dev</span><span>&gt; access granted</span></div><div className="fallback-base" /></div>}{show3d && <div className="scene-caption"><span>drag to explore</span><span>click to open / close</span><span>glowing key = lights</span></div>}</div>
      </section>

      <section className="about-section" id="about">
        <div className="section-kicker"><span>01</span><span>about me</span><span className="section-line" /></div>
        <div className="info-grid">
          <div className="portrait-wrap"><img src="/portrait.jpg" alt="Portrait of Vinsline Voltaire" /><span className="portrait-label">v.v / 001</span></div>
          <CodeFiles />
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="section-kicker"><span>02</span><span>selected work</span><span className="section-line" /></div>
        <div className="section-intro"><h2>Things I&apos;ve<br /><em>been building.</em></h2><p>Selected projects across graphics, rendering, and developer tools. Each one is an opportunity to understand the underlying system and make the implementation hold up under real use.</p></div>
        <div className="project-list">
          {projects.map(({ title, github, liveUrl, status, tags, body, slides }, i) => (
            <article className={`project-row${slides.some((slide) => slide.src) ? ' has-media' : ''}`} key={title}><span className="project-index">{String(i + 1).padStart(2, '0')}</span><div><h3><a href={github} target="_blank" rel="noreferrer">{title} <ExternalLink size={15} /></a></h3><p>{body}</p><span className="tags">{tags}</span><div className="project-links">{liveUrl ? <a className="project-link primary" href={liveUrl} target="_blank" rel="noreferrer">live site <ArrowUpRight size={12} /></a> : liveUrl === '' && <span className="project-link pending">live site · soon</span>}<a className="project-link" href={github} target="_blank" rel="noreferrer">github <ArrowUpRight size={12} /></a><span className="project-status">{status}</span></div></div>{slides.some((slide) => slide.src) && <Carousel slides={slides} label={`${title} screenshots`} />}</article>
          ))}
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="section-kicker"><span>03</span><span>experience</span><span className="section-line" /></div>
        <div className="experience-list">
          <article className="experience-row"><span className="experience-year">2025 — now</span><div><h3>Manulife / John Hancock</h3><p>Associate Full-Stack Software Engineer working across React, Spring Boot, Python, MuleSoft, SQL, and Kubernetes. Built an internal hackathon judging platform for 31 projects, repaired payment-processing defects, supported an 18,477-record Salesforce Health Cloud migration, and added New Relic monitoring that reduced incident response time by 40%.</p></div><div className="experience-meta"><span className="experience-logo" role="img" aria-label="Manulife logo" style={logoStyle('/logos/manulife.png')} /><span className="experience-type">full-stack software engineer</span></div></article>
          <article className="experience-row"><span className="experience-year">summer 2024</span><div><h3>Salesforce</h3><p>Data and Strategy Intern working with Tableau, SQL, and Snowflake. Built dashboards across 50+ datasets, developed pipelines over 10M+ records, improved query performance by 50%, and designed an AI automation solution that reached the pitch competition finals.</p></div><div className="experience-meta"><span className="experience-logo" role="img" aria-label="Salesforce logo" style={logoStyle('/logos/salesforce.png')} /><span className="experience-type">data + strategy intern</span></div></article>
          <article className="experience-row"><span className="experience-year">spring 2024</span><div><h3>Oberlin College</h3><p>Computer Laboratory Assistant supporting more than 400 students in Java and Python courses. Helped students work through data structures, recursion, object-oriented design, and debugging, contributing to a 30% increase in pass rates.</p></div><div className="experience-meta"><span className="experience-logo" role="img" aria-label="Oberlin College logo" style={logoStyle('/logos/oberlin.png')} /><span className="experience-type">computer laboratory assistant</span></div></article>
        </div>
        <div className="education-block" id="education">
          <span className="education-label">education</span>
          <article className="experience-row education-row"><span className="experience-year">2021 — 2025</span><div><h3>Oberlin College</h3><p className="education-degree">B.A. Computer Science, Data Science concentration</p><p>Coursework in algorithms, systems programming, computer architecture, security, data visualization, and statistics.</p><p className="education-honors">Grace Hopper Scholar · Forbes Under 30 Scholar · Salesforce AI Pitch Competition Finalist</p></div></article>
        </div>
      </section>

      <section className="life-section">
        <div className="section-kicker"><span>04</span><span>outside the editor</span><span className="section-line" /></div>
        <div className="section-intro"><h2>Away from<br /><em>the keyboard.</em></h2></div>
        <div className="life-grid">{lifeCards.map(({ icon: Icon, title, body, slides, strip, variant }, i) => <article key={title}><Icon size={20} />{strip}<Carousel slides={slides} label={title} variant={variant} /><span>{String(i + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="contact-section" id="contact">
        <div className="section-kicker"><span>05</span><span>contact</span><span className="section-line" /></div>
        <div className="contact-grid">
          <div className="contact-intro">
            <h2>Pull requests <em>welcome.</em></h2>
            <p>Have an idea, a question, or something cool to build? Send it my way.</p>
          </div>
          <div className="contact-links">
            {contactLinks.map(({ label, value, href, icon: Icon }) => href
              ? <a className="contact-row" key={label} href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}><span className="contact-label"><Icon size={16} />{label}</span><span className="contact-value">{value}</span></a>
              : <div className="contact-row is-pending" key={label}><span className="contact-label"><Icon size={16} />{label}</span><span className="contact-value">{value}</span></div>
            )}
          </div>
        </div>
      </section>

      <footer><span>© 2026 Vinsline Voltaire</span><a href="#top">back to top ↑</a></footer>
    </main>
  )
}
