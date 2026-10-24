import { useEffect, useRef, useState } from 'react';
import { real } from '../lib/vclock';

/**
 * Little animated "how to" pictures for turning location on. No video files needed (drop real recordings in
 * public/guide/ named like location-android-blocked.mp4 and they are used instead, see README).
 * kind: 'blocked' (the site was set to "never allow") | 'off' (the phone's location switch is off)
 * os:   'android' | 'ios' | 'desktop'
 */

// ---- tiny pieces of fake phone UI -------------------------------------------------------------------------------
const Ring = ({ x, y, w = 18, h = 18, r = 999 }) => (
  <span className="pointer-events-none absolute z-10" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, borderRadius: r, border: '0.5cqw solid #0071e3', animation: 'locRing 1.4s ease-out infinite', transform: 'translate(-50%,-50%)' }} />
);
const Finger = ({ x, y }) => (
  <span className="pointer-events-none absolute z-20 text-[9cqw] leading-none" style={{ left: `${x}%`, top: `${y}%`, animation: 'locTap 1.6s ease-in-out infinite' }} aria-hidden="true">
    👆
  </span>
);
const Row = ({ children, on, accent }) => (
  <div className={`flex items-center justify-between rounded-[2cqw] px-[3.4cqw] py-[2.6cqw] text-[3.6cqw] font-medium ${on ? 'bg-[#0071e3]/10 text-ink' : 'bg-white text-ink'}`}>
    {children}
    {accent ? <span className="text-mute">›</span> : null}
  </div>
);
const Toggle = ({ on }) => (
  <span className="relative inline-block h-[5.6cqw] w-[9.6cqw] rounded-full transition-colors duration-500" style={{ background: on ? '#34c759' : '#d1d1d6' }}>
    <span className="absolute top-[0.5cqw] h-[4.6cqw] w-[4.6cqw] rounded-full bg-white shadow transition-all duration-500" style={{ left: on ? '4.6cqw' : '0.5cqw' }} />
  </span>
);
const Tile = ({ label, icon, on }) => (
  <div className={`flex flex-col items-center gap-[1.2cqw] rounded-[3cqw] px-[2cqw] py-[3cqw] text-[3cqw] font-medium transition-colors duration-500 ${on ? 'bg-[#0071e3] text-white' : 'bg-[#e5e5ea] text-ink'}`}>
    <span className="text-[6cqw] leading-none">{icon}</span>
    {label}
  </div>
);
const Url = ({ ring }) => (
  <div className="relative mx-auto flex h-[10cqw] w-[92%] items-center gap-[2cqw] rounded-full bg-white px-[3cqw] text-[3.4cqw] shadow-sm">
    <span className="relative text-[4.4cqw]" aria-hidden="true">
      🎚️{ring ? <Ring x={50} y={50} w={170} h={170} /> : null}
    </span>
    <span className="flex-1 truncate text-mute">wishbox.app</span>
    <span className="text-mute">⋮</span>
  </div>
);
const Sheet = ({ children }) => <div className="mx-auto mt-[3cqw] w-[92%] space-y-[1.6cqw] rounded-[3cqw] bg-[#f2f2f7] p-[2.4cqw]">{children}</div>;

// ---- the steps ---------------------------------------------------------------------------------------------------
const GUIDES = {
  'android-blocked': [
    { text: 'Tap the little icon at the left of the web address', ui: <><div className="pt-[5cqw]"><Url ring /></div><Finger x={14} y={56} /></> },
    { text: 'Tap “Permissions”', ui: <div className="pt-[4cqw]"><Sheet><Row>🔔 Notifications</Row><Row on accent>📍 Permissions</Row><Row accent>🍪 Cookies</Row></Sheet><Ring x={50} y={50} w={88} h={22} r={14} /><Finger x={72} y={56} /></div> },
    { text: 'Switch Location on (choose Allow)', ui: <div className="pt-[4cqw]"><Sheet><Row on>📍 Location <Toggle on /></Row><Row>📷 Camera <Toggle /></Row></Sheet><Ring x={50} y={32} w={88} h={22} r={14} /><Finger x={78} y={40} /></div> },
  ],
  'ios-blocked': [
    { text: 'Open the Settings app on your iPhone', ui: <><div className="grid grid-cols-4 gap-[3cqw] px-[8cqw] pt-[6cqw] text-center text-[8cqw]"><span>📞</span><span>💬</span><span className="relative">⚙️<Ring x={50} y={50} w={150} h={150} /></span><span>📷</span></div><Finger x={59} y={44} /></> },
    { text: 'Scroll down and tap “Chrome”', ui: <div className="pt-[4cqw]"><Sheet><Row accent>🔋 Battery</Row><Row on accent>🌐 Chrome</Row><Row accent>🧭 Safari</Row></Sheet><Ring x={50} y={46} w={88} h={22} r={14} /><Finger x={70} y={54} /></div> },
    { text: 'Tap Location, then “While Using the App”', ui: <div className="pt-[4cqw]"><Sheet><Row>Never</Row><Row on>✓ While Using the App</Row><Row>Ask Next Time</Row></Sheet><Ring x={50} y={44} w={88} h={22} r={14} /><Finger x={72} y={52} /></div> },
  ],
  'android-off': [
    { text: 'Swipe down from the top of your screen', ui: <div className="relative h-full pt-[3cqw]"><div className="mx-auto h-[2cqw] w-[30%] rounded-full bg-black/20" /><span className="absolute left-1/2 top-[18%] z-20 text-[11cqw]" style={{ animation: 'locSwipe 1.8s ease-in-out infinite' }}>👇</span></div> },
    { text: 'Tap the “Location” tile to turn it on', ui: <div className="px-[6cqw] pt-[5cqw]"><div className="grid grid-cols-3 gap-[2.4cqw]"><Tile icon="📶" label="Wi-Fi" on /><Tile icon="🔵" label="Bluetooth" /><Tile icon="📍" label="Location" on={false} /></div><Ring x={83} y={44} w={26} h={42} r={14} /><Finger x={86} y={56} /></div> },
    { text: 'Location is on. Come back here and we continue by ourselves', ui: <div className="px-[6cqw] pt-[5cqw]"><div className="grid grid-cols-3 gap-[2.4cqw]"><Tile icon="📶" label="Wi-Fi" on /><Tile icon="🔵" label="Bluetooth" /><Tile icon="📍" label="Location" on /></div><p className="mt-[5cqw] text-center text-[4cqw] font-semibold text-[#1c8a3a]">✓ Location on</p></div> },
  ],
  'ios-off': [
    { text: 'Open Settings › Privacy & Security', ui: <div className="pt-[4cqw]"><Sheet><Row accent>🔔 Notifications</Row><Row on accent>✋ Privacy & Security</Row><Row accent>🔋 Battery</Row></Sheet><Ring x={50} y={46} w={88} h={22} r={14} /><Finger x={72} y={54} /></div> },
    { text: 'Tap “Location Services” and switch it on', ui: <div className="pt-[4cqw]"><Sheet><Row on>📍 Location Services <Toggle on /></Row><Row accent>📷 Camera</Row></Sheet><Ring x={50} y={32} w={88} h={22} r={14} /><Finger x={80} y={40} /></div> },
    { text: 'Then Settings › Chrome › Location › While Using. Come back here', ui: <div className="pt-[4cqw]"><Sheet><Row>Never</Row><Row on>✓ While Using the App</Row></Sheet><p className="mt-[5cqw] text-center text-[4cqw] font-semibold text-[#1c8a3a]">✓ All set</p></div> },
  ],
  'desktop-blocked': [
    { text: 'Click the icon at the left of the web address', ui: <><div className="pt-[5cqw]"><Url ring /></div><Finger x={14} y={56} /></> },
    { text: 'Find “Location” in the list', ui: <div className="pt-[4cqw]"><Sheet><Row>🍪 Cookies</Row><Row on>📍 Location <span className="text-[3cqw] text-mute">Blocked</span></Row></Sheet><Ring x={50} y={40} w={88} h={22} r={14} /><Finger x={72} y={46} /></div> },
    { text: 'Switch it to Allow, then reload', ui: <div className="pt-[4cqw]"><Sheet><Row on>📍 Location <Toggle on /></Row></Sheet><Ring x={50} y={32} w={88} h={22} r={14} /><Finger x={80} y={40} /></div> },
  ],
  'desktop-off': [
    { text: 'Open your computer’s Privacy settings', ui: <div className="pt-[4cqw]"><Sheet><Row accent>🖥️ System</Row><Row on accent>✋ Privacy › Location</Row></Sheet><Ring x={50} y={40} w={88} h={22} r={14} /><Finger x={72} y={48} /></div> },
    { text: 'Turn Location Services on, then try again', ui: <div className="pt-[4cqw]"><Sheet><Row on>📍 Location services <Toggle on /></Row></Sheet><Ring x={50} y={32} w={88} h={22} r={14} /><Finger x={80} y={40} /></div> },
  ],
};

export default function LocationGuide({ kind, os }) {
  const key = `${os}-${kind}`;
  const steps = GUIDES[key] || GUIDES['desktop-blocked'];
  const [i, setI] = useState(0);
  const [video, setVideo] = useState(false);
  const hold = useRef(false);

  useEffect(() => {
    setI(0);
    const id = real.setInterval(() => !hold.current && setI((v) => (v + 1) % steps.length), 3200);
    return () => real.clearInterval(id);
  }, [key, steps.length]);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-[1.4rem] bg-[#e9e9ee]" style={{ containerType: 'inline-size', aspectRatio: '16 / 9' }} aria-label="How to turn location on" role="img">
        {/* a real recording, when you add one (public/guide/location-<os>-<kind>.mp4) */}
        <video
          src={`guide/location-${key}.mp4`}
          muted
          loop
          playsInline
          autoPlay
          onLoadedData={() => setVideo(true)}
          onError={() => setVideo(false)}
          className={`absolute inset-0 z-30 h-full w-full object-cover ${video ? '' : 'hidden'}`}
        />
        {steps.map((s, n) => (
          <div key={n} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: n === i ? 1 : 0 }} aria-hidden={n !== i}>
            {s.ui}
          </div>
        ))}
      </div>
      <p className="mt-2 min-h-[2.5rem] text-center text-[0.95rem] font-semibold leading-snug" aria-live="polite">
        <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.72rem] text-white">{i + 1}</span>
        {steps[i].text}
      </p>
      <div className="mt-1 flex justify-center gap-1.5">
        {steps.map((_, n) => (
          <button key={n} type="button" aria-label={`Step ${n + 1}`} onClick={() => { hold.current = true; setI(n); }} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-accent' : 'w-1.5 bg-black/20'}`} />
        ))}
      </div>
    </div>
  );
}
