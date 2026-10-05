/** Audiology Compass mark: a waveform inside a compass ring. Simple inline SVG. */
export default function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#2a1035" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#f4a940" strokeWidth="1.8" />
      <g stroke="#f4a940" strokeWidth="1.8" strokeLinecap="round">
        <line x1="16" y1="3.6" x2="16" y2="6" />
        <line x1="16" y1="26" x2="16" y2="28.4" />
        <line x1="3.6" y1="16" x2="6" y2="16" />
        <line x1="26" y1="16" x2="28.4" y2="16" />
      </g>
      <path
        d="M8.6 16h2.2l1.4-3.6 2 8.2 2-11.2 2 9.6 1.5-5 1.1 2h2.6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
