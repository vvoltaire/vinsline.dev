# vinsline.dev

My personal site, covering my projects, work experience, and life outside of code.

**[View live ↗](https://vinsline-dev.vercel.app)** (https://vinsline-dev.vercel.app/)

<img width="1280" height="800" alt="Screenshot 2026-10-26 at 1 20 00 PM" src="https://github.com/user-attachments/assets/225ffc83-f09b-4e98-aa1a-e7e0221a95c7" />

<img width="1280" height="800" alt="Screenshot 2026-10-26 at 1 20 34 PM" src="https://github.com/user-attachments/assets/401cd282-36b7-42d7-808d-b9f5cc2d601d" />

# vinsline.dev

My personal site: the projects I'm building, where I've worked, and what I do away from the keyboard.

**[vinsline-dev.vercel.app ↗](https://vinsline-dev.vercel.app)**

![The hero: a 3D laptop boots up and types "access granted" next to my name](PASTE-GIF-LINK)

<table>
  <tr>
    <td><img alt="Site in dark mode" src="https://github.com/user-attachments/assets/225ffc83-f09b-4e98-aa1a-e7e0221a95c7"></td>
    <td><img alt="Site in light mode" src="https://github.com/user-attachments/assets/401cd282-36b7-42d7-808d-b9f5cc2d601d"></td>
  </tr>
  <tr><td align="center">Dark (default)</td><td align="center">Light</td></tr>
</table>

## What's on it

- **A 3D laptop you can play with.** Drag to rotate, click to open or close the lid, and press the glowing key to switch between dark and light. The screen types out a boot sequence each time it opens.
- **Background lines you can pluck.** Turn them on from the top bar, then grab a line and let go to watch it ring out and settle.
- **Circuitry under the page.** Click any empty space and a small circuit board grows out from that spot, then fades.
- **Outside the editor:**
  - a camera-viewfinder photo gallery;
  - six guitar strings you can strum with your cursor;
  - a watering can for Lidia, my peace lily;
  - a sketchpad whose doodles fade away.

## How it works

- **Strings and lines:** each one is a small physics simulation using the wave equation. Velocities are all updated before positions, which keeps neighboring lines from feeding energy into each other and blowing up. Animation stops once everything settles, so it costs nothing when idle.
- **Circuit patterns:** generated on the fly from a seeded random number generator. Traces follow a grid with 45° turns and stop where they would cross, so every patch has its own shape.
- **3D laptop:** built in React Three Fiber, with no imported model files. The name card and terminal text are real 3D objects attached to the screen, so they stay in place at any window size.
- **Themes:** a small inline script sets the theme before the page draws, so there's no flash of the wrong colors. Both themes meet WCAG contrast for small text.
- **Accessibility:** animations turn off for visitors who prefer reduced motion. Interactive pieces work with a keyboard and have screen-reader labels.
- **Photos:** resized for the web and stripped of their hidden metadata, including location.

## Tech stack

Next.js · TypeScript · React Three Fiber / Three.js · Canvas 2D · WebGL · Tailwind CSS · Vercel

## Running locally

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Rights

The code is here for reference. Photos, artwork and the portrait are mine, all rights reserved. Company logos belong to their respective owners.
