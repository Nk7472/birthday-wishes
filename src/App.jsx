import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import BrowserGate from './components/BrowserGate';
import { bypassed, detectBrowser } from './lib/browser';
import { decodeWish, parseHash } from './lib/share';
import Player from './screens/Player';
import Studio from './screens/Studio';
import Exporter from './screens/Exporter';
import { track } from './lib/track';

function BrokenLink() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-canvas px-6 text-center text-ink">
      <div className="text-6xl">🎈</div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">This wish link is incomplete</h1>
      <p className="max-w-sm text-mute">It may have been cut off when it was shared. Ask the sender to copy the full link again.</p>
      <button type="button" onClick={() => { window.location.hash = '#/'; }} className="btn btn-primary">
        Make a wish of your own
      </button>
    </div>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [browser] = useState(detectBrowser);
  const [pass, setPass] = useState(() => browser.ok || bypassed());
  const [exporting, setExporting] = useState(null); // a wish being turned into a video

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    if (parseHash(hash)) track('gift_open');
  }, [hash]);

  let body;
  if (!pass) {
    body = <BrowserGate info={browser} onContinue={() => setPass(true)} />;
  } else {
    const code = parseHash(hash);
    if (code) {
      const wish = decodeWish(code);
      body = wish ? (
        <Player key={code} wish={wish} mode="recipient" onMakeOwn={() => { window.location.hash = '#/'; }} />
      ) : (
        <BrokenLink />
      );
    } else {
      body = <Studio onOpenExport={setExporting} />;
    }
  }

  return (
    <AppShell>
      {body}
      {exporting ? <Exporter wish={exporting} onClose={() => setExporting(null)} /> : null}
    </AppShell>
  );
}
