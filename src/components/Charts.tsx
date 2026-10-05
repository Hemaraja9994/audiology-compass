"use client";

// Dependency-free SVG/HTML charts.

export function BarList({
  data,
  max,
  highlight,
  emptyText = "No data",
}: {
  data: { label: string; value: number; sub?: string }[];
  max?: number;
  highlight?: string;
  emptyText?: string;
}) {
  if (data.length === 0) return <p className="muted">{emptyText}</p>;
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-1.5">
      {data.map((d) => (
        <li key={d.label} className="text-sm">
          <div className="flex justify-between gap-2">
            <span className={`truncate ${d.label === highlight ? "font-bold text-plum" : ""}`} title={d.label}>
              {d.label}
            </span>
            <span className="shrink-0 tabular-nums text-stone-700">
              {d.value}
              {d.sub ? <span className="text-stone-500"> {d.sub}</span> : null}
            </span>
          </div>
          <div className="mt-0.5 h-2 w-full rounded bg-stone-100">
            <div
              className={`h-2 rounded ${d.label === highlight ? "bg-amber-500" : "bg-plum"}`}
              style={{ width: `${(d.value / m) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LineChart({
  points,
  height = 220,
  yLabel,
}: {
  points: { x: string; y: number }[];
  height?: number;
  yLabel?: string;
}) {
  if (points.length === 0) return <p className="muted">No data points yet.</p>;
  const W = 640;
  const H = height;
  const pad = { l: 48, r: 16, t: 16, b: 40 };
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  lo -= span * 0.1;
  hi += span * 0.1;
  const xAt = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (points.length - 1));
  const yAt = (v: number) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo);
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(" ");
  const step = Math.ceil(points.length / 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Progress line chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} stroke="#e2e8f0" />
          <text x={pad.l - 6} y={yAt(t) + 4} fontSize="11" textAnchor="end" fill="#475569">
            {Math.round(t * 10) / 10}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#5b2a6e" strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xAt(i)} cy={yAt(p.y)} r="4" fill="#5b2a6e" />
          {i % step === 0 && (
            <text x={xAt(i)} y={H - pad.b + 16} fontSize="10" textAnchor="middle" fill="#475569">
              {p.x}
            </text>
          )}
        </g>
      ))}
      {yLabel && (
        <text x={12} y={H / 2} fontSize="11" fill="#475569" transform={`rotate(-90 12 ${H / 2})`} textAnchor="middle">
          {yLabel}
        </text>
      )}
    </svg>
  );
}

export function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-plum tabular-nums">{value}</div>
      {note && <div className="mt-0.5 text-xs text-stone-500">{note}</div>}
    </div>
  );
}

const SERIES_COLOURS = ["#5b2a6e", "#c2410c", "#15803d", "#0e7490", "#be123c", "#a16207"];

// Multi-series line chart over a shared x axis (session numbers). Missing points are skipped.
export function MultiLineChart({
  xs,
  series,
  height = 240,
  yLabel,
  invertY = false,
}: {
  xs: number[];
  series: { name: string; points: { x: number; y: number }[] }[];
  height?: number;
  yLabel?: string;
  invertY?: boolean;
}) {
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  if (all.length === 0 || xs.length === 0) return <p className="muted">No data points yet.</p>;
  const W = 640;
  const H = height;
  const pad = { l: 48, r: 16, t: 16, b: 40 };
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  lo -= span * 0.1;
  hi += span * 0.1;
  const xi = new Map(xs.map((x, i) => [x, i]));
  const xAt = (x: number) => {
    const i = xi.get(x) ?? 0;
    return pad.l + (xs.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (xs.length - 1));
  };
  const frac = (v: number) => (hi - v) / (hi - lo);
  const yAt = (v: number) => pad.t + (invertY ? 1 - frac(v) : frac(v)) * (H - pad.t - pad.b);
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const step = Math.ceil(xs.length / 12);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Progress chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={yAt(t)} y2={yAt(t)} stroke="#e2e8f0" />
            <text x={pad.l - 6} y={yAt(t) + 4} fontSize="11" textAnchor="end" fill="#475569">
              {Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        {xs.map((x, i) =>
          i % step === 0 ? (
            <text key={x} x={xAt(x)} y={H - pad.b + 16} fontSize="10" textAnchor="middle" fill="#475569">
              S{x}
            </text>
          ) : null,
        )}
        {series.map((s, si) => {
          const c = SERIES_COLOURS[si % SERIES_COLOURS.length];
          const pts = [...s.points].sort((a, b) => (xi.get(a.x) ?? 0) - (xi.get(b.x) ?? 0));
          const d = pts.map((p, i) => `${i ? "L" : "M"}${xAt(p.x).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(" ");
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={c} strokeWidth="2.5" strokeDasharray={si % 2 ? "6 4" : undefined} />
              {pts.map((p) => (
                <circle key={p.x} cx={xAt(p.x)} cy={yAt(p.y)} r="4" fill={c} />
              ))}
            </g>
          );
        })}
        {yLabel && (
          <text x={12} y={H / 2} fontSize="11" fill="#475569" transform={`rotate(-90 12 ${H / 2})`} textAnchor="middle">
            {yLabel}
          </text>
        )}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs">
        {series.map((s, si) => (
          <span key={s.name} className="flex items-center gap-1">
            <span className="inline-block h-1 w-5" style={{ background: SERIES_COLOURS[si % SERIES_COLOURS.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
