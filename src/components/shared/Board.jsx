/**
 * A fixed-aspect "page" centred inside the Stage. Inside it, `cqw` / `cqh`
 * refer to the board itself, so a layout designed on a phone-shaped canvas
 * (positions in %, sizes in cqw) looks the same on every screen. The Stage
 * background stays full-bleed behind it.
 */
export default function Board({ ratio = 9 / 18.5, className = '', style, children }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={`relative ${className}`}
        style={{ aspectRatio: ratio, height: '100%', maxWidth: '100%', containerType: 'size', ...style }}
      >
        {children}
      </div>
    </div>
  );
}
