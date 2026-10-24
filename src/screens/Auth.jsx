import { useEffect, useMemo, useRef, useState } from 'react';
import Captcha, { Seal } from '../components/Captcha';
import { Close } from '../components/Icons';
import { BRAND } from '../config';
import { AuthError, COUNTRIES, cleanPhone, signIn, signUp, validEmail } from '../lib/auth';
import { track } from '../lib/track';

const EMPTY = { name: '', password: '', dial: '+91', phone: '', email: '' };

const rules = {
  name: (f) => (f.name.trim().length < 2 ? 'Please enter your name.' : ''),
  password: (f) => (f.password.length < 6 ? 'Use at least 6 characters.' : ''),
  phone: (f) => (cleanPhone(f.dial, f.phone) ? '' : f.dial === '+91' ? 'Enter a 10-digit mobile number.' : 'Enter a valid phone number.'),
  email: (f) => (validEmail(f.email.trim().toLowerCase()) ? '' : 'Enter a valid email, like name@example.com.'),
};
const STEP_FIELDS = [['name', 'password'], ['phone', 'email']];

/** Bottom sheet: create a profile (2 short steps) or log in. Calls onDone(user) on success. */
export default function Auth({ reason, onClose, onDone }) {
  const [mode, setMode] = useState('up'); // up | in
  const [stage, setStage] = useState('verify'); // verify (I'm not a robot) | form
  const [captcha, setCaptcha] = useState(''); // the signed ticket the server gave us
  const [step, setStep] = useState(0); // 0: name + password, 1: phone + email
  const [f, setF] = useState(EMPTY);
  const [seen, setSeen] = useState({}); // fields to show errors for
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sheet = useRef(null);
  const up = mode === 'up';

  const errs = useMemo(() => Object.fromEntries(Object.keys(rules).map((k) => [k, rules[k](f)])), [f]);
  const done = Object.values(errs).filter((e) => !e).length; // fields that are filled in correctly (of 4)
  const progress = 0.2 + 0.8 * (done / 4);

  useEffect(() => {
    const el = sheet.current?.querySelector('[data-first]');
    el?.focus({ preventScroll: true });
  }, [mode, step, stage]);

  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const set = (k) => (e) => {
    setError('');
    setF((s) => ({ ...s, [k]: e.target.value }));
  };
  const blur = (k) => () => f[k] && setSeen((s) => ({ ...s, [k]: true }));
  const show = (k) => (seen[k] && errs[k] ? errs[k] : '');
  const cls = (k) => `field${show(k) ? ' bad' : ''}`;

  const check = (keys) => {
    const bad = keys.filter((k) => errs[k]);
    setSeen((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, true])) }));
    if (bad.length) sheet.current?.querySelector(`[name="${bad[0]}"]`)?.focus();
    return !bad.length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (up && stage === 'verify') {
      if (captcha) {
        track('captcha_next');
        setStage('form');
        setStep(0);
      }
      return;
    }
    if (!up) {
      setSeen((s) => ({ ...s, email: true, password: true }));
      if (!validEmail(f.email.trim().toLowerCase())) return sheet.current?.querySelector('[name="email"]')?.focus();
      if (!f.password) return sheet.current?.querySelector('[name="password"]')?.focus();
    } else if (step === 0) {
      if (check(STEP_FIELDS[0])) {
        track('signup_step1_done');
        setStep(1);
      }
      return;
    } else if (!check([...STEP_FIELDS[0], ...STEP_FIELDS[1]])) {
      // something from step 1 went missing: go back to it
      if (STEP_FIELDS[0].some((k) => errs[k])) setStep(0);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const u = await (up ? signUp({ ...f, captcha }) : signIn(f));
      track(up ? 'signup_done' : 'login_done');
      onDone(u);
    } catch (err) {
      track(up ? 'signup_failed' : 'login_failed', { status: err?.message?.slice(0, 40) });
      if (err instanceof AuthError && err.code === 'captcha') {
        setCaptcha('');
        setStage('verify');
      }
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setStage('verify');
    setStep(0);
    setError('');
    setSeen({});
  };

  const Err = ({ k }) => (show(k) ? <p className="fielderr" role="alert">{show(k)}</p> : null);

  return (
    <div className="ui-fade absolute inset-0 z-[110] flex items-end bg-black/40" onClick={onClose}>
      <form
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={up ? 'Create profile' : 'Log in'}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="ui-sheet relative max-h-full w-full overflow-y-auto rounded-t-[1.9rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[var(--shadow-lift)]"
        noValidate
      >
        <div className="mx-auto h-[5px] w-9 rounded-full bg-black/15" />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/[0.06] text-mute active:opacity-60">
          <Close width={15} height={15} strokeWidth={2.6} />
        </button>

        {up && stage === 'verify' ? (
          <div className="mt-4 pr-8">
            {captcha ? (
              <div className="ui-pop flex items-center gap-2.5">
                <Seal className="h-[2.6rem] w-[2.6rem] shrink-0" />
                <h2 className="text-[1.6rem] font-bold leading-[1.05] tracking-[-0.035em] text-accent">Verified by Wishbox</h2>
              </div>
            ) : (
              <h2 className="text-[1.7rem] font-bold leading-[1.08] tracking-[-0.035em]">Quick check first</h2>
            )}
            <p className="mt-2 text-[0.95rem] leading-snug text-mute">
              {captcha ? 'Thank you! Tap Next to create your profile.' : 'Tick the box so we know you are a real person. It takes a few seconds.'}
            </p>
          </div>
        ) : up ? (
          <div className="mt-4 pr-8">
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.88rem] font-semibold text-accent">
              <Seal className="h-[1.15rem] w-[1.15rem]" /> Verified by Wishbox
            </p>
            <h2 className="text-[1.7rem] font-bold leading-[1.08] tracking-[-0.035em]">Your profile is almost complete</h2>
            <div className="mt-3 h-[0.55rem] w-full overflow-hidden rounded-full bg-black/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Profile completion">
              <div className="relative h-full origin-left overflow-hidden rounded-full bg-accent" style={{ width: '100%', transform: `scaleX(${progress})`, transition: 'transform .45s var(--ease-out)' }}>
                <span className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent)', animation: 'sheen 1.4s linear infinite' }} />
              </div>
            </div>
            <p className="mt-2 text-[0.9rem] font-medium text-mute">
              Step {step + 1} of 2 · {step === 0 ? 'About you' : 'How to reach you'}
            </p>
          </div>
        ) : (
          <>
            <h2 className="mt-4 text-center text-[1.35rem] font-bold tracking-[-0.025em]">Welcome back</h2>
            <p className="mx-auto mt-1 max-w-[18rem] text-center text-[0.88rem] leading-snug text-mute">{reason || `Log in to ${BRAND} to download your videos.`}</p>
          </>
        )}

        {step === 0 && (!up || stage === 'verify') ? (
          <div className="mt-4 flex justify-center">
            <div className="seg" role="tablist">
              <button type="button" role="tab" aria-selected={up} className={up ? 'on' : ''} onClick={() => switchMode('up')}>Sign up</button>
              <button type="button" role="tab" aria-selected={!up} className={!up ? 'on' : ''} onClick={() => switchMode('in')}>Log in</button>
            </div>
          </div>
        ) : null}
        {up && stage === 'form' && step === 0 && reason ? <p className="mt-3 text-center text-[0.85rem] leading-snug text-mute">{reason}</p> : null}

        <div className="mt-4 space-y-3">
          {up && stage === 'verify' ? <Captcha passed={!!captcha} onPass={(t) => { setCaptcha(t); setError(''); }} /> : null}

          {up && stage === 'form' && step === 0 ? (
            <>
              <div>
                <input data-first name="name" className={cls('name')} placeholder="Your name" autoComplete="name" value={f.name} onChange={set('name')} onBlur={blur('name')} maxLength={40} />
                <Err k="name" />
              </div>
              <div>
                <div className="relative">
                  <input name="password" className={`${cls('password')} !pr-16`} type={showPw ? 'text' : 'password'} placeholder="Password (6+ characters)" autoComplete="new-password" value={f.password} onChange={set('password')} onBlur={blur('password')} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 px-1 text-[0.82rem] font-semibold text-accent active:opacity-60">{showPw ? 'Hide' : 'Show'}</button>
                </div>
                <Err k="password" />
              </div>
            </>
          ) : null}

          {up && stage === 'form' && step === 1 ? (
            <>
              <div>
                <div className="flex gap-2">
                  <select aria-label="Country code" className="field !w-[6.4rem] shrink-0 !px-3" value={f.dial} onChange={set('dial')}>
                    {COUNTRIES.map(([d, n]) => (
                      <option key={d} value={d}>{d} {n}</option>
                    ))}
                  </select>
                  <input data-first name="phone" className={cls('phone')} type="tel" inputMode="tel" placeholder="Phone number" autoComplete="tel-national" value={f.phone} onChange={set('phone')} onBlur={blur('phone')} />
                </div>
                <Err k="phone" />
              </div>
              <div>
                <input name="email" className={cls('email')} type="email" inputMode="email" placeholder="Email ID" autoComplete="email" autoCapitalize="none" value={f.email} onChange={set('email')} onBlur={blur('email')} />
                <Err k="email" />
              </div>
            </>
          ) : null}

          {!up ? (
            <>
              <div>
                <input data-first name="email" className={cls('email')} type="email" inputMode="email" placeholder="Email ID" autoComplete="email" autoCapitalize="none" value={f.email} onChange={set('email')} onBlur={blur('email')} />
                <Err k="email" />
              </div>
              <div>
                <input name="password" className="field" type="password" placeholder="Password" autoComplete="current-password" value={f.password} onChange={set('password')} />
              </div>
            </>
          ) : null}
        </div>

        <p className="mt-2.5 min-h-[1.2rem] text-center text-[0.85rem] font-medium text-[#d70015]" role="alert">{error}</p>

        <button type="submit" disabled={busy || (up && stage === 'verify' && !captcha)} className="btn btn-primary mt-1 w-full !py-[1rem] !text-[1.02rem]">
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : !up ? 'Log in' : stage === 'verify' ? 'Next' : step === 0 ? 'Continue' : 'Create profile'}
        </button>
        {up && stage === 'form' && step === 1 ? (
          <button type="button" onClick={() => { setStep(0); setError(''); }} className="btn btn-quiet mt-2 w-full">Back</button>
        ) : (
          <p className="mt-3 text-center text-[0.85rem] text-mute">
            {up ? 'Already have a profile?' : 'New here?'}{' '}
            <button type="button" className="font-semibold text-accent active:opacity-60" onClick={() => switchMode(up ? 'in' : 'up')}>
              {up ? 'Log in' : 'Create one'}
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
