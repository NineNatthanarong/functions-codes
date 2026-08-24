import { TOOLS, type ToolCategory } from '@/lib/tools';

export type FloorKey = 'all' | ToolCategory;

export const FLOOR_ORDER: FloorKey[] = [
  'all',
  'file',
  'image',
  'dev',
  'write',
  'audio',
  'fun',
];

export const FLOOR_ID: Record<FloorKey, string> = {
  all: 'L',
  file: '1',
  image: '2',
  dev: '3',
  write: '4',
  audio: '5',
  fun: '6',
};

export function roomCode(slug: string): string {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return '—';
  const siblings = TOOLS.filter((t) => t.category === tool.category);
  const n = siblings.findIndex((t) => t.slug === slug) + 1;
  return `${FLOOR_ID[tool.category]}.${String(n).padStart(2, '0')}`;
}

export function floorKeyForSlug(slug: string): FloorKey {
  const tool = TOOLS.find((t) => t.slug === slug);
  return tool ? tool.category : 'all';
}

export function floorsBetween(fromId: string, toId: string): string[] {
  const ids = FLOOR_ORDER.map((k) => FLOOR_ID[k]);
  const a = ids.indexOf(fromId);
  const b = ids.indexOf(toId);
  if (a < 0 || b < 0 || a === b) return [toId];
  const step = a < b ? 1 : -1;
  const out: string[] = [];
  for (let i = a + step; ; i += step) {
    out.push(ids[i]);
    if (i === b) break;
  }
  return out;
}

export function timeOfDay(d = new Date()): 'dawn' | 'day' | 'dusk' | 'night' {
  const h = d.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}
