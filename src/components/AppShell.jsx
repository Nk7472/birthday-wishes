import { createContext, useContext, useEffect, useState } from 'react';

/**
 * The whole product is an app, so everything lives inside one phone-sized "screen":
 *   - on a phone       : it simply fills the screen (no page scrolling anywhere)
 *   - on a phone with Chrome's "Desktop site" switched on (Chrome then pretends the screen
 *     is ~1000px wide and shrinks the page): we draw the app at its real phone size and scale
 *     it up to fill the visible area, so it still looks like an app
 *   - on a computer    : a centred phone-shaped column on a dark backdrop
 * Children get a normal 390–430px wide, ~850px tall box to lay out in, in every case.
 */
const DESIGN_W = 400;
const Metrics = createContext({ mode: 'fill', w: 390, h: 844, k: 1 });
export const useShell = () => useContext(Metrics);

const phoneish = () => {
  try {
    const touch = navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;
    const small = Math.min(window.screen.width, window.screen.height) <= 640;
    return touch || small;
  } catch (e) {
    return false;
  }
};

function forced() {
  try {
    return new URLSearchParams(window.location.search).get('shell');
  } catch (e) {
    return null;
  }
}

function measure() {
  const vv = window.visualViewport;
  const iw = Math.round(vv ? vv.width : window.innerWidth);
  const ih = Math.round(vv ? vv.height : window.innerHeight);
  const f = forced(); // ?shell=scaled | column | fill  (for testing)
  const mode = f || (iw <= 560 ? 'fill' : phoneish() ? 'scaled' : 'column');
  if (mode === 'fill') return { mode, w: iw, h: ih, k: 1 };
  if (mode === 'scaled') {
    const k = iw / DESIGN_W;
    return { mode, w: DESIGN_W, h: Math.round(ih / k), k };
  }
  const h = Math.min(ih - 32, 900);
  const w = Math.round(Math.max(340, Math.min(430, h * 0.4615)));
  return { mode: 'column', w, h, k: 1 };
}

export default function AppShell({ children }) {
  const [m, setM] = useState(measure);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setM((prev) => {
        const n = measure();
        return prev.mode === n.mode && prev.w === n.w && prev.h === n.h && Math.abs(prev.k - n.k) < 0.001 ? prev : n;
      }));
    };
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    document.addEventListener('fullscreenchange', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      document.removeEventListener('fullscreenchange', update);
    };
  }, []);

  let style;
  if (m.mode === 'fill') style = { left: 0, top: 0, width: '100%', height: '100%' };
  else if (m.mode === 'scaled') style = { left: 0, top: 0, width: m.w, height: m.h, transform: `scale(${m.k})`, transformOrigin: '0 0' };
  else style = { left: '50%', top: '50%', width: m.w, height: m.h, transform: 'translate(-50%, -50%)' };

  return (
    <Metrics.Provider value={m}>
      <div className={`app-backdrop ${m.mode}`}>
        <div className={`app app-${m.mode}`} style={style} data-app>
          {children}
        </div>
      </div>
    </Metrics.Provider>
  );
}
