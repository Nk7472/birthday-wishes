import { useEffect, useRef } from 'react';
import { useTyped } from './hooks';

/**
 * Types text out with a blinking cursor. The full text is reserved (invisible)
 * so the layout never jumps while typing. onDone fires once when finished.
 */
export default function Typewriter({
  text,
  speed = 42,
  delay = 0,
  cursor = true,
  active = true,
  onDone,
  className = '',
  cursorClassName = '',
}) {
  const { text: shown, done } = useTyped(text, { speed, delay, active });
  const cb = useRef(onDone);
  cb.current = onDone;
  useEffect(() => {
    if (done && active && text) cb.current?.();
  }, [done, active, text]);

  return (
    <span className={`relative block ${className}`}>
      <span className="invisible" aria-hidden="true">
        {text}
      </span>
      <span className="absolute left-0 top-0 w-full">
        {shown}
        {cursor && !done ? (
          <span className={`ml-0.5 inline-block w-[0.08em] animate-pulse bg-current align-baseline ${cursorClassName}`}>
            &nbsp;
          </span>
        ) : null}
      </span>
    </span>
  );
}
