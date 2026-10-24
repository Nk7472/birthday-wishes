import { useEffect, useRef, useState } from 'react';
import { Back, Play } from '../components/Icons';
import TemplateCard from '../components/TemplateCard';
import { CATEGORIES, preloadTemplate, templatesFor } from '../templates';

export default function Scenes({ category, value, onChange, onBack, onPreview, busy }) {
  const list = templatesFor(category);
  const cat = CATEGORIES.find((c) => c.id === category);
  const track = useRef(null);
  const [live, setLive] = useState(() => new Set([0, 1]));

  // only the cards you can see keep animating
  useEffect(() => {
    const root = track.current;
    if (!root) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        setLive((prev) => {
          const next = new Set(prev);
          entries.forEach((e) => {
            const i = Number(e.target.dataset.i);
            if (e.isIntersecting) next.add(i);
            else next.delete(i);
          });
          return next;
        });
      },
      { root, threshold: 0.25 },
    );
    root.querySelectorAll('[data-i]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [category]);

  // if one was already chosen, start centred on it
  useEffect(() => {
    const i = list.findIndex((t) => t.id === value);
    if (i > 0) track.current?.children[i]?.scrollIntoView({ inline: 'center', block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (t, i, el) => {
    onChange(t.id);
    preloadTemplate(t.id);
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };

  const chosen = !!value && list.some((t) => t.id === value);

  return (
    <div className="flex h-full flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center px-3">
        <button type="button" onClick={onBack} className="btn btn-quiet !h-10 !w-10 !p-0" aria-label="Back">
          <Back width={20} height={20} />
        </button>
      </header>
      <div className="ui-in px-6 pt-3">
        <p className="text-[0.85rem] font-semibold text-accent">{cat?.title}</p>
        <h1 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.035em]">Choose a scene</h1>
        <p className="mt-1.5 text-[0.95rem] text-mute">Swipe to browse. Tap a card to pick it.</p>
      </div>

      <div
        ref={track}
        className="scene-track mt-4 min-h-0 flex-1"
        role="listbox"
        aria-label="Scenes"
      >
        {list.map((t, i) => {
          const selected = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              data-i={i}
              role="option"
              aria-selected={selected}
              onClick={(e) => choose(t, i, e.currentTarget)}
              className="scene-card"
              aria-label={t.name}
            >
              <div className="scene-card-inner">
                <TemplateCard tpl={t} selected={selected} paused={!live.has(i)} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative h-[5.6rem] shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onPreview}
          disabled={!chosen || busy}
          tabIndex={chosen ? 0 : -1}
          aria-hidden={!chosen}
          className="btn btn-primary absolute inset-x-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] !py-[1.05rem] !text-[1.05rem] transition duration-500 [transition-timing-function:var(--ease-soft-spring)]"
          style={{ transform: chosen ? 'none' : 'translateY(160%)', opacity: chosen ? 1 : 0, pointerEvents: chosen ? 'auto' : 'none' }}
        >
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Play width={18} height={18} />} Preview
        </button>
        {!chosen ? (
          <p className="pt-1 text-center text-[0.85rem] text-mute">Pick a scene to preview it</p>
        ) : null}
      </div>
    </div>
  );
}
