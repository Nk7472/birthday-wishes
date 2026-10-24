import { useEffect, useMemo, useState } from 'react';
import { Close } from '../components/Icons';
import { apiGet } from '../lib/api';
import { TEMPLATES } from '../templates';

const tpl = (id) => TEMPLATES.find((t) => t.id === id);
const when = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const ordinal = (n) => {
  const v = Number(n);
  if (!v) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const m = v % 100;
  return `${v}${s[(m - 20) % 10] || s[m] || s[0]}`;
};

function Avatar({ photo, name, size = 'h-14 w-14', square }) {
  const shape = square ? 'rounded-2xl' : 'rounded-full';
  return photo ? (
    <img src={photo} alt="" className={`${size} ${shape} shrink-0 object-cover`} />
  ) : (
    <span className={`${size} ${shape} grid shrink-0 place-items-center bg-[#8e8e93] text-[1.3rem] font-bold text-white`}>{(name || '?').trim().charAt(0).toUpperCase()}</span>
  );
}

/** Everything this person has made, read from the database: their friends' photos and wishes with the scenes used. */
export default function Gallery({ onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('friends');
  const [big, setBig] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setError('');
    apiGet('gallery')
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [tick]);

  useEffect(() => {
    const key = (e) => e.key === 'Escape' && (big ? setBig(null) : onClose());
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, big]);

  const src = (id) => (id ? `/api/photos?id=${id}` : '');
  const usedBy = useMemo(() => {
    const m = {};
    (data?.wishes || []).forEach((w) => w.photoId && (m[w.photoId] ??= []).push(w.name));
    return m;
  }, [data]);

  return (
    <div className="ui-sheet absolute inset-0 z-[110] flex flex-col bg-canvas text-ink" role="dialog" aria-modal="true" aria-label="Gallery">
      <header className="flex items-center justify-between px-5 pb-2 pt-[max(1.1rem,env(safe-area-inset-top))]">
        <h2 className="text-[1.8rem] font-bold tracking-[-0.04em]">Gallery</h2>
        <button type="button" onClick={onClose} aria-label="Close gallery" className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.07] text-mute active:opacity-60">
          <Close width={16} height={16} strokeWidth={2.6} />
        </button>
      </header>
      <div className="px-5">
        <div className="seg w-full" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'friends'} className={`flex-1 justify-center ${tab === 'friends' ? 'on' : ''}`} onClick={() => setTab('friends')}>
            Friends{data ? ` · ${data.wishes.length}` : ''}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'photos'} className={`flex-1 justify-center ${tab === 'photos' ? 'on' : ''}`} onClick={() => setTab('photos')}>
            Photos{data ? ` · ${data.photos.length}` : ''}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {error ? (
          <div className="mt-10 text-center">
            <p className="text-[0.95rem] text-mute">{error}</p>
            <button type="button" className="btn btn-primary mt-4" onClick={() => setTick((t) => t + 1)}>Try again</button>
          </div>
        ) : !data ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[5.2rem] animate-pulse rounded-3xl bg-black/[0.06]" />
            ))}
          </div>
        ) : tab === 'friends' ? (
          data.wishes.length ? (
            <ul className="space-y-3">
              {data.wishes.map((w) => {
                const used = w.templates.length ? w.templates : w.template ? [w.template] : [];
                return (
                  <li key={w.id} className="card flex gap-3.5 p-4">
                    <Avatar photo={src(w.photoId)} name={w.name} square={w.frame === 'square'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1.1rem] font-bold tracking-[-0.02em]">{w.name || 'Unnamed'}</p>
                      <p className="truncate text-[0.85rem] text-mute">
                        {w.category === 'love' ? 'Lovers wish' : w.category === 'thanks' ? `Thank you${w.reason ? ` for ${w.reason}` : ''}` : `${w.age ? `${ordinal(w.age)} birthday` : 'Birthday wish'}`}
                        {w.from ? ` · from ${w.from}` : ''}
                      </p>
                      {w.message ? <p className="mt-1 line-clamp-2 text-[0.85rem] leading-snug text-ink/80">“{w.message}”</p> : null}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {used.map((id) => (
                          <span key={id} className="rounded-full bg-canvas px-2.5 py-1 text-[0.75rem] font-semibold">
                            {tpl(id)?.emoji || '🎁'} {tpl(id)?.name || id}
                          </span>
                        ))}
                        {w.flags.exported ? <span className="rounded-full bg-[#30d158]/15 px-2.5 py-1 text-[0.75rem] font-semibold text-[#1c8a3a]">Video saved</span> : null}
                        {w.flags.shared ? <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[0.75rem] font-semibold text-accent">Shared</span> : null}
                        {!used.length ? <span className="rounded-full bg-canvas px-2.5 py-1 text-[0.75rem] font-semibold text-mute">No scene yet</span> : null}
                      </div>
                      <p className="mt-2 text-[0.75rem] text-mute">{when(w.updatedAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-16 text-center text-[0.95rem] text-mute">No wishes yet. Make one and your friends will show up here.</p>
          )
        ) : data.photos.length ? (
          <ul className="grid grid-cols-3 gap-2.5">
            {data.photos.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setBig(p)} aria-label="Open photo" className="block aspect-square w-full overflow-hidden rounded-2xl bg-black/[0.06] active:scale-95 transition">
                  <img src={src(p.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-16 text-center text-[0.95rem] text-mute">Photos you add for your friends are kept here.</p>
        )}
      </div>

      {big ? (
        <div className="ui-fade absolute inset-0 z-10 grid place-items-center bg-black/80 p-6" onClick={() => setBig(null)}>
          <div className="ui-pop w-full max-w-[20rem] text-center" onClick={(e) => e.stopPropagation()}>
            <img src={src(big.id)} alt="" className="aspect-square w-full rounded-3xl object-cover shadow-[var(--shadow-lift)]" />
            <p className="mt-3 text-[0.9rem] font-medium text-white/90">
              {usedBy[big.id] ? `Used for ${[...new Set(usedBy[big.id])].join(', ')}` : 'Not used in a wish yet'} · {when(big.at)}
            </p>
            <button type="button" className="btn mt-3 !bg-white/15 !text-white" onClick={() => setBig(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
