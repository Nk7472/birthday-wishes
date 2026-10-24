# Writing a Wishbox template

A template is one React component that plays a full-screen animated birthday
scene for a friend. Mounting it = the show starts (the viewer mounts it right
after the person taps "open", so audio is already unlocked).

```jsx
// src/templates/MyTemplate.jsx
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';

export default function MyTemplate() {
  const w = useWish();            // see "Wish data"
  return <Stage className="bg-slate-900 text-white">…</Stage>;
}
```

Register it in `src/templates/index.js` (id, name, tagline, emoji, music preset,
tempo, `[from, to]` card colours, loader).

## Wish data — `useWish()`

Always display-safe (no empty strings you must guard, except `from`/`age`/`photo`):

| field | meaning |
|---|---|
| `name` | first name, e.g. `"Aisha"` (max 28 chars — long names must not break your layout) |
| `age`, `ageText`, `ordinal` | `24`, `"24"`, `"24th"`; all falsy/empty when no age was given |
| `from`, `hasFrom` | sender name; `""` when not given |
| `message` | personal message, up to 280 chars (a default is supplied) |
| `wishes` | exactly 3 short strings ("things I love about you"), defaults supplied |
| `photo`, `hasPhoto` | square JPEG data-URL or `""`. Use `<Avatar/>` and it handles both. |
| `initials` | first letter, for custom fallbacks |

Handle: no photo, no age, no sender, a very long message, a long name.

## The Stage and units — most important rule

`<Stage>` fills its parent. In the app it is full screen on a phone/desktop AND a
phone-sized app screen. So **never use `vw`, `vh`, `dvh`,
`100vh`** for layout or sizing. Stage is a CSS size container, so use container
units: `cqw`, `cqh`, `cqmin` (smaller of the two), `cqmax`.

* Size things with `cqmin`: `w-[30cqmin]`, `text-[clamp(1.5rem,8cqmin,4rem)]`, `gap-[3cqmin]`.
* Design **mobile portrait first** (most recipients open it on a phone: ~390×844),
  but it must also look intentional at 1440×900 landscape. A common approach:
  a centred content column `mx-auto h-full w-full max-w-[min(100cqw,74cqh)]`, with
  full-bleed background layers behind it.
* Keep important content out of the top-right 56px (replay/mute buttons live there)
  and keep the bottom ~15cqmin free of key content (a "make your own" pill appears there).
* Fonts: `font-script` (Dancing Script), `font-hand` (Caveat), `font-playfair`,
  `font-cinzel`, `font-fredoka`, `font-pixel` (Press Start 2P), `font-comic` (Bangers),
  `font-monoton`, `font-righteous`, `font-pacifico`, `font-ui` (system / Inter; default). Add any display font you use to the template's `fonts` list in `templates/index.js` and to `src/lib/fonts.js`.
  They load from Google Fonts in the real app. In the offline sandbox they fall back
  to a generic font, so leave slack: pixel/display fonts are wider than the fallback.

## Tailwind CSS v4

Utility classes only (+ inline `style` for dynamic values, + tiny inline `<style>` is NOT allowed —
put reusable keyframes in `src/index.css` under `@theme` only if you truly need them, and
prefer the existing `animate-*` set). Class names must appear as complete strings
in source (no `` `bg-${color}-500` ``).

* Avoid `backdrop-blur`, `mix-blend-*` and big animated `blur-*` layers: they cost frames on phones. Use a more opaque background instead.
* Video export: give your template a `video: { seconds, taps }` entry in `templates/index.js` (taps are `[sec, 'css selector', nth?]` or `[sec, x%, y%]`).
* Gradients: `bg-linear-to-b from-… via-… to-…` (also `bg-gradient-to-b` works). Radial: `bg-radial-[at_50%_30%] from-… to-…`, or inline `style={{background:'radial-gradient(...)'}}`.
* Arbitrary values everywhere: `w-[42cqmin]`, `top-[12%]`, `text-[#ffcc00]`, `[font-size:clamp(1rem,5cqmin,3rem)]`, `[animation-delay:300ms]`.
* v4 renames: `shadow-xs/sm/md`, `rounded-xs`, `outline-hidden`, `ring` is 1px (use `ring-2`), `blur-xs`. `size-10` = w+h.
* Custom animations available as `animate-*`: float, float-slow, sway, rise-up, fall, twinkle,
  flicker, shimmer, spin-slow, pulse-glow, bounce-soft, gradient-shift, beam, eq, flash,
  wobble, pop-in, fade-up, fade-in, zoom-in, drop-in, smoke (+ Tailwind's spin, ping, pulse, bounce).
  Override timing inline: `style={{ animationDelay: '600ms', animationDuration: '3s' }}`.
  For one-off motion use inline `style={{ animation: '…' }}` with a keyframe from the list, or
  CSS transitions toggled by state (`transition-all duration-700 ease-out` + state flip from `useTimeline`).
* `transform-3d`, `perspective-distant`, `rotate-x-*`, `rotate-y-*` exist in v4 for 3D.
* No `vw/vh`. No extra npm packages (only `react` and `react-dom` exist).

## Shared toolkit (`src/components/shared`, `src/lib`)

| import | what it gives you |
|---|---|
| `Stage` | root container (see above). Confetti canvas lives inside it. |
| `Avatar` | the photo or a coloured initial. `className="h-[28cqmin] w-[28cqmin]"`, `rounded="rounded-full" \| "rounded-2xl" …`, `fallbackClassName` for the no-photo gradient. |
| `Reveal` | `<Reveal anim="fade-up\|fade-in\|pop-in\|zoom-in\|drop-in" delay={ms}>` entrance via CSS. Stays hidden until delay. |
| `SplitText` | per-letter entrance: `<SplitText text="Happy Birthday" delay={300} stagger={50} anim="pop-in" className="…" letterStyle={(i,ch)=>({color:…})} />` |
| `Typewriter` | `<Typewriter text={w.message} speed={38} delay={500} onDone={…} />` reserves its full height, so no layout jump. |
| `Drift` | particle field: `<Drift count anim="rise\|fall\|twinkle\|float\|float-slow\|spin" size={[min,max]} duration={[s,s]} sway>{(p)=>…}</Drift>`; `p = {i,size,color,hue,rot,x,y}`; stable per render. |
| `CanvasLayer` | managed `<canvas>` loop for heavy effects (fireworks, starfield…): `setup({w,h})→state`, `draw({ctx,w,h,t,dt,state})`, optional `onTap`. |
| `Balloon`, `Cake` | SVG art. `<Balloon color label />`, `<Cake tiers candles lit colors onClick />` |
| `useTimeline(cues)` | `const step = useTimeline([0, 1200, 3500])` → number of cues fired. Script your show with `step >= 2`. |
| `useTyped`, `useCountUp`, `useRaf`, `useTimeout`, `useAudioLevelRef` | see `hooks.js` |
| `sfx` from `lib/audio` | `pop sparkle boom crackle coin whoosh blow chime(freq) tada kick tick`. Silent when muted/locked. Trigger from `useEffect` keyed on `step`, or from taps. |
| `confetti` from `lib/confetti` | `burst({x,y,count,angle,spread,power,colors,shapes,emojis})` (x/y are 0..1 of the stage), `cannons()`, `rain({duration})`, `emoji([...])`, `stars()`, `clear()`. |
| `listenForBlow` from `lib/mic` | microphone blow detection (used by Make a Wish). Always provide a tap fallback. |
| `rng` from `lib/rng` | `makeList(n, seed, (rng,i)=>…)`, `between`, `pick`, `mulberry32` — use instead of `Math.random()` in render so layouts are stable. |

Do not change shared files. If you need something new, build it inside your template file.

## What "great" looks like (quality bar)

1. **A signature moment in the first 3 seconds** that nobody has seen in the other templates
   (curtains opening, a sky igniting, a box bursting…). Each template has its own visual language:
   its own palette, type, motion style — it must not look like a recoloured Balloon Bash.
2. **Ambient life**: something is always gently moving (twinkle, drift, glow) — but nothing janky.
   Animate `transform`/`opacity` only (GPU-friendly). Avoid animating `blur`/`box-shadow` on many elements.
3. **A scripted sequence** via `useTimeline`: build-up → reveal the friend (photo + name + age) →
   deliver the message (and the 3 `wishes` where it suits the theme) → a lingering final state with
   ambient motion. It should still look finished 60 seconds later (the song loops).
4. **One interaction** that rewards a tap (pop things, blow candles, launch a firework, flip a card…),
   with sound (`sfx`) and/or confetti. Never *require* a tap to see the message.
5. **Sound design**: 3-6 well-timed `sfx` calls tied to what's on screen.
6. **Copy** is warm and specific, not generic. Use `w.name`, `w.ordinal` ("Happy 24th") when present, `w.from`.
7. **Robustness**: works with/without photo, age, sender; 360×640 up to 1440×900; text never overflows;
   `Avatar` is the only place the photo is rendered; respect long names via `truncate`/clamped font sizes.
8. Clean, readable code (like `BalloonBash.jsx`), no dead code, no console output.

## Quality checklist before you ship a template

Open it at 390×844 (phone), 1440×900 (desktop) and in the studio's phone frame, then try:
no photo, no age, no sender, a 28-character name, a 280-character message, muted audio.
Nothing may overflow, overlap the replay/mute buttons (top-right) or the "make your own"
pill (bottom), and the scene must still look finished a minute after it started.


## Rules that keep "Download video" working

The video export films your scene frame by frame on a **virtual clock** (`src/lib/vclock.js`), so a few
habits matter:

* Use the global `setTimeout` / `setInterval` / `requestAnimationFrame` / `performance.now()` (or the hooks
  in `shared/hooks.js`). Do not capture them at module load (`const st = setTimeout`) and do not use Web
  Workers or `await fetch` for timing.
* CSS animations, transitions and `element.animate()` are all fine: they are frozen and stepped for you.
  Animated properties that are not `transform` / `opacity` also work, but they are slower on phones.
* Everything must be drawable from the DOM. Canvas is fine (it is snapshotted); WebGL, `<video>` and
  cross-origin images are not.
* Sounds go through `sfx.*` / `startMusic` (they are logged while filming and replayed into the file).
* Put interactions behind a stable selector (`aria-label="…"`) and list them in the registry's
  `video.taps` so the show plays itself in the preview and in the video.
