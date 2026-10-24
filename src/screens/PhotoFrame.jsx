import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cropPhoto, cropPhotoBlob, loadPhoto } from '../lib/image';
import { rememberHires } from '../lib/sync';
import { Camera } from '../components/Icons';
import { useShell } from '../components/AppShell';

/**
 * Instagram-style profile photo framing. The photo sits under a dimmed mask with a circle or
 * square window; drag to move, pinch / wheel / slider to zoom. Everything during a gesture is
 * written straight to the DOM (no React renders), and the cropped JPEG is made once you let go.
 */
export default function PhotoFrame({ value, shape, onShape, onChange, session, setSession }) {
  const { k } = useShell();
  const box = useRef(null);
  const img = useRef(null);
  const input = useRef(null);
  const [size, setSize] = useState(300);
  const [zoomUi, setZoomUi] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const photo = session?.photo || null;
  const F = Math.round(size * 0.8); // frame window
  const st = useRef({ s: 1, cx: 0, cy: 0, min: 1 }); // scale, centre (image px)
  const ptrs = useRef(new Map());
  const pinch = useRef(null);
  const timer = useRef(0);
  const fitted = useRef(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setSize(el.clientWidth || 300));
    ro.observe(el);
    setSize(el.clientWidth || 300);
    return () => ro.disconnect();
  }, []);

  const clamp = useCallback(() => {
    if (!photo) return;
    const s = st.current;
    s.s = Math.min(s.min * 4, Math.max(s.min, s.s));
    const half = F / (2 * s.s);
    s.cx = Math.min(photo.w - half, Math.max(half, s.cx));
    s.cy = Math.min(photo.h - half, Math.max(half, s.cy));
  }, [photo, F]);

  const paint = useCallback(() => {
    const el = img.current;
    if (!el || !photo) return;
    const s = st.current;
    const tx = size / 2 - s.cx * s.s;
    const ty = size / 2 - s.cy * s.s;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s.s})`;
  }, [photo, size]);

  const commit = useCallback(() => {
    if (!photo) return;
    const s = st.current;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const small = cropPhoto(photo, s.cx, s.cy, F / s.s);
      onChange(small);
      // the larger version of the same crop is what gets uploaded as the photo file
      cropPhotoBlob(photo, s.cx, s.cy, F / s.s).then((b) => b && rememberHires(small, b));
      setSession((p) => (p ? { ...p, view: { s: s.s, cx: s.cx, cy: s.cy } } : p));
    }, 120);
  }, [photo, F, onChange, setSession]);

  // (re)fit when a photo arrives or the frame size changes
  useEffect(() => {
    if (!photo) return;
    const s = st.current;
    s.min = F / Math.min(photo.w, photo.h);
    if (session.view) {
      s.s = session.view.s;
      s.cx = session.view.cx;
      s.cy = session.view.cy;
    } else {
      s.s = s.min;
      s.cx = photo.w / 2;
      s.cy = photo.h / 2;
    }
    clamp();
    paint();
    setZoomUi((s.s - s.min) / (s.min * 3));
    // a newly picked photo always replaces the saved crop (before, replacing needed a drag first)
    if (!value || fitted.current !== photo) commit();
    fitted.current = photo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, F]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const p = await loadPhoto(file);
      setSession((prev) => {
        if (prev?.photo?.url) URL.revokeObjectURL(prev.photo.url);
        return { photo: p, view: null };
      });
    } catch (err) {
      setError(err.message || 'That photo could not be used. Try another.');
    } finally {
      setBusy(false);
    }
  };

  const zoomTo = (next, ax = 0.5, ay = 0.5) => {
    // zoom about a point of the viewport (fractions), keeping that image point still
    const s = st.current;
    const before = { x: s.cx + (ax - 0.5) * size / s.s, y: s.cy + (ay - 0.5) * size / s.s };
    s.s = next;
    s.s = Math.min(s.min * 4, Math.max(s.min, s.s));
    s.cx = before.x - (ax - 0.5) * size / s.s;
    s.cy = before.y - (ay - 0.5) * size / s.s;
    clamp();
    paint();
    setZoomUi((s.s - s.min) / (s.min * 3));
  };

  const down = (e) => {
    if (!photo) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: st.current.s };
    }
  };
  const move = (e) => {
    const p = ptrs.current.get(e.pointerId);
    if (!p || !photo) return;
    const s = st.current;
    if (ptrs.current.size === 1) {
      s.cx -= (e.clientX - p.x) / k / s.s;
      s.cy -= (e.clientY - p.y) / k / s.s;
      clamp();
      paint();
    }
    p.x = e.clientX;
    p.y = e.clientY;
    if (ptrs.current.size === 2 && pinch.current) {
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTo(pinch.current.s * (d / pinch.current.d));
    }
  };
  const up = (e) => {
    ptrs.current.delete(e.pointerId);
    pinch.current = null;
    if (ptrs.current.size === 0) {
      setDragging(false);
      commit();
    }
  };
  const wheel = (e) => {
    if (!photo) return;
    zoomTo(st.current.s * Math.exp(-e.deltaY * 0.0015));
    commit();
  };

  const round = shape === 'circle';

  return (
    <div className="flex flex-col items-center">
      <div
        ref={box}
        className="relative aspect-square w-full overflow-hidden rounded-[1.6rem] bg-[#e9e9ee]"
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onWheel={wheel}
      >
        {photo ? (
          <>
            <img
              ref={img}
              src={photo.url}
              alt=""
              draggable={false}
              className="absolute left-0 top-0 max-w-none origin-top-left select-none"
              style={{ width: photo.w, height: photo.h, willChange: 'transform' }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: F,
                height: F,
                borderRadius: round ? '50%' : '7%',
                boxShadow: '0 0 0 100vmax rgb(245 245 247 / 0.78)',
                outline: '2px solid #fff',
                transition: 'border-radius .45s var(--ease-spring)',
              }}
            >
              <div className="absolute inset-0 overflow-hidden transition-opacity duration-300" style={{ opacity: dragging ? 0.9 : 0, borderRadius: 'inherit' }}>
                <span className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
                <span className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
                <span className="absolute inset-x-0 top-1/3 h-px bg-white/70" />
                <span className="absolute inset-x-0 top-2/3 h-px bg-white/70" />
              </div>
            </div>
          </>
        ) : value ? (
          <div className="grid h-full w-full place-items-center">
            <img src={value} alt="Current photo" className="object-cover" style={{ width: F, height: F, borderRadius: round ? '50%' : '7%' }} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="absolute inset-0 grid place-items-center text-mute transition active:scale-[0.98]"
            aria-label="Add a photo"
          >
            <span className="flex flex-col items-center gap-3">
              <span
                className="grid place-items-center border-2 border-dashed border-black/20 bg-white/70 text-accent"
                style={{ width: F * 0.62, height: F * 0.62, borderRadius: round ? '50%' : '9%', transition: 'border-radius .45s var(--ease-spring)' }}
              >
                <Camera width={34} height={34} />
              </span>
              <span className="text-[0.95rem] font-semibold text-ink">{busy ? 'Opening…' : 'Add a photo'}</span>
              <span className="text-[0.8rem]">Then drag to frame the face</span>
            </span>
          </button>
        )}
      </div>

      {photo ? (
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={zoomUi}
          aria-label="Zoom"
          className="zoom mt-4 w-full"
          onChange={(e) => {
            const v = Number(e.target.value);
            zoomTo(st.current.min * (1 + v * 3));
            setZoomUi(v);
          }}
          onPointerUp={commit}
          onKeyUp={commit}
        />
      ) : null}

      <div className="mt-4 flex w-full items-center justify-between gap-3">
        <div className="seg" role="radiogroup" aria-label="Frame shape">
          {['circle', 'square'].map((k) => (
            <button key={k} type="button" role="radio" aria-checked={shape === k} onClick={() => onShape(k)} className={shape === k ? 'on' : ''}>
              <span className={`inline-block h-3.5 w-3.5 border-[1.8px] border-current ${k === 'circle' ? 'rounded-full' : 'rounded-[3px]'}`} /> {k === 'circle' ? 'Circle' : 'Square'}
            </button>
          ))}
        </div>
        {photo || value ? (
          <button type="button" onClick={() => input.current?.click()} className="text-[0.95rem] font-semibold text-accent active:opacity-60">
            Change photo
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-[0.85rem] text-ink">{error}</p> : null}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
    </div>
  );
}
