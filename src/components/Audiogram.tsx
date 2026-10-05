"use client";

import { forwardRef } from "react";
import { BC_FREQS, FREQS, fmtHz, type Audiogram, type Ear } from "@/lib/audiology";

// Audiogram using ASHA (1990) audiometric symbols:
// right AC O (masked triangle), left AC X (masked square), right BC < (masked [), left BC > (masked ]).
// No response: arrow down and outwards (to the left for right-ear symbols, to the right for left-ear symbols).

const W = 560;
const H = 490;
const PAD = { l: 56, r: 30, t: 62, b: 70 };
const INSET = 18; // keeps bone conduction symbols at 250 and 8000 Hz inside the frame
const YMIN = -10;
const YMAX = 120;
// Clinical symbol colours per ASHA (1990): right ear red, left ear blue. Fixed on purpose; never take these from the site theme.
const RED = "#c81e1e";
const BLUE = "#1d4ed8";

const xOf = (f: number) => PAD.l + INSET + (Math.log2(f / 250) / 5) * (W - PAD.l - PAD.r - 2 * INSET);
const yOf = (db: number) => PAD.t + ((db - YMIN) / (YMAX - YMIN)) * (H - PAD.t - PAD.b);

function Arrow({ x, y, ear }: { x: number; y: number; ear: Ear }) {
  const dx = ear === "R" ? -9 : 9;
  const c = ear === "R" ? RED : BLUE;
  return (
    <g stroke={c} strokeWidth={1.6} fill="none">
      <line x1={x} y1={y} x2={x + dx} y2={y + 11} />
      <polyline points={`${x + dx - (ear === "R" ? -4 : 4)},${y + 10} ${x + dx},${y + 11} ${x + dx},${y + 6}`} />
    </g>
  );
}

function AcSymbol({ x, y, ear, masked }: { x: number; y: number; ear: Ear; masked: boolean }) {
  const s = 6;
  if (ear === "R") {
    return masked ? (
      <polygon points={`${x},${y - s - 1} ${x - s},${y + s - 1} ${x + s},${y + s - 1}`} fill="white" stroke={RED} strokeWidth={1.8} />
    ) : (
      <circle cx={x} cy={y} r={s} fill="white" stroke={RED} strokeWidth={1.8} />
    );
  }
  return masked ? (
    <rect x={x - s} y={y - s} width={2 * s} height={2 * s} fill="white" stroke={BLUE} strokeWidth={1.8} />
  ) : (
    <g stroke={BLUE} strokeWidth={2}>
      <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
      <line x1={x - s} y1={y + s} x2={x + s} y2={y - s} />
    </g>
  );
}

function BcSymbol({ x, y, ear, masked }: { x: number; y: number; ear: Ear; masked: boolean }) {
  const s = 6;
  const c = ear === "R" ? RED : BLUE;
  // Right-ear BC symbols sit to the left of the frequency line, left-ear symbols to the right.
  const cx = ear === "R" ? x - 11 : x + 11;
  let pts: string;
  if (!masked) pts = ear === "R" ? `${cx + s / 1.3},${y - s} ${cx - s / 1.3},${y} ${cx + s / 1.3},${y + s}` : `${cx - s / 1.3},${y - s} ${cx + s / 1.3},${y} ${cx - s / 1.3},${y + s}`;
  else pts = ear === "R" ? `${cx + 4},${y - s} ${cx - 2},${y - s} ${cx - 2},${y + s} ${cx + 4},${y + s}` : `${cx - 4},${y - s} ${cx + 2},${y - s} ${cx + 2},${y + s} ${cx - 4},${y + s}`;
  return <polyline points={pts} fill="none" stroke={c} strokeWidth={1.8} />;
}

interface Props {
  data: Audiogram;
  title?: string;
  showBc?: boolean;
}

const AudiogramChart = forwardRef<SVGSVGElement, Props>(function AudiogramChart({ data, title, showBc = true }, ref) {
  const octaves = [250, 500, 1000, 2000, 4000, 8000];
  const inter = [750, 1500, 3000, 6000];
  const dbTicks = Array.from({ length: (YMAX - YMIN) / 10 + 1 }, (_, i) => YMIN + i * 10);
  const line = (ear: Ear) => {
    const pts = FREQS.map((f) => ({ f, t: data[ear].ac[f] })).filter((p) => p.t && p.t.value !== null && !p.t.nr);
    return pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.f).toFixed(1)},${yOf(p.t.value as number).toFixed(1)}`).join(" ");
  };
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[560px]" role="img" aria-label="Audiogram" fontFamily="Arial, Helvetica, sans-serif">
      <rect x={0} y={0} width={W} height={H} fill="white" />
      <text x={W / 2} y={18} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#292524">{title || "Audiogram"}</text>
      <text x={W / 2} y={36} textAnchor="middle" fontSize="11" fill="#475569">Frequency (Hz)</text>
      {/* grid */}
      {dbTicks.map((d) => (
        <g key={d}>
          <line x1={PAD.l} x2={W - PAD.r} y1={yOf(d)} y2={yOf(d)} stroke={d === 20 ? "#94a3b8" : "#e2e8f0"} strokeDasharray={d === 20 ? "4 3" : undefined} />
          <text x={PAD.l - 8} y={yOf(d) + 4} fontSize="11" textAnchor="end" fill="#475569">{d}</text>
        </g>
      ))}
      {octaves.map((f) => (
        <g key={f}>
          <line x1={xOf(f)} x2={xOf(f)} y1={PAD.t} y2={H - PAD.b} stroke="#cbd5e1" />
          <text x={xOf(f)} y={PAD.t - 6} fontSize="11" textAnchor="middle" fill="#334155">{fmtHz(f)}</text>
        </g>
      ))}
      {inter.map((f) => (
        <line key={f} x1={xOf(f)} x2={xOf(f)} y1={PAD.t} y2={H - PAD.b} stroke="#e2e8f0" strokeDasharray="2 3" />
      ))}
      <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} fill="none" stroke="#64748b" />
      <text x={14} y={(PAD.t + H - PAD.b) / 2} fontSize="11" fill="#475569" transform={`rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})`} textAnchor="middle">
        Hearing level (dB HL)
      </text>
      {/* lines */}
      <path d={line("R")} fill="none" stroke={RED} strokeWidth={1.6} />
      <path d={line("L")} fill="none" stroke={BLUE} strokeWidth={1.6} strokeDasharray="6 4" />
      {/* symbols */}
      {(["R", "L"] as Ear[]).map((ear) => (
        <g key={ear}>
          {FREQS.map((f) => {
            const t = data[ear].ac[f];
            if (!t || t.value === null) return null;
            const x = xOf(f);
            const y = yOf(t.value);
            return (
              <g key={`ac${f}`}>
                <AcSymbol x={x} y={y} ear={ear} masked={t.masked} />
                {t.nr && <Arrow x={x + (ear === "R" ? -4 : 4)} y={y + 5} ear={ear} />}
              </g>
            );
          })}
          {showBc &&
            BC_FREQS.map((f) => {
              const t = data[ear].bc[f];
              if (!t || t.value === null) return null;
              const x = xOf(f);
              const y = yOf(t.value);
              return (
                <g key={`bc${f}`}>
                  <BcSymbol x={x} y={y} ear={ear} masked={t.masked} />
                  {t.nr && <Arrow x={ear === "R" ? x - 11 : x + 11} y={y + 6} ear={ear} />}
                </g>
              );
            })}
        </g>
      ))}
      {/* legend */}
      <g transform={`translate(${PAD.l}, ${H - PAD.b + 22})`} fontSize="11" fill="#334155">
        <AcSymbol x={6} y={0} ear="R" masked={false} />
        <text x={16} y={4}>Right AC</text>
        <AcSymbol x={82} y={0} ear="R" masked={true} />
        <text x={92} y={4}>Right AC masked</text>
        <BcSymbol x={208} y={0} ear="R" masked={false} />
        <text x={204} y={4}>Right BC</text>
        <BcSymbol x={276} y={0} ear="R" masked={true} />
        <text x={272} y={4}>Right BC masked</text>
        <g transform="translate(0, 22)">
          <AcSymbol x={6} y={0} ear="L" masked={false} />
          <text x={16} y={4}>Left AC</text>
          <AcSymbol x={82} y={0} ear="L" masked={true} />
          <text x={92} y={4}>Left AC masked</text>
          <BcSymbol x={186} y={0} ear="L" masked={false} />
          <text x={204} y={4}>Left BC</text>
          <BcSymbol x={254} y={0} ear="L" masked={true} />
          <text x={272} y={4}>Left BC masked</text>
          <Arrow x={392} y={-6} ear="L" />
          <text x={408} y={4}>No response</text>
        </g>
      </g>
    </svg>
  );
});

export default AudiogramChart;

// Export an SVG element as a PNG file (white background, 2x scale).
export async function downloadSvgAsPng(svg: SVGSVGElement, filename: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not render the audiogram"));
    img.src = url;
  });
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
