import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEY } from '../config';
import { preloadTemplate, templatesFor } from '../templates';
import Details from './Details';
import Auth from './Auth';
import Home from './Home';
import Gallery from './Gallery';
import Profile from './Profile';
import { useAuth } from '../lib/auth';
import { newId } from '../lib/api';
import { askLocation } from '../lib/location';
import { saveWish, savePhoto } from '../lib/sync';
import { setScreen, track } from '../lib/track';
import LocationDrawer from './LocationDrawer';
import Player, { unlockAndEnter, unlockSound } from './Player';
import { enterFullscreen } from '../lib/fullscreen';
import Scenes from './Scenes';
import ShareSheet, { nativeShare } from './ShareSheet';

const EMPTY = { wid: '', sent: false, category: '', template: '', name: '', age: '', from: '', message: '', reason: '', wishes: ['', '', ''], photo: '', frame: 'circle' };

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') return { ...EMPTY, ...saved, wid: saved.wid || newId(), wishes: [...(saved.wishes || []), '', '', ''].slice(0, 3) };
  } catch (e) {
    /* ignore */
  }
  return { ...EMPTY, wid: newId() };
}

/** Tiny iOS-style navigation stack: push slides in from the right, the page below drifts left. */
function useStack(root) {
  const [stack, setStack] = useState([root]);
  const [out, setOut] = useState(null);
  const timer = useRef(0);
  const push = useCallback((k) => setStack((s) => (s[s.length - 1] === k ? s : [...s, k])), []);
  const pop = useCallback(() => {
    setStack((s) => {
      if (s.length < 2) return s;
      setOut(s[s.length - 1]);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOut(null), 520);
      return s.slice(0, -1);
    });
  }, []);
  const reset = useCallback(() => setStack([root]), [root]);
  return { stack, out, push, pop, reset };
}

export default function Studio({ onOpenExport }) {
  const [draft, setDraft] = useState(loadDraft);
  const [session, setSession] = useState(null); // photo being framed (not saved)
  const [playing, setPlaying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const user = useAuth();
  const [asking, setAsking] = useState(false); // sign in / sign up sheet
  const [profile, setProfile] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [loc, setLoc] = useState(null); // { reason } while the teddy drawer is open
  const [locBusy, setLocBusy] = useState(false);
  const nav = useStack('home');

  const set = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      /* storage full or blocked: not critical */
    }
  }, [draft]);

  // saved once the person has stopped framing it for a moment (each drag of the frame makes a new crop)
  useEffect(() => {
    if (!draft.photo) return undefined;
    const t = setTimeout(() => {
      savePhoto(draft.photo);
      track('photo_saved');
    }, 2000);
    return () => clearTimeout(t);
  }, [draft.photo]);

  useEffect(() => {
    if (draft.template) preloadTemplate(draft.template);
  }, [draft.template]);

  const pickCategory = (category) => {
    track('category_pick', { category, again: !!draft.category });
    if (draft.sent) set({ wid: newId(), sent: false }); // a finished wish stays as it was; this is a new one
    if (category !== draft.category) {
      // a different kind of wish: keep who/photo, reset the wording and the scene
      set({ category, template: '', age: '', message: '', reason: '', wishes: ['', '', ''] });
    }
    nav.push('details');
  };

  const category = draft.category || 'birthday';
  const validTemplate = templatesFor(category).some((t) => t.id === draft.template) ? draft.template : '';

  const share = async () => {
    track('share_start', { template: validTemplate });
    saveWish(wish, 'share');
    if (!(await nativeShare({ ...draft, template: validTemplate }))) setSharing(true);
  };

  const begin = () => {
    saveWish(wish, 'preview');
    set({ sent: true });
    setPlaying(true);
  };

  // Preview needs the person's location first. Only the sound is unlocked inside the tap, so Chrome's location
  // dialog opens alone (fullscreen at the same moment hides it). Full screen starts only after the location is
  // saved in the database. Chrome gives a tap a few seconds of "permission to go fullscreen"; if the person spent
  // longer than that on the dialog we show a one-tap "Start preview" button instead.
  const startPreview = async () => {
    if (locBusy) return;
    unlockSound();
    setLocBusy(true);
    track('preview_tap', { template: validTemplate });
    const r = await askLocation();
    setLocBusy(false);
    if (!r.ok) {
      setLoc({ reason: r.reason });
      return;
    }
    if (navigator.userActivation?.isActive === false) {
      setLoc({ reason: 'ready' });
      return;
    }
    setLoc(null);
    enterFullscreen();
    begin();
  };

  const startNow = () => {
    unlockAndEnter();
    setLoc(null);
    begin();
  };

  const screens = {
    home: <Home onPick={pickCategory} user={user} onProfile={() => setProfile(true)} />,
    details: <Details draft={draft} set={set} kind={category} session={session} setSession={setSession} onBack={nav.pop} onDone={() => {
      saveWish(wish, 'details');
      track('details_done', { category, hasPhoto: !!draft.photo, hasMessage: !!draft.message.trim() });
      nav.push('scenes');
    }} />,
    scenes: (
      <Scenes
        category={category}
        value={validTemplate}
        onChange={(template) => {
          track('template_select', { template });
          set({ template });
        }}
        onBack={nav.pop}
        busy={locBusy}
        onPreview={startPreview}
      />
    ),
  };

  const items = nav.out && !nav.stack.includes(nav.out) ? [...nav.stack, nav.out] : nav.stack;
  const top = nav.stack.length - 1;
  useEffect(() => setScreen(nav.stack[nav.stack.length - 1]), [nav.stack]);

  const wish = { ...draft, template: validTemplate };

  return (
    <>
      {items.map((key, i) => {
        const isOut = key === nav.out && i === items.length - 1 && nav.out !== nav.stack[top];
        const cls = isOut ? 'screen-out' : i === top ? (i > 0 ? 'screen-in' : '') : i === top - 1 ? 'screen-under screen-dim' : 'screen-hide';
        return (
          <div key={key} className={`screen ${cls}`} inert={isOut || i !== top} aria-hidden={i !== top}>
            {screens[key]}
          </div>
        );
      })}

      {playing ? (
        <Player
          wish={wish}
          mode="preview"
          onBack={() => setPlaying(false)}
          onDownload={() => {
            track('download_tap', { signedIn: !!user, template: validTemplate });
            if (!user) return setAsking(true);
            saveWish(wish, 'download');
            onOpenExport(wish);
          }}
          onShare={share}
        />
      ) : null}
      {asking && !user ? (
        <Auth
          reason="Create a free profile (or log in) to download your video."
          onClose={() => setAsking(false)}
          onDone={() => {
            setAsking(false);
            saveWish(wish, 'download');
            onOpenExport(wish);
          }}
        />
      ) : null}
      {loc ? <LocationDrawer reason={loc.reason} busy={locBusy} onAllow={startPreview} onStart={startNow} onClose={() => setLoc(null)} /> : null}
      {profile && user ? (
        <Profile
          user={user}
          onClose={() => setProfile(false)}
          onGallery={() => {
            setProfile(false);
            setGallery(true);
          }}
        />
      ) : null}
      {gallery && user ? <Gallery onClose={() => setGallery(false)} /> : null}
      {sharing ? <ShareSheet draft={wish} onClose={() => setSharing(false)} /> : null}
    </>
  );
}
