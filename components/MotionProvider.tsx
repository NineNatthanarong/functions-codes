'use client';

import { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';

/** Respects the OS prefers-reduced-motion setting for all framer-motion animations. */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
