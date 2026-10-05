/**
 * Decorative audiogram and sound-wave motif for the home hero. Pure SVG, no images.
 * Ear colours follow the clinical convention (right red O, left blue X) even when used decoratively.
 */
const FREQS = [250, 500, 1000, 2000, 4000, 8000];
const RIGHT = [15, 20, 25, 40, 55, 65];
const LEFT = [10, 15, 25, 35, 60, 70];
const RED = "#c81e1e";
const BLUE = "#1d4ed8";

export function HeroAudiogram() {
  const W = 300;
  const H = 230;
  const pl = 34;
  const pt = 26;
  const pw = W - pl - 14;
  const ph = H - pt - 26;
  const x = (i: number) => pl + (i * pw) / (FREQS.length - 1);
  const y = (db: number) => pt + ((db + 10) / 100) * ph;
  const path = (v: number[]) => v.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Illustrative audiogram motif with right ear circles in red and left ear crosses in blue">
      <rect x="0" y="0" width={W} height={H} rx="18" fill="#ffffff" />
      <text x={pl} y="16" fontSize="10" fontWeight="700" fill="#5b2a6e" letterSpacing="1.5">AUDIOGRAM</text>
      <text x={W - 14} y="16" fontSize="9" textAnchor="end" fill="#57534e">dB HL</text>
      {FREQS.map((f, i) => (
        <g key={f}>
          <line x1={x(i)} x2={x(i)} y1={pt} y2={pt + ph} stroke="#eadfd0" />
          <text x={x(i)} y={H - 10} fontSize="8.5" textAnchor="middle" fill="#57534e">{f >= 1000 ? `${f / 1000}k` : f}</text>
        </g>
      ))}
      {[0, 20, 40, 60, 80].map((d) => (
        <g key={d}>
          <line x1={pl} x2={pl + pw} y1={y(d)} y2={y(d)} stroke="#eadfd0" />
          <text x={pl - 6} y={y(d) + 3} fontSize="8.5" textAnchor="end" fill="#57534e">{d}</text>
        </g>
      ))}
      <rect x={pl} y={y(-10)} width={pw} height={y(25) - y(-10)} fill="#f5ecf7" opacity="0.7" />
      <path d={path(RIGHT)} fill="none" stroke={RED} strokeWidth="1.8" />
      <path d={path(LEFT)} fill="none" stroke={BLUE} strokeWidth="1.8" strokeDasharray="5 4" />
      {RIGHT.map((d, i) => (
        <circle key={`r${i}`} cx={x(i)} cy={y(d)} r="5" fill="#fff" stroke={RED} strokeWidth="1.8" />
      ))}
      {LEFT.map((d, i) => (
        <g key={`l${i}`} stroke={BLUE} strokeWidth="2">
          <line x1={x(i) - 4.5} y1={y(d) - 4.5} x2={x(i) + 4.5} y2={y(d) + 4.5} />
          <line x1={x(i) - 4.5} y1={y(d) + 4.5} x2={x(i) + 4.5} y2={y(d) - 4.5} />
        </g>
      ))}
    </svg>
  );
}

/** Layered sine waves used as the hero's bottom edge. */
export function WaveEdge() {
  const wave = (amp: number, len: number, phase: number, yBase: number) => {
    let d = `M0,${yBase}`;
    for (let px = 0; px <= 1440; px += 12) {
      d += ` L${px},${(yBase + amp * Math.sin((px / len) * 2 * Math.PI + phase)).toFixed(1)}`;
    }
    return d;
  };
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="block h-16 w-full sm:h-20" aria-hidden="true">
      <path d={`${wave(10, 360, 0, 40)} L1440,90 L0,90 Z`} fill="#5b2a6e" opacity="0.55" />
      <path d={wave(14, 240, 1.2, 46)} fill="none" stroke="#f4a940" strokeWidth="2.2" opacity="0.9" />
      <path d={wave(7, 180, 2.4, 52)} fill="none" stroke="#c9a7d6" strokeWidth="1.4" opacity="0.8" />
      <path d={`${wave(9, 480, 0.6, 62)} L1440,90 L0,90 Z`} fill="#fbf7f1" />
    </svg>
  );
}
