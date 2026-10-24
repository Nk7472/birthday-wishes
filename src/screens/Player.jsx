import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Countdown from '../components/Countdown';
import GiftGate from '../components/GiftGate';
import { Back, Download, Replay, Share } from '../components/Icons';
import TemplateRunner from '../components/TemplateRunner';
import { setMuted, startMusic, stopMusic, unlockAudio } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { enterFullscreen, leaveFullscreen } from '../lib/fullscreen';
import { runPlan } from '../lib/autoplay';
import { watchFrames } from '../lib/quality';
import { normalizeWish } from '../lib/share';
import { getTemplate, preloadTemplate } from '../templates';

/**
 * The full-screen show. No buttons on screen while it plays.
 *   mode "preview"   : sender. countdown -> show -> [Back | Download video | Share]
 *   mode "recipient" : friend opening the link. gift -> show -> [Replay | Make your own]
 * The fullscreen + sound unlock happens in the tap that opened this (see unlockAndEnter).
 */
// Sound can be unlocked by any tap (even before location is known); fullscreen is entered separately, later.
export function unlockSound() {
  unlockAudio();
  setMuted(false);
}

export function unlockAndEnter() {
  unlockSound();
  enterFullscreen();
}

function EndButton({ icon, label, onClick, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center gap-[1.4cqmin] rounded-[5cqmin] px-[2cqmin] py-[3.2cqmin] text-[3.5cqmin] font-semibold transition duration-300 [transition-timing-function:var(--ease-spring)] active:scale-95 ${
        primary ? 'bg-accent text-white' : 'bg-white/[0.12] text-white'
      }`}
    >
      <span className="grid h-[8cqmin] w-[8cqmin] place-items-center">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function Player({ wish: raw, mode = 'preview', onBack, onDownload, onShare, onMakeOwn }) {
  const preview = mode === 'preview';
  const tpl = getTemplate(raw.template);
  const wish = useMemo(() => normalizeWish(raw, { sample: preview }), [raw, preview]);
  const [phase, setPhase] = useState(preview ? 'count' : 'gate');
  const [run, setRun] = useState(0);
  const root = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    preloadTemplate(tpl.id);
  }, [tpl.id]);

  // keep the screen on while it plays
  useEffect(() => {
    let lock;
    navigator.wakeLock?.request?.('screen').then((l) => (lock = l)).catch(() => {});
    return () => lock?.release?.().catch(() => {});
  }, []);

  useEffect(
    () => () => {
      stopMusic();
      confetti.clear();
    },
    [],
  );

  // Leaving fullscreen (swipe / Esc) while playing = skip to the end
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && (phaseRef.current === 'play' || phaseRef.current === 'count')) {
        // a deliberate exit; fullscreenchange also fires on our own enter, which has an element
        setPhase('end');
        stopMusic();
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // the show itself
  useEffect(() => {
    if (phase !== 'play') return undefined;
    startMusic(tpl.music, tpl.tempo, tpl.song);
    const stopWatch = watchFrames();
    const cancelTaps = runPlan(root.current, tpl.video?.taps || []);
    const end = setTimeout(() => {
      stopMusic();
      setPhase('end');
    }, (tpl.video?.seconds || 15) * 1000);
    return () => {
      clearTimeout(end);
      cancelTaps();
      stopWatch?.();
    };
  }, [phase, run, tpl]);

  const replay = useCallback(() => {
    confetti.clear();
    stopMusic();
    setRun((r) => r + 1);
    setPhase('play');
  }, []);

  const openGift = () => {
    enterFullscreen();
    setPhase('play');
  };

  const back = () => {
    stopMusic();
    leaveFullscreen();
    onBack?.();
  };

  return (
    <div ref={root} className="absolute inset-0 z-[60] overflow-hidden bg-black" data-player>
      {phase === 'count' ? <Countdown title={tpl.name} onDone={() => setPhase('play')} /> : null}
      {phase === 'gate' ? <GiftGate wish={wish} onOpen={openGift} /> : null}
      {phase === 'play' || phase === 'end' ? <TemplateRunner key={run} templateId={tpl.id} wish={wish} /> : null}

      {phase === 'end' ? (
        <div className="ui-fade absolute inset-0 z-10 flex items-end bg-gradient-to-t from-black/45 via-transparent to-transparent px-[3.2cqmin] pb-[max(3.4cqmin,env(safe-area-inset-bottom))]" style={{ containerType: 'inline-size' }}>
          <div className="ui-sheet w-full rounded-[7cqmin] bg-[#1c1c1e]/[0.94] p-[2.2cqmin] shadow-[0_3cqmin_9cqmin_rgb(0_0_0/0.5)]">
            <div className="flex gap-[2cqmin]">
              {preview ? (
                <>
                  <EndButton icon={<Back width="100%" height="100%" strokeWidth={2.2} />} label="Back" onClick={back} />
                  <EndButton primary icon={<Download width="82%" height="82%" strokeWidth={2.2} />} label="Download video" onClick={onDownload} />
                  <EndButton icon={<Share width="82%" height="82%" strokeWidth={2.2} />} label="Share" onClick={onShare} />
                </>
              ) : (
                <>
                  <EndButton icon={<Replay width="82%" height="82%" strokeWidth={2.2} />} label="Replay" onClick={replay} />
                  <EndButton primary icon={<span className="text-[6cqmin]">🎁</span>} label="Make your own" onClick={onMakeOwn} />
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
