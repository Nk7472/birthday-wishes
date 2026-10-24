import { useState } from 'react';
import { CHROME_DOWNLOAD, chromeLink, setBypass } from '../lib/browser';
import Teddy from './shared/Teddy';
import { Check, Copy } from './Icons';

const wave = (a0, a1, dur) => ({ animation: `tedSwing ${dur}s ease-in-out infinite`, '--a0': a0, '--a1': a1 });
const WAVING = {
  head: wave('-4deg', '5deg', 1.6),
  armL: wave('3deg', '-2deg', 3),
  armR: wave('-138deg', '-172deg', 0.5),
};

/* ---- the two illustrated "screens" of the how-to ---------------------- */

function Dots({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function Phone({ children }) {
  return (
    <div className="relative mx-auto h-full w-full overflow-hidden rounded-[1.7rem] bg-ink p-[0.3rem] shadow-[var(--shadow-lift)]">
      <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-surface">{children}</div>
    </div>
  );
}

function BrowserBar({ highlight }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-black/[0.06] bg-canvas px-2 py-2">
      <span className="grid h-5 w-5 place-items-center text-[0.8rem] text-mute">✕</span>
      <span className="flex-1 truncate rounded-full bg-surface px-2.5 py-1 text-center text-[0.6rem] text-mute">wishbox · birthday</span>
      <span className="relative grid h-6 w-6 place-items-center rounded-full text-ink">
        <Dots className="h-4 w-4" />
        {highlight ? (
          <>
            <span className="absolute inset-0 rounded-full ring-2 ring-accent" />
            <span className="absolute -inset-1 animate-ping rounded-full ring-2 ring-accent/50" />
          </>
        ) : null}
      </span>
    </div>
  );
}

function ScreenOne() {
  return (
    <Phone>
      <BrowserBar highlight />
      <div className="px-3 pt-6 text-center">
        <div className="mx-auto h-10 w-10 rounded-xl bg-canvas" />
        <div className="mx-auto mt-3 h-2.5 w-24 rounded-full bg-canvas" />
        <div className="mx-auto mt-2 h-2 w-16 rounded-full bg-canvas" />
      </div>
      <span className="absolute right-1.5 top-9 rounded-md bg-accent px-1.5 py-0.5 text-[0.55rem] font-semibold text-white">Tap here</span>
    </Phone>
  );
}

function ScreenTwo({ os }) {
  const rows = [
    ['Share', false],
    ['Copy link', false],
    [os === 'ios' ? 'Open in browser' : 'Open in Chrome', true],
  ];
  return (
    <Phone>
      <BrowserBar />
      <div className="absolute inset-0 bg-ink/25" />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface p-2.5 pb-4">
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-black/15" />
        {rows.map(([label, on]) => (
          <div
            key={label}
            className={`mb-1 flex items-center justify-between rounded-lg px-2.5 py-2 text-[0.68rem] font-medium ${on ? 'bg-accent text-white' : 'bg-canvas text-ink'}`}
          >
            {label}
            {on ? <Check width={12} height={12} strokeWidth={3} /> : null}
          </div>
        ))}
      </div>
    </Phone>
  );
}

/** Real screenshots win when present: drop public/guide/step-1.png and step-2.png (see README). */
function GuideShot({ n, children }) {
  const [src, setSrc] = useState(`./guide/step-${n}.png`);
  return (
    <div className="relative mx-auto aspect-[9/16] h-full max-h-[23rem]">
      {children}
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => setSrc('')}
          className="absolute inset-0 h-full w-full rounded-[1.7rem] bg-surface object-cover shadow-[var(--shadow-lift)]"
        />
      ) : null}
    </div>
  );
}

/* ---- the gate: one screen, no scrolling ------------------------------- */

export default function BrowserGate({ info, onContinue }) {
  const [copied, setCopied] = useState(false);
  const [guide, setGuide] = useState(false);
  const [step, setStep] = useState(0);
  const { inApp, os, name } = info;
  const link = inApp ? chromeLink(os) : null;

  const copy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const cont = () => {
    setBypass();
    onContinue();
  };

  const openChrome = () => {
    if (inApp) {
      setStep(0);
      setGuide(true); // in-app browsers hide the way out, so show the two taps
    } else if (os === 'desktop') {
      window.open(CHROME_DOWNLOAD, '_blank', 'noreferrer');
    } else if (chromeLink(os)) {
      window.location.href = chromeLink(os);
    } else {
      setGuide(true);
    }
  };

  const steps = [
    {
      title: 'Tap the three dots',
      text: 'Find the ⋮ menu in the top corner of this screen.',
      shot: <ScreenOne />,
    },
    {
      title: os === 'ios' ? 'Choose “Open in browser”' : 'Choose “Open in Chrome”',
      text: os === 'ios' ? 'It opens your browser. Copy the link here, then paste it into Chrome.' : 'It may say “Open in external browser”. Pick Chrome if it asks.',
      shot: <ScreenTwo os={os} />,
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-canvas px-6 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center text-ink">
      <div className="ui-in relative mt-[3vh] w-[min(15rem,58%)] shrink-0">
        <div className="absolute -top-1 left-1/2 z-10 -translate-x-[6%] whitespace-nowrap rounded-full bg-surface px-4 py-2 text-[1rem] font-semibold shadow-[var(--shadow-card)]" style={{ animation: 'tedBubble 0.6s var(--ease-spring) 0.5s both' }}>
          Hi there! 👋
        </div>
        <div className="pt-9">
          <Teddy face="open" m={WAVING} />
        </div>
      </div>

      <h1 className="ui-in mt-[3vh] text-[2.6rem] font-bold leading-[1] tracking-[-0.045em] [animation-delay:90ms]">
        We use Chrome
        <br />
        for better results
      </h1>
      <p className="ui-in mt-4 max-w-xs text-[1.02rem] leading-snug text-mute [animation-delay:160ms]">
        {inApp
          ? `You're inside ${inApp === 'this app' ? 'an app' : `the ${inApp} app`}, which limits sound and animation. In Chrome the gift plays perfectly.`
          : `Wishbox is made for Chrome so animations, music and video download all work. ${name !== 'this browser' ? `${name} isn't supported yet.` : ''}`}
      </p>

      <div className="min-h-4 flex-1" />

      <div className="ui-in flex w-full flex-col items-center gap-2 [animation-delay:240ms]">
        <button type="button" onClick={openChrome} className="btn btn-primary w-full !py-[1.05rem] !text-[1.05rem]">
          {os === 'desktop' && !inApp ? 'Get Chrome' : 'Open in Chrome'}
        </button>
        <button type="button" onClick={copy} className="btn btn-quiet w-full">
          {copied ? <Check width={18} height={18} /> : <Copy width={18} height={18} />}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        <button type="button" onClick={cont} className="mt-1 py-1 text-[0.85rem] text-mute underline-offset-4 active:opacity-60">
          Continue anyway
        </button>
      </div>

      {/* guide overlay */}
      {guide ? (
        <div className="ui-fade absolute inset-0 z-20 flex items-end bg-black/45" onClick={() => setGuide(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="How to open in Chrome"
            className="ui-sheet flex h-[90%] w-full flex-col rounded-t-[1.9rem] bg-surface px-5 pb-[max(1.2rem,env(safe-area-inset-bottom))] pt-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-[5px] w-9 shrink-0 rounded-full bg-black/15" />
            <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
              <div className="flex h-full w-[200%] transition-transform duration-[600ms] [transition-timing-function:var(--ease-soft-spring)]" style={{ transform: `translateX(${-step * 50}%)` }}>
                {steps.map((st, i) => (
                  <section key={i} className="flex h-full w-1/2 flex-col items-center px-1" aria-hidden={i !== step}>
                    <p className="text-[0.85rem] font-semibold text-accent">Step {i + 1} of 2</p>
                    <h2 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-[-0.03em]">{st.title}</h2>
                    <p className="mx-auto mt-1.5 max-w-[17rem] text-[0.95rem] leading-snug text-mute">{st.text}</p>
                    <div className="mt-4 flex min-h-0 w-full flex-1 items-center justify-center">
                      <GuideShot n={i + 1}>{st.shot}</GuideShot>
                    </div>
                  </section>
                ))}
              </div>
            </div>
            <div className="mt-3 flex shrink-0 flex-col gap-2">
              <div className="flex justify-center gap-1.5" aria-hidden="true">
                {[0, 1].map((i) => (
                  <span key={i} className="h-1.5 rounded-full bg-ink transition-all duration-500" style={{ width: i === step ? 18 : 6, opacity: i === step ? 1 : 0.2 }} />
                ))}
              </div>
              <button type="button" className="btn btn-primary w-full !py-[1rem]" onClick={() => (step === 0 ? setStep(1) : setGuide(false))}>
                {step === 0 ? 'Next' : 'Got it'}
              </button>
              {link ? (
                <a href={link} className="py-1 text-center text-[0.9rem] font-semibold text-accent active:opacity-60">
                  Or try opening Chrome automatically
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
