// CSS-driven entrance animations (GPU transforms, no JS per frame).
// All classes are written out in full so Tailwind can see them.
const ANIM = {
  'fade-up': 'animate-fade-up',
  'fade-in': 'animate-fade-in',
  'pop-in': 'animate-pop-in',
  'zoom-in': 'animate-zoom-in',
  'drop-in': 'animate-drop-in',
};

export const animClass = (name) => ANIM[name] || ANIM['fade-up'];

/**
 * Wrap anything to fade/pop/drop it in after `delay` ms.
 *   <Reveal anim="pop-in" delay={800}>…</Reveal>
 * Items stay hidden until their delay elapses (animation-fill-mode: both).
 */
export default function Reveal({
  as: Tag = 'div',
  anim = 'fade-up',
  delay = 0,
  duration,
  className = '',
  style,
  children,
  ...rest
}) {
  return (
    <Tag
      className={`${animClass(anim)} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        ...(duration ? { animationDuration: `${duration}ms` } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
