'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'fc-recent-tools';
const MAX_RECENT = 8;
const CHANGE_EVENT = 'fc-recent-tools-change';

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function recordToolVisit(slug: string) {
  try {
    const next = [slug, ...readRecents().filter((s) => s !== slug)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* ignore — private mode etc. */
  }
}

/** Recently used tool slugs, newest first. Empty on first paint (hydration-safe). */
export function useRecentTools(): string[] {
  const [recents, setRecents] = useState<string[]>([]);

  const refresh = useCallback(() => setRecents(readRecents()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return recents;
}
