'use client';

import { useEffect, useState } from 'react';

export default function LobbyClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hour = h * 30 + m * 0.5;
  const minute = m * 6 + s * 0.1;
  const second = s * 6;
  const label = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="lobby-clock" title={label} aria-label={label} role="img">
      <span className="lobby-clock-face">
        <span className="lobby-clock-hand is-hour" style={{ transform: `rotate(${hour}deg)` }} />
        <span className="lobby-clock-hand is-minute" style={{ transform: `rotate(${minute}deg)` }} />
        <span className="lobby-clock-hand is-second" style={{ transform: `rotate(${second}deg)` }} />
        <span className="lobby-clock-pip" />
      </span>
      <span className="lobby-clock-digits">{label}</span>
    </div>
  );
}
