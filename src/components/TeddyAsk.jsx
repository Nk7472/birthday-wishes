import Teddy from './shared/Teddy';

const wave = (a0, a1, dur) => ({ animation: `tedSwing ${dur}s ease-in-out infinite`, '--a0': a0, '--a1': a1 });
const WAVING = { head: wave('-4deg', '5deg', 1.6), armL: wave('3deg', '-2deg', 3), armR: wave('-138deg', '-172deg', 0.5) };

/** The teddy from the scenes, waving politely. */
export default function TeddyAsk({ face = 'open', className = '' }) {
  return (
    <div className={className}>
      <Teddy face={face} m={WAVING} />
    </div>
  );
}
