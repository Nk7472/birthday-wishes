import { useId } from 'react';

/**
 * Glossy SVG balloon. Scales to its container width (give it w-full or a width).
 * label: a letter/short text printed on the balloon.
 */
export default function Balloon({
  color = '#ff4d8d',
  label,
  labelColor = '#fff',
  string = true,
  stringColor = 'rgba(255,255,255,0.7)',
  className = '',
  style,
  onClick,
}) {
  const id = useId().replace(/:/g, '');
  const light = `color-mix(in srgb, ${color} 52%, white)`;
  const dark = `color-mix(in srgb, ${color} 72%, black)`;
  return (
    <svg
      viewBox={`0 0 100 ${string ? 160 : 122}`}
      className={className}
      style={{ overflow: 'visible', ...style }}
      onClick={onClick}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-g`} cx="34%" cy="28%" r="80%">
          <stop offset="0%" style={{ stopColor: light }} />
          <stop offset="55%" style={{ stopColor: color }} />
          <stop offset="100%" style={{ stopColor: dark }} />
        </radialGradient>
      </defs>
      {string ? (
        <path d="M50 120 C 40 134, 60 146, 50 160" fill="none" stroke={stringColor} strokeWidth="1.3" />
      ) : null}
      <path
        d="M50 2 C 17 2, 3 31, 8 57 C 13 84, 37 106, 50 112 C 63 106, 87 84, 92 57 C 97 31, 83 2, 50 2 Z"
        fill={`url(#${id}-g)`}
      />
      <path d="M50 109 L43.5 121 Q50 117 56.5 121 Z" style={{ fill: dark }} />
      <ellipse cx="31" cy="31" rx="8" ry="15" transform="rotate(-28 31 31)" fill="#fff" opacity="0.45" />
      <ellipse cx="22" cy="55" rx="2.6" ry="4" fill="#fff" opacity="0.35" />
      {label ? (
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fontSize="44"
          fontWeight="800"
          fill={labelColor}
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}
