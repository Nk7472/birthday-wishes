# Wishbox — virtual birthday & love wishes

An iPhone-style web app. Pick **Birthday** (16 animated scenes), **Lovers** (6 scenes) or **Thank you** (6 scenes), add your friend's
name, photo, a message (and, for thank-yous, what you are thanking them for), and send them a single link. They open it like a gift: the birthday song starts, the scene plays,
and their name, photo and your words are woven into it.

Built with **Vite + React 19 + Tailwind CSS v4**, a small backend of **Vercel serverless functions** (`api/`) and
**MongoDB Atlas** for the data. Music and sound effects are synthesized live with the Web Audio API, so there are no
audio files.

## Run it

```bash
npm install
cp .env.example .env.local     # then fill in MONGODB_URI (+ AUTH_SECRET), see "Database" below
npm run dev                    # http://localhost:5173  (also serves /api/* from the ./api folder)
npm run build                  # static site in dist/  (deploy on Vercel: the api/ folder becomes the backend)
```

Without `MONGODB_URI` the API still works but keeps data **in memory** (lost on restart), which is handy for a quick
look. Open `/api/health` to see which one is active: `{"store":"mongo"}` means Atlas is connected.

## How the app flows (like a book, no page scrolling)

1. **Home**: two cards, *Birthday* and *Lovers* (each with a small looping example).
2. **Details** (3 pages): photo with an Instagram-style frame (drag / pinch / slider, circle or square),
   then name · age · from, then message and three things you love.
3. **Scenes**: swipe 2:3 cards (small silent looping animation), nothing is selected by default; tap one and
   a **Preview** button slides up. That tap unlocks sound *and* enters full screen.
4. **Preview**: full screen, film-style 3-2-1 countdown,
   then the scene plays with no controls. When it ends: **Back**, **Download video**, **Share**.
   **Download video** asks the person to sign up / log in first (see *Accounts*).

The shell (`components/AppShell.jsx`) always lays the app out as a phone screen: it fills a phone, scales up
when Chrome is in "Desktop site" mode (Chrome then pretends the screen is ~1000px wide), and is a centred
phone column on a computer. Test it with `?shell=scaled`, `?shell=column`, `?shell=fill`.

## Scenes

Birthday: Balloon Bash, Midnight Fireworks, Neon Nights, Golden Gala, Cosmic Voyage, Enchanted Garden,
Candy Land, Pixel Arcade, Polaroid Memories, Surprise Box, Sky Lanterns, Deep Sea Party, Comic Pop,
Movie Premiere, Funny Teddy, Make a Wish (blow into the mic or tap).

Lovers (with an original slow love melody): Heartbeat, Love Letter (tap the seal), Rose Bloom, Our
Constellation, Firefly Wish, Our Story (a little book, tap to turn pages).

Thank you (with an original warm theme): Thank You Card (tap to open), Bouquet (tap for petals), Teddy Thanks,
Golden Sunrise, Not Just "Thanks 👍" (a chat that turns a lazy thumbs-up into a real thank you), Gratitude Jar
(tap to add hearts). The form asks **"What are you thanking them for?"** with one-tap suggestions (your birthday wishes,
your help, the lovely gift…) and the scenes read *Thank you for …*. Leave it empty and it says *Thank you for everything*.

## How sharing works

There is no server. Everything the recipient needs is encoded in the link:

```
https://your-site/#/w/<base64url JSON>~<base64url 224px JPEG photo>
```

The photo is cropped to a small square in the browser (the frame you chose), so links are long (a few KB)
but self-contained. **Share** opens the phone's own share sheet (or an iOS-style sheet with Copy link /
WhatsApp on computers). For short links, add a tiny backend that stores the same payload and swap
`buildLink` / `parseHash` in `src/lib/share.js`.

The recipient first sees a gift ("Tap to open"): browsers only allow audio after a tap, and that same tap
also goes full screen.

## Chrome-only gate

Wishbox is tuned for **Google Chrome**. In another browser or an in-app browser (Instagram, Facebook,
TikTok, …) a single no-scroll screen says "We use Chrome for better results". **Open in Chrome** opens a
two-step guide (tap ⋮ → Open in Chrome), with a copy-link fallback and "Continue anyway".
The guide shows illustrated phones; to use real screenshots instead, drop `step-1.png` and `step-2.png`
(any size, ~9:16) into `public/guide/` and they replace the illustrations automatically.
Code: `src/lib/browser.js`, `src/components/BrowserGate.jsx`. Test with `?gate=instagram`, `instagram-ios`,
`facebook`, `tiktok`, `snapchat`, `safari`, `firefox`, `edge`, `chrome`.

## Download video

**Download video** replays the scene full screen under a blur layer with a "Making your video" progress bar,
and takes 24 snapshots for every second of the show. It works on phones and needs no permission prompt:

1. **Film** (`src/lib/videoExport.js`, `vclock.js`, `snapshot.js`): the scene runs on a *virtual clock* that
   is stepped 1/24 s at a time, so it never falls behind however slow the device is. Each step the DOM is
   cloned with every running animation frozen at its current frame, wrapped in an SVG `<foreignObject>`
   together with the page CSS and the fonts it uses, rasterised by the browser (faces that point away in 3D, e.g. the Surprise Box card back, are hidden by hand because the
   renderer ignores `backface-visibility`; large photos are shrunk to video size once), and JPEG-encoded on
   background threads.
2. **Finish**: the frames are played back at 24 fps onto a canvas, while the music and effects that were
   logged during step 1 are replayed through the synthesiser into a `MediaRecorder` → MP4 (H.264/AAC) when
   Chrome supports it, otherwise WebM. That part takes as long as the video itself.

Every download gets its own file name (`wishbox-<name>-<date>-<time>.mp4`), so Chrome never asks
"download this file again?".

The progress screen shows the stage, a percentage that only moves forward, time elapsed, time left and a
live blurred preview, so it is always visible that work is happening. If nothing moves for 30 s it offers
**Switch to fast mode**.

Speed: the filming step picks its own quality (frame size and fps, 24 down to 12) so that it fits a time
budget of about 90 s minus the video length, then the finishing step takes as long as the video itself.
Measured here in headless Chromium: a 15 s scene ≈ 38 s in total, a 40 s scene ≈ 81 s, and a 15 s scene with
the CPU slowed 4× ≈ 77 s. A very slow phone running a 40–50 s scene (Funny Teddy, Movie Premiere) can pass two
minutes, because the finishing step is real time. Short scenes are the safe choice for the fastest videos.
Real phones were not available for testing, so please try one and send me the numbers. The preview's tap script
(`video: { seconds, taps }` in `src/templates/index.js`) is reused, so the video matches the preview.

## Accounts (sign up / log in)

**Download video** is only available to a signed-in person. Tapping it while signed out opens a sheet:

0. **"I'm not a robot"** (dummy for now): tap the box, a second of loading, then a big
   blue **"Verified by Wishbox"** seal appears at the top and the **Next** button unlocks.
1. **Name + password** (Continue), under a big **"Your profile is almost complete"** progress bar
2. **Phone number + email ID** (Create profile)

Every field is checked as you go, missing ones are shown in red with a message, and the sheet will not move on until
they are right. Existing people use the **Log in** tab (email + password, no captcha). Once signed in, a round profile
button appears at the top right of Home (Gallery, Sign out).

The server (`api/auth.js`) does the real checking: passwords are hashed with scrypt, the login is a signed httpOnly
cookie, and 8 wrong passwords lock the account for 10 minutes.

**About the captcha:** for now it is a **dummy** (`src/components/Captcha.jsx`): tap the box, it spins for a second, then
shows verified. Nothing is checked on the server. To make it real, use Cloudflare Turnstile or reCAPTCHA and verify its token
in `api/auth.js` before creating the account.

## Location before Preview

Tapping **Preview** asks for the person's location first, and **nothing else happens at that moment**: Chrome's own
permission dialog opens on its own (going full screen at the same time used to close it). Only after the latitude and
longitude have been **saved in the database** does the app go full screen and start the scene. If more than a few
seconds passed while the person read Chrome's dialog, the browser no longer lets us go full screen by ourselves, so a
drawer shows **Start preview** (one tap).

If location cannot be had, the drawer slides up with the teddy and the right help:

| Situation | Drawer |
|---|---|
| **Don't allow** (asked just now) | teddy explains why, **Continue with location** asks again |
| **Never allow** (Chrome remembered a block, so it shows no dialog) | animated how-to: Android / desktop: the icon at the left of the address → Permissions → Location → Allow; iPhone: Settings → Chrome → Location → While Using |
| **Location is off** on the phone/computer | animated how-to for the system switch (Android quick settings tile, iPhone Location Services) |

The drawer retries by itself when the person comes back from Settings or Chrome's permission changes, and has an
**I allowed it, continue** button. The pictures are small animations drawn in code (`LocationGuide.jsx`). To use real
screen recordings instead, put MP4 files in `public/guide/` named `location-<os>-<kind>.mp4`, e.g.
`location-android-blocked.mp4`, `location-ios-blocked.mp4`, `location-android-off.mp4`, `location-ios-off.mp4`,
`location-desktop-blocked.mp4`, `location-desktop-off.mp4`; they play over the animation automatically.

Honest limits: a website cannot open Chrome's or Android's own "Turn on location?" box (the one Google Maps shows). That
is a native-app feature (Google Play services). A web page can only ask the browser, so the drawer guides the person
instead. The browser also never reveals whether a block was remembered; we infer it from "denied without a dialog".

* Chrome only allows location on **https://** or **localhost**. Over plain `http://192.168…` (a phone on your Wi-Fi
  during development) the dialog cannot appear, so the location step is skipped there. Test on the Vercel https URL.
* The location is stored as plain numbers: `latitude`, `longitude`, `accuracy` (plus a GeoJSON `loc` point so you can
  later query "near me" with MongoDB).

## Database (MongoDB Atlas) and Vercel

Environment variables (see `.env.example`; set them in `.env.local` locally and in Vercel › Settings › Environment
Variables). **Never commit real values.**

| Variable | What |
|---|---|
| `MONGODB_URI` | the Atlas connection string, with your database user's password in place of `<password>` |
| `MONGODB_DB` | database name, default `wishbox` |
| `AUTH_SECRET` | long random string that signs the login cookie (required in production) |

In Atlas: **Network Access → Add IP address → Allow access from anywhere (0.0.0.0/0)**, because Vercel's servers do not
have a fixed address. The database user needs read/write access.

### How the data is organised: one "folder" per person

When the site loads, the server gives that browser an id like **`user1_k3f9a2`** (a running number + a random tail) and
everything that person does is filed under it. MongoDB has no real folders, so each *kind of data* is a collection and
every document carries the person's id in a field called **`uid`**. In Atlas / Compass, filter any collection with
`{ "uid": "user1_k3f9a2" }` and you see exactly that person's folder. (One database or one collection *per person* would
hit Atlas's limits quickly, which is why it is done this way.)

| Collection | Holds | Key |
|---|---|---|
| `users` | one **root** document per person: status (`visitor` / `member`), name, counts for every folder, last seen, OS, last location | `_id = uid` |
| `auth` | the login: name, email, phone, **hashed** password (members only) | `_id = uid` |
| `devices` | each phone/browser they used: platform (Android/iOS/desktop, model), language, time zone, screen, country/city, first landing | `_id = device id`, + `uid` |
| `events` | every button click (label, never typed text), screen, and named moments (template chosen, preview, location answer, captcha, sign-up steps, video made, errors) | + `uid` |
| `photos` | the real image files, **kept forever** even when replaced in a wish | + `uid` |
| `locations` | every location answer: status, `latitude`, `longitude`, accuracy | + `uid` |
| `wishes` | the friend's details, what the thanks is for, **every template used**, and flags | + `uid` |

* When someone signs up, their `uid` simply becomes their account id: everything collected before is already theirs.
* When someone logs in on **another phone**, what that phone collected as a visitor is **merged** into the account
  (documents are re-labelled with the account's `uid`, tagged `mergedFrom`; the old visitor root is marked `merged`).
* After **Sign out**, that browser starts again as a brand-new visitor with a new `uid`.
* A wish id that belongs to someone else can never be overwritten (the `uid` is part of every write's filter).
* The Atlas password and `AUTH_SECRET` live only in environment variables, never in files.

Speed: the page never waits for the database. Clicks and wishes go into a background queue that sends them when the
browser is idle, retries when offline, survives a reload and pauses while a video is being made; photos are uploaded as
real JPEG files (not JSON), and the first call of a visit carries the device details and the clicks together.
For the lowest delay set your Vercel function region (Settings › Functions) to the same region as your Atlas cluster.

The **Gallery** (profile icon › Gallery) reads `photos` and `wishes` from the database: a *Friends* tab (photo, details,
templates used, "Video saved" / "Shared") and a *Photos* tab with every photo, including replaced ones.

### Seeing your data

* **Atlas website**: Database › your cluster › **Browse Collections** › database `wishbox` (collections appear after the first
  write: `users`, `auth`, `devices`, `events`, `photos`, `locations`, `wishes`, `counters`). Filter by `{ "uid": "user1_…" }`.
* **VS Code**: the MongoDB extension › your connection › `wishbox` › open a collection (or a Playground to run queries).
* **Terminal**: `npm run usertree` lists every person (`user1_…`) with the size of each folder, and
  `npm run usertree -- user1_k3f9a2` opens one person's folders (login without password, devices, latest events, photos, locations, wishes).
* **Terminal**: `npm run dbcheck` connects, prints how many documents each collection holds and the latest events, and
  explains in plain English if it cannot connect.

### If the Network tab shows 500 on `/api/...`

The API cannot reach the database. Open **`/api/health`** (e.g. http://localhost:5173/api/health): it shows the reason, and the
500 responses carry a `hint` field too. The usual causes:

1. `npm install` was not run again (the `mongodb` package is missing).
2. `MONGODB_URI` still contains `<password>` / `<db_username>`, or the password is wrong or has symbols (URL-encode them).
3. Atlas **Network Access** does not allow your IP: add `0.0.0.0/0`, wait a minute, restart `npm run dev`.
4. Your network cannot resolve the Atlas address (`querySrv ENOTFOUND/ECONNREFUSED`): add `MONGODB_DNS=8.8.8.8,1.1.1.1` to `.env.local`.

You must restart `npm run dev` after changing `.env.local`.

You are collecting locations, phone numbers and click history, so add a short privacy notice to the site before launch
(what is stored and why); some countries require it.

## Design system

Five colours (`src/index.css`): canvas `#F5F5F7`, surface `#FFFFFF`, ink `#1D1D1F`, mute `#6E6E73`, accent
`#0071E3`. System font stack (SF Pro on Apple, Inter elsewhere). iOS motion: `--ease-out`, `--ease-spring`,
`--ease-soft-spring` (CSS `linear()` springs), press-down `.btn`, push/pop screens (`.screen-*`),
bottom sheets (`.ui-sheet`). Animations use `transform`/`opacity` only; `lib/quality.js` drops particle
counts and canvas resolution automatically when frames run slow.

## Project layout

```
api/                       Vercel functions: session, events, auth, photos, wishes, location, gallery, health (+ _store.js = MongoDB / memory)
shared/                    validation used by both the browser and the API
src/
  App.jsx, main.jsx        gate → Studio  or  #/w/… recipient Player;  Exporter overlay
  screens/                 Home, Details (+PhotoFrame), Scenes, Player, Studio (screen stack), ShareSheet, Exporter, Auth, Profile, Gallery, LocationDrawer
  components/              AppShell, BrowserGate, GiftGate, Countdown, TemplateCard, TemplateRunner
    shared/                Stage, Avatar, Drift, CanvasLayer, SplitText, Typewriter, Reveal, Board, hooks…
  lib/                     api, track, sync, location, auth, audio, vclock, snapshot, videoExport, confetti, share codec, image, quality…
  templates/               22 scenes, index.js registry, cards.js (card art)
```

## Add your own template

1. Create `src/templates/MyScene.jsx` (start from a small one).
2. Register it in `src/templates/index.js` (`category: 'birthday' | 'love'`, name, tagline, emoji, music preset,
   tempo, `song`, `fonts`, `video` plan, loader) and add its card art in `src/templates/cards.js`.
3. Read `TEMPLATE_GUIDE.md`.

Music presets: `musicbox`, `piano`, `chiptune`, `synth`, `bell`, `pad`, `pluck`. Songs: `birthday` (default), `love`.

## Notes

- Only Inter loads up front; each scene's display fonts load from Google Fonts when it is first opened.
- The microphone is only requested in *Make a Wish*, after the recipient taps the mic button.
- Rename the product in `src/config.js`.
