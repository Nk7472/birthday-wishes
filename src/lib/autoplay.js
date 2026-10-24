// Scripted "finger" for hands-free playback and video export.
// A plan is a list of taps, each either
//   [seconds, 'css selector', nth?]   tap the nth visible match (default 0)
//   [seconds, xPercent, yPercent]      tap a point inside the reel
// Taps are dispatched as real pointer/mouse/click events at the element under the
// point, so templates react exactly as they do for a person's finger.

function fire(el, type, x, y, Ctor = PointerEvent) {
  el.dispatchEvent(
    new Ctor(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: type.endsWith('down') ? 1 : 0,
    }),
  );
}

export function tapPoint(x, y, root) {
  // elementsFromPoint sees through overlays (the "Making your video" cover) to the scene underneath
  const el = root ? document.elementsFromPoint(x, y).find((e) => root.contains(e)) : document.elementFromPoint(x, y);
  if (!el) return false;
  fire(el, 'pointerdown', x, y);
  fire(el, 'mousedown', x, y, MouseEvent);
  fire(el, 'pointerup', x, y);
  fire(el, 'mouseup', x, y, MouseEvent);
  fire(el, 'click', x, y, MouseEvent);
  return true;
}

function visible(el, root) {
  const r = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return r.width > 2 && r.height > 2 && r.right > b.left && r.left < b.right && r.bottom > b.top && r.top < b.bottom;
}

/** Tap a target inside `root`. Returns true if something was tapped. */
export function tapTarget(root, a, b) {
  const box = root.getBoundingClientRect();
  if (typeof a === 'string') {
    const all = [...root.querySelectorAll(a)].filter((el) => visible(el, root));
    const el = all[Math.min(b || 0, Math.max(0, all.length - 1))];
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return tapPoint(r.left + r.width / 2, r.top + r.height / 2, root);
  }
  return tapPoint(box.left + (a / 100) * box.width, box.top + (b / 100) * box.height, root);
}

/** Schedule a plan. `t0` is when the show started. Returns a cancel function. */
export function runPlan(root, plan = [], onTap) {
  const timers = plan.map(([sec, a, b]) =>
    setTimeout(() => {
      if (tapTarget(root, a, b) && onTap) onTap();
    }, sec * 1000),
  );
  return () => timers.forEach(clearTimeout);
}
