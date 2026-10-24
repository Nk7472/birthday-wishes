// Optional "blow out the candles" detection using the microphone.
// Returns a stop() function. Calls onBlow() once when a sustained loud burst
// of low-frequency breath noise is detected. Calls onDenied() if unavailable.
export async function listenForBlow({ onBlow, onDenied, threshold = 0.28, holdMs = 260 }) {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('no mic');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AC = window.AudioContext || window.webkitAudioContext;
    const c = new AC();
    const src = c.createMediaStreamSource(stream);
    const an = c.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    let since = 0;
    let raf = 0;
    let done = false;
    const tick = () => {
      an.getByteFrequencyData(data);
      let s = 0;
      for (let i = 0; i < 24; i++) s += data[i]; // low band = breath rumble
      const level = s / 24 / 255;
      const now = performance.now();
      if (level > threshold) {
        if (!since) since = now;
        if (now - since > holdMs && !done) {
          done = true;
          onBlow?.();
        }
      } else since = 0;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      c.close();
    };
  } catch (e) {
    onDenied?.();
    return () => {};
  }
}
