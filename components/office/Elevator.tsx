'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FLOOR_ID,
  FLOOR_ORDER,
  floorsBetween,
  type FloorKey,
} from '@/lib/office';

export function useElevatorRide(initial: FloorKey = 'all') {
  const reduced = useReducedMotion();
  const [floor, setFloor] = useState<FloorKey>(initial);
  const [shut, setShut] = useState(false);
  const [shown, setShown] = useState(FLOOR_ID[initial]);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clear(), []);

  const go = (next: FloorKey) => {
    if (next === floor && !shut) return;
    clear();

    if (reduced) {
      setFloor(next);
      setShown(FLOOR_ID[next]);
      setShut(false);
      return;
    }

    const from = shown;
    setShut(true);
    const tClose = window.setTimeout(() => {
      setFloor(next);
      const sequence = floorsBetween(from, FLOOR_ID[next]);
      sequence.forEach((id, i) => {
        const t = window.setTimeout(() => setShown(id), i * 70);
        timers.current.push(t);
      });
      const tOpen = window.setTimeout(() => setShut(false), sequence.length * 70 + 200);
      timers.current.push(tOpen);
    }, 260);
    timers.current.push(tClose);
  };

  return { floor, go, shut, shown, reduced: Boolean(reduced) };
}

export function ElevatorPanel({
  floor,
  shown,
  shut,
  onChange,
  labels,
  ariaLabel,
}: {
  floor: FloorKey;
  shown: string;
  shut: boolean;
  onChange: (f: FloorKey) => void;
  labels: Record<FloorKey, string>;
  ariaLabel: string;
}) {
  const currentLabel = labels[FLOOR_ORDER.find((k) => FLOOR_ID[k] === shown) ?? floor];

  return (
    <div className="elevator-panel">
      <div className="elevator-led" aria-live="polite">
        <span className="elevator-led-id">{shown}</span>
        <span className="elevator-led-name">{currentLabel}</span>
      </div>
      <div className="elevator-bank" role="tablist" aria-label={ariaLabel}>
        {FLOOR_ORDER.map((key) => {
          const on = key === floor;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="directory"
              onClick={() => onChange(key)}
              className={cn('elevator-btn', on && 'is-on')}
            >
              <span className="elevator-btn-id">{FLOOR_ID[key]}</span>
              <span className="elevator-btn-label">{labels[key]}</span>
            </button>
          );
        })}
      </div>
      <p className="elevator-hint">{shut ? '·' : ''}</p>
    </div>
  );
}

export function ElevatorDoors({
  shut,
  shown,
  label,
}: {
  shut: boolean;
  shown: string;
  label: string;
}) {
  return (
    <div className="elevator-doors" data-shut={shut ? 'true' : 'false'} aria-hidden={!shut}>
      <span className="door-leaf is-left" />
      <span className="door-leaf is-right" />
      <span className={cn('door-readout', shut && 'is-visible')}>
        <span className="door-readout-id">{shown}</span>
        <span className="door-readout-name">{label}</span>
      </span>
    </div>
  );
}
