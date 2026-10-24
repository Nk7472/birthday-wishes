/**
 * A template "poster": flat colour, one big emoji and a few satellites looping with
 * transform/opacity only. No sound. Used in the carousel and as the Home examples.
 * Size it from outside; everything inside scales with the card (cqw units).
 */
export default function TemplateCard({ tpl, selected = false, paused = false, showText = true, className = '', ...rest }) {
  const art = tpl.art || { bg: '#E5E5EA', layers: [] };
  const ink = art.dark ? '#fff' : '#1d1d1f';
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[8cqw] ${paused ? 'ca-paused' : ''} ${className}`}
      style={{ background: art.bg, containerType: 'size', boxShadow: selected ? '0 0 0 0.9cqw #0071e3, 0 3cqw 8cqw rgb(0 0 0 / 0.18)' : '0 2cqw 7cqw rgb(0 0 0 / 0.12)' }}
      {...rest}
    >
      {art.layers.map((l, i) => (
        <span
          key={i}
          className={`ca ca-${l.a}`}
          style={{ left: `${l.x}%`, top: `${l.y}%`, fontSize: `${l.s}cqw`, '--d': `${l.d}s`, '--t': `${l.t}s` }}
          aria-hidden="true"
        >
          {l.e}
        </span>
      ))}
      {showText ? (
        <div className="absolute inset-x-0 bottom-0 px-[7cqw] pb-[7cqw] pt-[10cqw]" style={{ color: ink }}>
          <p className="text-[7.4cqw] font-semibold leading-[1.1] tracking-[-0.02em]">{tpl.name}</p>
          <p className="mt-[1.6cqw] line-clamp-2 text-[4.2cqw] leading-[1.25] opacity-70">{tpl.tagline}</p>
        </div>
      ) : null}
      <span
        className={`absolute right-[5cqw] top-[5cqw] grid h-[10cqw] w-[10cqw] place-items-center rounded-full bg-accent text-white transition duration-500 [transition-timing-function:var(--ease-spring)] ${
          selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-[5.4cqw] w-[5.4cqw]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
    </div>
  );
}
