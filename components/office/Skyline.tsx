'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { timeOfDay } from '@/lib/office';

type Building = {
  x: number;
  w: number;
  h: number;
  z: 0 | 1;
  delay: number;
};

const FAR: Building[] = [
  { x: 2, w: 7, h: 34, z: 0, delay: 0.2 },
  { x: 10, w: 5, h: 48, z: 0, delay: 1.1 },
  { x: 16, w: 9, h: 28, z: 0, delay: 0.6 },
  { x: 28, w: 6, h: 56, z: 0, delay: 1.8 },
  { x: 36, w: 8, h: 40, z: 0, delay: 0.4 },
  { x: 48, w: 5, h: 62, z: 0, delay: 2.2 },
  { x: 56, w: 10, h: 32, z: 0, delay: 0.9 },
  { x: 70, w: 6, h: 50, z: 0, delay: 1.5 },
  { x: 78, w: 8, h: 36, z: 0, delay: 0.3 },
  { x: 90, w: 7, h: 44, z: 0, delay: 1.9 },
];

const NEAR: Building[] = [
  { x: 0, w: 9, h: 58, z: 1, delay: 0.5 },
  { x: 8, w: 6, h: 72, z: 1, delay: 1.4 },
  { x: 15, w: 11, h: 46, z: 1, delay: 0.8 },
  { x: 27, w: 7, h: 80, z: 1, delay: 2.0 },
  { x: 35, w: 5, h: 64, z: 1, delay: 0.1 },
  { x: 42, w: 10, h: 52, z: 1, delay: 1.7 },
  { x: 54, w: 8, h: 88, z: 1, delay: 0.7 },
  { x: 64, w: 6, h: 60, z: 1, delay: 2.4 },
  { x: 72, w: 12, h: 42, z: 1, delay: 1.2 },
  { x: 86, w: 7, h: 70, z: 1, delay: 0.35 },
  { x: 94, w: 6, h: 54, z: 1, delay: 1.6 },
];

export default function Skyline() {
  const reduced = useReducedMotion();
  const [tod, setTod] = useState<'dawn' | 'day' | 'dusk' | 'night'>('dusk');
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTod(timeOfDay());
  }, []);

  return (
    <div
      className="skyline"
      data-tod={tod}
      aria-hidden
      onPointerMove={
        reduced
          ? undefined
          : (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPos({
                x: (e.clientX - r.left) / r.width - 0.5,
                y: (e.clientY - r.top) / r.height - 0.5,
              });
            }
      }
    >
      <div className="skyline-sky" />
      <div className="skyline-haze" />
      <div
        className="skyline-layer is-far"
        style={
          reduced
            ? undefined
            : { transform: `translate3d(${pos.x * -10}px, ${pos.y * -4}px, 0)` }
        }
      >
        {FAR.map((b, i) => (
          <span
            key={`f${i}`}
            className="skyline-bldg is-far"
            style={{
              left: `${b.x}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>
      <div
        className="skyline-layer is-near"
        style={
          reduced
            ? undefined
            : { transform: `translate3d(${pos.x * -22}px, ${pos.y * -8}px, 0)` }
        }
      >
        {NEAR.map((b, i) => (
          <span
            key={`n${i}`}
            className="skyline-bldg is-near"
            style={{
              left: `${b.x}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="skyline-mullions" />
      <div className="skyline-glass" />
      <div className="skyline-sill" />
    </div>
  );
}
