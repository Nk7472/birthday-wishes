import { Chevron, Gift } from '../components/Icons';
import TemplateCard from '../components/TemplateCard';
import { CATEGORIES, TEMPLATES } from '../templates';
import { initialOf } from './Profile';

const byId = (id) => TEMPLATES.find((t) => t.id === id);

export default function Home({ onPick, user, onProfile }) {
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="ui-in flex items-center gap-2.5 pt-2">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-white" aria-hidden="true">
          <Gift width={17} height={17} />
        </span>
        <span className="text-[1.05rem] font-semibold tracking-[-0.02em]">Wishbox</span>
        {user ? (
          <button
            type="button"
            onClick={onProfile}
            aria-label={`Profile: ${user.name}`}
            className="ui-pop ml-auto grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#5ac8fa] to-[#0071e3] text-[0.95rem] font-bold text-white shadow-[0_3px_10px_rgb(0_113_227/0.3)] transition active:scale-90"
          >
            {initialOf(user)}
          </button>
        ) : null}
      </header>

      <div className="ui-in mt-5 [animation-delay:70ms]">
        <h1 className="text-[2.35rem] font-bold leading-[1.02] tracking-[-0.04em]">Make someone’s day.</h1>
        <p className="mt-2 text-[1.05rem] leading-snug text-mute">Pick a kind of wish. Add a photo and a few words. Send one link.</p>
      </div>

      <div className="mt-5 grid min-h-0 flex-1 grid-rows-3 gap-3">
        {CATEGORIES.map((c, i) => {
          const tpl = byId(c.example);
          const count = TEMPLATES.filter((t) => t.category === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="ui-in card group relative flex min-h-0 items-stretch overflow-hidden text-left transition duration-500 [transition-timing-function:var(--ease-spring)] active:scale-[0.97]"
              style={{ '--i': i + 2, animationDelay: `${160 + i * 90}ms` }}
              aria-label={`${c.title} templates`}
            >
              <div className="flex min-w-0 flex-1 flex-col justify-between px-5 py-0.5 w-5">
                <span className="w-fit rounded-full bg-canvas px-2.5 py-1 text-[0.72rem] font-semibold text-mute">{count} scenes</span>
                <div>
                  <p className="text-[1.45rem] font-bold leading-[1.05] tracking-[-0.03em]">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-[0.85rem] leading-snug text-mute">{c.blurb}</p>
                  <span className="mt-2 inline-flex items-center gap-0.5 text-[0.95rem] font-semibold text-accent">
                    Choose <Chevron width={16} height={16} strokeWidth={2.6} />
                  </span>
                </div>
              </div>
              <div className="flex w-[44%] shrink-0 items-center justify-center py-3 pr-4">
                <div className="aspect-[2/3] h-full max-h-full" style={{ transform: `rotate(${i % 2 ? -5 : 5}deg)` }}>
                  <TemplateCard tpl={tpl} showText={false} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
