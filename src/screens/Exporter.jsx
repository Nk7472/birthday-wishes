import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Share } from '../components/Icons';
import TemplateRunner from '../components/TemplateRunner';
import { enterFullscreen } from '../lib/fullscreen';
import { normalizeWish } from '../lib/share';
import { canExport, encode, film } from '../lib/videoExport';
import { real, uninstallClock } from '../lib/vclock';
import { getTemplate } from '../templates';
import { saveWish } from '../lib/sync';
import { pauseOutbox } from '../lib/outbox';
import { track } from '../lib/track';

const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const left = (ms) => {
  const s = Math.max(1, Math.round(ms / 1000));
  return s >= 90 ? `About ${Math.round(s / 60)} min left` : s >= 10 ? `About ${Math.round(s / 5) * 5} sec left` : 'Almost there';
};

/**
 * "Making your video". The scene plays full screen underneath a blur layer while we film it on a virtual clock
 * (see lib/videoExport.js). The blur layer shows the latest frame, blurred; the card shows live progress, time
 * left and a ticking timer so it is always obvious that work is happening.
 */
export default function Exporter({ wish: raw, onClose }) {
  const tpl = getTemplate(raw.template);
  const wish = useMemo(() => normalizeWish(raw, { sample: true }), [raw]);
  const root = useRef(null);
  const peek = useRef(null);
  const token = useRef({ cancel: false });
  const previous = useRef(Promise.resolve());
  const shareRef = useRef(0.75);
  const lastMove = useRef(0);
  const best = useRef(0);
  const started = useRef(0);
  const [attempt, setAttempt] = useState({ n: 0, profile: 'auto' });
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState(canExport() ? 'film' : 'unsupported'); // film | encode | done | error | unsupported
  const [stage, setStage] = useState('Getting ready');
  const [pct, setPct] = useState(0);
  const [eta, setEta] = useState(0);
  const [detail, setDetail] = useState('');
  const [clock, setClock] = useState(0);
  const [stall, setStall] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const url = useMemo(() => (result ? URL.createObjectURL(result.blob) : ''), [result]);

  useEffect(() => {
    enterFullscreen();
    return () => {
      token.current.cancel = true;
      uninstallClock(); // never leave the page on a frozen clock
    };
  }, []);

  // a ticking timer and a stall detector, on REAL timers (the scene's are virtual while filming)
  useEffect(() => {
    started.current = real.perfNow();
    lastMove.current = started.current;
    const id = real.setInterval(() => {
      const now = real.perfNow();
      setClock(now - started.current);
      setStall((now - lastMove.current) / 1000);
    }, 500);
    return () => real.clearInterval(id);
  }, [attempt]);

  useEffect(() => {
    if (phase === 'unsupported') return undefined;
    const mine = { cancel: false };
    token.current = mine;
    const stop = () => mine.cancel;
    const show = (p) => {
      if (p > best.current) {
        best.current = p;
        lastMove.current = real.perfNow();
        setPct(p);
      }
    };
    const run = async () => {
      await previous.current; // a restart waits for the old run to release the clock
      if (stop()) return;
      try {
        track('export_start', { template: tpl.id, profile: attempt.profile });
        setMounted(false);
        best.current = 0;
        setPct(0);
        setPhase('film');
        setStage('Getting ready');
        await tpl.loader(); // download the scene's code before the clock starts
        await new Promise((r) => real.setTimeout(r, 60));
        if (stop()) return;
        const text = [wish.name, wish.message, wish.from, wish.ageText, ...wish.wishes, 'Happy Birthday I love you Thank you'].join(' ');
        const out = await film({
          root: root.current,
          tpl,
          text,
          profile: attempt.profile,
          mountScene: () => setMounted(true),
          onStage: (s) => !stop() && setStage(s),
          onProgress: (p, info) => {
            if (stop()) return;
            shareRef.current = info.share;
            show(p * info.share);
            setEta(info.etaMs + info.total);
            setDetail(`${(info.v / 1000).toFixed(1)}s of ${(info.total / 1000).toFixed(1)}s · ${info.fps} fps`);
          },
          onPreview: (c) => {
            const pk = peek.current;
            if (pk && !stop()) pk.getContext('2d').drawImage(c, 0, 0, pk.width, pk.height);
          },
          shouldStop: stop,
        });
        if (stop()) return;
        setMounted(false);
        setPhase('encode');
        setStage('Adding the music');
        const file = await encode({
          ...out,
          onProgress: (q) => {
            if (stop()) return;
            show(shareRef.current + q * (1 - shareRef.current));
            setEta((1 - q) * out.ms);
            setDetail(`${Math.round(q * 100)}%`);
          },
          shouldStop: stop,
        });
        if (stop()) return;
        setResult(file);
        track('export_done', { template: tpl.id, seconds: Math.round((real.perfNow() - started.current) / 1000), ext: file.ext });
        saveWish(raw, 'export');
        setPct(1);
        setPhase('done');
      } catch (e) {
        if (stop() || e?.message === 'cancelled') return;
        console.error(e);
        track('export_error', { template: tpl.id, msg: String(e?.message || '').slice(0, 100) });
        setError(e?.message || 'Something went wrong while making the video.');
        setPhase('error');
      }
    };
    const resumeOutbox = pauseOutbox(); // keep the network and CPU free while the video is made
    const p = run();
    p.then(resumeOutbox, resumeOutbox);
    previous.current = p.catch(() => {});
    return () => {
      mine.cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  const close = () => {
    token.current.cancel = true;
    uninstallClock();
    onClose();
  };
  const retryFast = () => {
    token.current.cancel = true;
    setStall(0);
    setAttempt((a) => ({ n: a.n + 1, profile: 'fast' }));
  };
  // a fresh name for every download, so Chrome never asks "download this file again?"
  const saves = useRef(0);
  const makeName = (n) => {
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
    const who = wish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wish';
    return `wishbox-${who}-${stamp}${n > 1 ? `-${n}` : ''}.${result?.ext || 'mp4'}`;
  };
  const nextName = () => makeName((saves.current += 1));
  const fileName = result ? makeName(1) : '';
  const share = async () => {
    try {
      const file = new File([result.blob], nextName(), { type: result.blob.type });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Wishbox video' });
    } catch (e) {
      /* cancelled */
    }
  };
  const canShareFile = typeof File !== 'undefined' && !!navigator.canShare && phase === 'done';
  const percent = Math.min(99, Math.floor(pct * 100));

  return (
    <div className="absolute inset-0 z-[100] overflow-hidden bg-black">
      {/* the scene being filmed (hidden under the cover) */}
      <div ref={root} className="absolute inset-0" aria-hidden="true">
        {mounted ? <TemplateRunner key={attempt.n} templateId={tpl.id} wish={wish} /> : null}
      </div>

      {/* blur cover */}
      {phase !== 'done' ? (
        <div className="absolute inset-0 z-10 bg-[#111]" style={{ containerType: 'inline-size' }}>
          <canvas ref={peek} width="90" height="195" className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'blur(14px) brightness(0.62) saturate(1.25)', transform: 'scale(1.2)' }} />
          <div className="absolute inset-0 grid place-items-center px-[6cqw]">
            <div className="ui-pop w-full rounded-[7cqw] bg-[#2c2c2e]/[0.92] p-[6cqw] text-center text-white shadow-[0_4cqw_12cqw_rgb(0_0_0/0.5)]">
              {phase === 'error' || phase === 'unsupported' ? (
                <>
                  <p className="text-[5.6cqw] font-semibold">{phase === 'unsupported' ? 'Video is not available here' : 'Could not make the video'}</p>
                  <p className="mt-[2cqw] text-[3.8cqw] leading-snug text-white/70">
                    {phase === 'unsupported' ? 'Open Wishbox in a recent version of Chrome to download a video.' : error}
                  </p>
                  {phase === 'error' ? (
                    <button type="button" onClick={retryFast} className="btn btn-primary mt-[5cqw] w-full">Try again in fast mode</button>
                  ) : null}
                  <button type="button" onClick={close} className="btn mt-[2.4cqw] w-full !bg-white/12 !text-white">Close</button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-[2cqw]">
                    <span className="flex gap-[1.1cqw]" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="block h-[1.7cqw] w-[1.7cqw] rounded-full bg-[#30d158]" style={{ animation: `dotPulse 1.1s ease-in-out ${i * 0.16}s infinite` }} />
                      ))}
                    </span>
                    <p className="text-[5.6cqw] font-semibold tracking-[-0.02em]">Making your video</p>
                  </div>
                  <p className="mt-[1.8cqw] text-[3.6cqw] text-white/70">{stage}{detail && (phase === 'film' || phase === 'encode') && stage !== 'Getting ready' ? ` · ${detail}` : ''}</p>

                  <p className="mt-[5cqw] text-[13cqw] font-bold leading-none tracking-[-0.04em] tabular-nums">{percent}<span className="text-[6cqw] font-semibold text-white/60">%</span></p>
                  <div className="mt-[4.4cqw] h-[2cqw] w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="relative h-full w-full origin-left overflow-hidden rounded-full bg-white" style={{ transform: `scaleX(${Math.max(0.03, pct)})`, transition: 'transform .35s linear' }}>
                      <span className="absolute inset-y-0 left-0 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgb(10 132 255 / 0.55), transparent)', animation: 'sheen 1.2s linear infinite' }} />
                    </div>
                  </div>
                  <div className="mt-[3cqw] flex justify-between text-[3.4cqw] tabular-nums text-white/65">
                    <span>{fmt(clock)} elapsed</span>
                    <span>{pct > 0.03 && eta > 0 ? left(eta) : 'Estimating…'}</span>
                  </div>

                  {stall > 12 ? (
                    <p className="mt-[3.4cqw] text-[3.4cqw] leading-snug text-white/75">
                      {stall > 30 ? 'This phone is slow with this scene.' : 'A heavy part of the scene, hang on…'}
                    </p>
                  ) : (
                    <p className="mt-[3.4cqw] text-[3.4cqw] text-white/50">Keep this screen open</p>
                  )}
                  {stall > 30 ? <button type="button" onClick={retryFast} className="btn btn-primary mt-[3cqw] w-full">Switch to fast mode</button> : null}
                  <button type="button" onClick={close} className="btn mt-[3cqw] w-full !bg-white/12 !text-white">Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="ui-fade absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#111] px-[6cqw] text-white" style={{ containerType: 'inline-size' }}>
          <p className="mb-[3cqw] flex items-center gap-[2cqw] text-[5.4cqw] font-semibold"><span className="grid h-[7cqw] w-[7cqw] place-items-center rounded-full bg-[#30d158]"><Check width="60%" height="60%" strokeWidth={3.4} /></span>Your video is ready</p>
          <video src={url} controls playsInline loop autoPlay className="max-h-[62%] rounded-[5cqw] bg-black" style={{ aspectRatio: '9 / 19' }} />
          <div className="mt-[5cqw] flex w-full gap-[2.4cqw]">
            <a href={url} download={fileName} onClick={(e) => { e.currentTarget.download = nextName(); }} className="btn btn-primary flex-1"><Download width={18} height={18} /> Save</a>
            {canShareFile ? <button type="button" onClick={share} className="btn flex-1 !bg-white/15 !text-white"><Share width={18} height={18} /> Share</button> : null}
          </div>
          <button type="button" onClick={close} className="mt-[3cqw] text-[3.8cqw] font-semibold text-white/70 active:opacity-60">Done</button>
        </div>
      )}
    </div>
  );
}
