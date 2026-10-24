import { useLayoutEffect, useRef } from 'react';
import { registerStage, unregisterStage } from '../../lib/confetti';

/**
 * Root of every template. Fills its parent (full screen in the viewer, a phone
 * frame in the studio), clips overflow, and is a CSS size container — so use
 * `cqw / cqh / cqmin` units (not vw / vh) for anything that should scale with
 * the stage.
 */
export default function Stage({ className = '', style, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    registerStage(el);
    return () => unregisterStage(el);
  }, []);
  return (
    <div
      ref={ref}
      data-stage
      className={`relative isolate h-full w-full select-none overflow-hidden ${className}`}
      style={{ containerType: 'size', ...style }}
    >
      {children}
    </div>
  );
}
