import { useEffect } from 'react';
import { signOut } from '../lib/auth';

export const initialOf = (u) => (u?.name || u?.email || '?').trim().charAt(0).toUpperCase();

export default function Profile({ user, onClose, onGallery }) {
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const since = user.created ? new Date(user.created).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '';
  return (
    <div className="ui-fade absolute inset-0 z-[110] flex items-end bg-black/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Your profile" onClick={(e) => e.stopPropagation()}
        className="ui-sheet w-full rounded-t-[1.9rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[var(--shadow-lift)]">
        <div className="mx-auto h-[5px] w-9 rounded-full bg-black/15" />
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#5ac8fa] to-[#0071e3] text-[2rem] font-bold text-white shadow-[0_8px_20px_rgb(0_113_227/0.3)]">{initialOf(user)}</span>
          <h2 className="mt-3 text-[1.3rem] font-bold tracking-[-0.02em]">{user.name}</h2>
          <p className="text-[0.92rem] text-mute">{user.email}</p>
          {user.phone ? <p className="text-[0.92rem] text-mute">{user.phone}</p> : null}
          {since ? <p className="mt-1 text-[0.8rem] text-mute/80">Member since {since}</p> : null}
        </div>
        <button type="button" className="btn btn-primary mt-6 w-full" onClick={onGallery}>Gallery</button>
        <button type="button" className="btn btn-quiet mt-2 w-full !text-[#d70015]" onClick={() => { signOut(); onClose(); }}>Sign out</button>
        <button type="button" className="btn mt-2 w-full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
