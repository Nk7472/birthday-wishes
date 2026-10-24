import { useId } from 'react';

/**
 * The shared flat, 2D teddy bear. Solid fills + one soft outline, no gradients,
 * so it reads as a clean cartoon sticker (and is cheap to animate).
 *
 * Every part is its own group so scenes can animate them separately:
 *   m = { head, headFx, armL, armR, legL, legR }  -> inline style objects
 *   bodyAnim                                       -> style for the whole body
 *   face: happy | open | surprised | cross | dizzy | kiss | yum | scrunch | sad
 *   hat:  'none' | 'on' | 'fly'      icing: show frosting on the head
 */
export const FUR = '#dd9f5f';
export const FUR_DARK = '#b97d3f';
export const LIGHT = '#f9e6c6';
export const INK = '#3a2314';
export const LINE = '#7d4d24';
const EAR = '#f2b98f';
const BLUSH = '#ff9aa8';
const PALETTE = ['#ff5d8f', '#ffb300', '#26c6a6', '#5c7cfa', '#ff7a45', '#b259e6'];
const OUT = { stroke: LINE, strokeWidth: 3.2, strokeLinejoin: 'round' };

function Eyes({ face }) {
  const bead = (cx) => (
    <g key={cx}>
      <ellipse cx={cx} cy="52" rx="6.4" ry="7.6" fill={INK} />
      <circle cx={cx - 2} cy="49" r="2.3" fill="#fff" />
    </g>
  );
  switch (face) {
    case 'surprised':
      return (
        <g>
          {[78, 122].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="52" r="11" fill="#fff" stroke={INK} strokeWidth="2.4" />
              <circle cx={cx} cy="52" r="4.6" fill={INK} />
            </g>
          ))}
          <path d="M64 36 Q78 28 90 36 M110 36 Q122 28 136 36" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'cross':
      return (
        <g>
          {[78, 122].map((cx, i) => (
            <g key={cx}>
              <circle cx={cx} cy="52" r="11" fill="#fff" stroke={INK} strokeWidth="2.4" />
              <circle cx={cx + (i ? -4.6 : 4.6)} cy="55" r="4.6" fill={INK} />
            </g>
          ))}
        </g>
      );
    case 'dizzy':
      return (
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          {[78, 122].map((cx) => (
            <path key={cx} transform={`translate(${cx} 52)`} d="M0 0 a3 3 0 1 1 3 3 a6 6 0 1 1 -6 -6 a9 9 0 1 1 9 9" />
          ))}
        </g>
      );
    case 'kiss':
    case 'yum':
      return (
        <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
          <path d="M69 56 Q78 44 87 56" />
          <path d="M113 56 Q122 44 131 56" />
        </g>
      );
    case 'scrunch':
      return (
        <g fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M68 44 L88 52 L68 60" />
          <path d="M132 44 L112 52 L132 60" />
        </g>
      );
    case 'sad':
      return (
        <g>
          {[78, 122].map(bead)}
          <path d="M66 40 Q78 34 88 42 M112 42 Q122 34 134 40" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 66 Q66 76 72 80 Q78 76 74 66 Z" fill="#7cc8ff" />
        </g>
      );
    default:
      return <g>{[78, 122].map(bead)}</g>;
  }
}

function Mouth({ face }) {
  switch (face) {
    case 'open':
      return (
        <g>
          <path d="M100 77 V80" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M84 84 Q100 108 116 84 Q100 92 84 84 Z" fill="#6b1d1d" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <ellipse cx="100" cy="97" rx="8" ry="4.4" fill="#ff7b8e" />
        </g>
      );
    case 'yum':
      return (
        <g>
          <path d="M84 84 Q100 106 116 84 Q100 92 84 84 Z" fill="#6b1d1d" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <g style={{ animation: 'tedTongue 0.45s ease-in-out infinite' }}>
            <ellipse cx="100" cy="97" rx="9" ry="6" fill="#ff7b8e" />
          </g>
        </g>
      );
    case 'surprised':
      return <ellipse cx="100" cy="90" rx="6.4" ry="9" fill="#5a1f1f" stroke={INK} strokeWidth="2.4" />;
    case 'scrunch':
      return <path d="M88 90 Q100 80 112 90 Q100 98 88 90 Z" fill="#5a1f1f" stroke={INK} strokeWidth="2.2" />;
    case 'kiss':
      return <ellipse cx="100" cy="88" rx="4.4" ry="5.6" fill="#ff8fa3" stroke={INK} strokeWidth="2.2" />;
    case 'dizzy':
      return <path d="M84 88 q8 -7 16 0 t16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'cross':
      return <path d="M86 86 Q93 96 100 88 Q107 96 114 86" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'sad':
      return <path d="M86 94 Q100 80 114 94" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M100 77 V84 M100 84 Q92 93 83 86 M100 84 Q108 93 117 86" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
}

export default function Teddy({ face = 'happy', hat = 'none', icing = false, m = {}, bodyAnim, shadow = true, className = 'block w-full overflow-visible' }) {
  const uid = useId().replace(/:/g, '');
  const hatClip = `tedHatClip${uid}`;
  const mm = { head: {}, headFx: {}, armL: {}, armR: {}, legL: {}, legR: {}, ...m };
  return (
    <svg viewBox="0 -56 200 300" className={className} aria-hidden="true">
      <defs>
        <clipPath id={hatClip}>
          <path d="M72 24 Q100 30 128 24 L102 -36 Q100 -38 98 -36 Z" />
        </clipPath>
      </defs>

      {shadow ? <ellipse cx="100" cy="240" rx="70" ry="8" fill="#1d1d1f" opacity="0.12" /> : null}

      <g style={bodyAnim}>
        {/* legs */}
        <g style={{ transformOrigin: '70px 190px', ...mm.legL }}>
          <ellipse cx="66" cy="214" rx="29" ry="27" fill={FUR} {...OUT} />
          <ellipse cx="66" cy="222" rx="16" ry="11" fill={LIGHT} />
        </g>
        <g style={{ transformOrigin: '130px 190px', ...mm.legR }}>
          <ellipse cx="134" cy="214" rx="29" ry="27" fill={FUR} {...OUT} />
          <ellipse cx="134" cy="222" rx="16" ry="11" fill={LIGHT} />
        </g>

        {/* torso */}
        <ellipse cx="100" cy="156" rx="56" ry="64" fill={FUR} {...OUT} />
        <ellipse cx="100" cy="168" rx="34" ry="40" fill={LIGHT} />

        {/* arms */}
        <g style={{ transformOrigin: '50px 124px', ...mm.armL }}>
          <g transform="rotate(14 36 152)">
            <ellipse cx="36" cy="152" rx="18" ry="38" fill={FUR} {...OUT} />
            <ellipse cx="34" cy="183" rx="9" ry="7" fill={LIGHT} />
          </g>
        </g>
        <g style={{ transformOrigin: '150px 124px', ...mm.armR }}>
          <g transform="rotate(-14 164 152)">
            <ellipse cx="164" cy="152" rx="18" ry="38" fill={FUR} {...OUT} />
            <ellipse cx="166" cy="183" rx="9" ry="7" fill={LIGHT} />
          </g>
        </g>

        {/* head */}
        <g style={{ transformOrigin: '100px 100px', ...mm.head }}>
          <g style={mm.headFx}>
            <circle cx="56" cy="22" r="21" fill={FUR} {...OUT} />
            <circle cx="56" cy="24" r="11" fill={EAR} />
            <circle cx="144" cy="22" r="21" fill={FUR} {...OUT} />
            <circle cx="144" cy="24" r="11" fill={EAR} />
            <circle cx="100" cy="58" r="50" fill={FUR} {...OUT} />
            <ellipse cx="78" cy="30" rx="14" ry="7" fill="#fff" opacity="0.2" transform="rotate(-25 78 30)" />
            <circle cx="62" cy="76" r="9" fill={BLUSH} opacity="0.55" />
            <circle cx="138" cy="76" r="9" fill={BLUSH} opacity="0.55" />
            <ellipse cx="100" cy="78" rx="26" ry="20" fill={LIGHT} />
            <path d="M89 65 Q100 58 111 65 Q109 75 100 78 Q91 75 89 65 Z" fill={INK} />
            <ellipse cx="96" cy="64" rx="3.2" ry="1.6" fill="#fff" opacity="0.6" />
            <g style={{ transformOrigin: '100px 52px', animation: 'tedBlink 4.2s infinite' }}>
              <Eyes face={face} />
            </g>
            <Mouth face={face} />

            {icing ? (
              <g style={{ transformOrigin: '100px 72px', animation: 'tedPop 0.45s ease-out both' }}>
                {[[100, 78, 25], [72, 78, 13], [128, 78, 13], [100, 66, 10], [86, 94, 11], [114, 94, 11], [100, 32, 13], [62, 58, 8], [138, 58, 8]].map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill="#fff7fb" stroke="#ffd0e2" strokeWidth="1.2" />
                ))}
                <path d="M92 94 q0 16 5 16 q5 0 5 -16 M108 96 q0 12 4 12 q4 0 4 -12" fill="#fff7fb" stroke="#ffd0e2" strokeWidth="1.2" />
                {[[84, 74], [118, 72], [100, 88], [96, 30], [70, 80], [130, 84]].map(([x, y], i) => (
                  <rect key={i} x={x} y={y} width="6" height="2.4" rx="1.2" fill={PALETTE[i % 6]} transform={`rotate(${i * 40} ${x} ${y})`} />
                ))}
                <circle cx="100" cy="20" r="7" fill="#e8344d" />
                <path d="M100 14 Q104 6 110 6" stroke="#2a8f4a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              </g>
            ) : null}

            {hat !== 'none' ? (
              <g style={{ transformOrigin: '100px 24px', animation: hat === 'fly' ? 'tedHatFly 1.2s ease-out forwards' : 'tedHatDrop 0.7s cubic-bezier(0.3,1.5,0.5,1) both' }}>
                <g transform="rotate(-9 100 24)">
                  <path d="M72 24 Q100 30 128 24 L102 -36 Q100 -38 98 -36 Z" fill="#ff5d8f" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
                  <g clipPath={`url(#${hatClip})`}>
                    {[-18, 0, 18, 36].map((y) => <path key={y} d={`M60 ${y + 14} L140 ${y - 6}`} stroke="#fff" strokeWidth="5" opacity="0.6" />)}
                  </g>
                  <ellipse cx="100" cy="25" rx="29" ry="5.2" fill="#ffd54a" stroke={LINE} strokeWidth="2.4" />
                  <circle cx="100" cy="-39" r="8" fill="#ffd54a" stroke={LINE} strokeWidth="2.4" />
                </g>
              </g>
            ) : null}
          </g>
        </g>
      </g>
    </svg>
  );
}
