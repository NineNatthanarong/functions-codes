export default function BuildingMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path d="M3 3h10v2.4H6v2.4h5.6v2.4H6V13H3V3z" fill="currentColor" />
    </svg>
  );
}
