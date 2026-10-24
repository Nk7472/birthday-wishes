import { useMemo, useRef, useState } from 'react';
import { BRAND } from '../config';
import { Check, Copy, Share, WhatsApp } from '../components/Icons';
import { buildLink, kindOf } from '../lib/share';

export const shareText = (draft) => {
  const kind = kindOf(draft.template);
  const name = draft.name.trim();
  if (kind === 'love') return `Something I made for you, ${name || 'love'} ❤️`;
  if (kind === 'thanks') return `A thank you for ${name || 'you'} 💛`;
  return `A birthday surprise for ${name || 'you'} 🎁`;
};

/** Try the phone's own share sheet first. Resolves false when it isn't available. */
export async function nativeShare(draft) {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: `${BRAND} wish`, text: shareText(draft), url: buildLink(draft) });
  } catch (e) {
    /* cancelled: still counts as handled */
  }
  return true;
}

export default function ShareSheet({ draft, onClose }) {
  const link = useMemo(() => buildLink(draft), [draft]);
  const [copied, setCopied] = useState(false);
  const input = useRef(null);
  const text = shareText(draft);
  const canNative = typeof navigator !== 'undefined' && !!navigator.share;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      input.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const Action = ({ children, label, onClick, href }) => {
    const cls = 'flex flex-1 flex-col items-center gap-2 text-[0.78rem] font-medium text-ink active:opacity-60';
    const icon = <span className="grid h-14 w-14 place-items-center rounded-full bg-canvas text-ink">{children}</span>;
    return href ? (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>{icon}{label}</a>
    ) : (
      <button type="button" onClick={onClick} className={cls}>{icon}{label}</button>
    );
  };

  return (
    <div className="ui-fade absolute inset-0 z-[90] flex items-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        className="ui-sheet w-full rounded-t-[1.9rem] bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[var(--shadow-lift)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-[5px] w-9 rounded-full bg-black/15" />
        <h2 className="mt-4 text-center text-[1.15rem] font-semibold tracking-[-0.015em]">Share your wish</h2>
        <p className="mt-0.5 text-center text-[0.85rem] text-mute">They tap the link and the gift opens.</p>

        <input ref={input} readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Shareable link" className="field mt-4 truncate !py-3 !text-[0.85rem]" />

        <div className="mt-5 flex gap-2">
          <Action label={copied ? 'Copied' : 'Copy link'} onClick={copy}>{copied ? <Check width={22} height={22} /> : <Copy width={22} height={22} />}</Action>
          <Action label="WhatsApp" href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`}><WhatsApp width={24} height={24} /></Action>
          {canNative ? <Action label="More" onClick={() => nativeShare(draft)}><Share width={22} height={22} /></Action> : null}
        </div>

        {link.length > 6000 ? (
          <p className="mt-4 text-xs leading-relaxed text-mute">This link is long because it carries the photo. If a chat app cuts it off, remove the photo or shorten the message.</p>
        ) : null}
        <button type="button" onClick={onClose} className="btn btn-quiet mt-5 w-full">Done</button>
      </div>
    </div>
  );
}
