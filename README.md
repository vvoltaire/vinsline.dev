# vinsline.dev

My personal site: projects, work experience, and the stuff I do when I'm not coding.

**Live:** [vinsline-dev.vercel.app ↗](https://vinsline-dev.vercel.app)

<img width="800" height="500" alt="Hero section with the 3D laptop opening" src="https://github.com/user-attachments/assets/ba3a359e-b4df-4e7d-870a-b139bc19f182" />

<table>
  <tr><td align="center">Dark (default)</td><td align="center">Light</td></tr>
  <tr>
    <td><img alt="Site in dark mode" src="https://github.com/user-attachments/assets/401cd282-36b7-42d7-808d-b9f5cc2d601d"></td>
    <td><img alt="Site in light mode" src="https://github.com/user-attachments/assets/225ffc83-f09b-4e98-aa1a-e7e0221a95c7"></td>
  </tr>
</table>

## What's on it

The centerpiece is a 3D laptop. Drag it to rotate, click to open or close the lid, and press the glowing key to flip between dark and light. Every time it opens, the screen types out a boot sequence.

The rest of the page is meant to be poked at. You can turn on background lines from the top bar and pluck them, click any empty space to grow a small circuit board that fades out, strum six guitar strings with your cursor, flip through a photo gallery styled like a camera viewfinder, doodle on a sketchpad that slowly erases itself, and water Lidia, my peace lily.

## How it works

The strings and background lines are each a small wave equation simulation. All velocities update before any positions, which keeps neighboring lines from feeding energy into each other until the whole thing blows up. <!-- If you hit this bug yourself, say so here. --> The loop stops once everything settles, so nothing runs while idle.

Circuit patterns come from a seeded RNG. Traces snap to a grid, turn at 45°, and stop wherever they'd cross another trace, so no two patches look alike.

The laptop is built entirely in React Three Fiber with no imported models. The name card and terminal text are real 3D objects parented to the screen mesh, so they stay put at any viewport size.

A few smaller details:

- An inline script sets the theme before first paint, so there's no flash of the wrong colors. Both themes pass WCAG AA contrast for body text.
- Everything respects `prefers-reduced-motion`, and the interactive pieces are keyboard accessible with screen-reader labels.
- Photos are resized and EXIF-stripped, so no location data ships with them.

## Stack

Next.js, TypeScript, React Three Fiber / Three.js, Canvas 2D, Tailwind CSS, Vercel

## Running locally

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Rights

The code is here for reference. Photos, artwork, and the portrait are mine, all rights reserved. Company logos belong to their respective owners.
