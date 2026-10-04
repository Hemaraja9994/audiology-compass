// Pure audiology calculations used by the Assessment division. No data leaves the browser.
// Every rule here is transparent and labelled in the UI with its source or as configurable.

export const FREQS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;
export const BC_FREQS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000] as const;
export type Ear = "R" | "L";

export interface Threshold {
  value: number | null; // dB HL
  nr: boolean; // no response at this level (maximum output)
  masked: boolean;
}

export interface EarData {
  ac: Record<number, Threshold>;
  bc: Record<number, Threshold>;
}
export type Audiogram = Record<Ear, EarData>;

export const EMPTY_T: Threshold = { value: null, nr: false, masked: false };

export function emptyAudiogram(): Audiogram {
  const ear = (): EarData => ({
    ac: Object.fromEntries(FREQS.map((f) => [f, { ...EMPTY_T }])),
    bc: Object.fromEntries(BC_FREQS.map((f) => [f, { ...EMPTY_T }])),
  });
  return { R: ear(), L: ear() };
}

// Parse a cell such as "35", "-5", "100NR" or "NR 100".
export function parseCell(raw: string): { value: number | null; nr: boolean; ok: boolean } {
  const t = raw.trim();
  if (!t) return { value: null, nr: false, ok: true };
  const m = t.match(/^(?:(nr)\s*)?(-?\d{1,3})(?:\s*(nr))?$/i);
  if (!m) return { value: null, nr: false, ok: false };
  const v = parseInt(m[2], 10);
  if (v < -10 || v > 130) return { value: null, nr: false, ok: false };
  return { value: v, nr: Boolean(m[1] || m[3]), ok: true };
}

export function cellText(t: Threshold | undefined): string {
  if (!t || t.value === null) return "";
  return `${t.value}${t.nr ? "NR" : ""}`;
}

export interface Average {
  value: number | null;
  missing: number[];
  includesNR: boolean;
}

export function average(ear: EarData, freqs: readonly number[], kind: "ac" | "bc" = "ac"): Average {
  const missing: number[] = [];
  let sum = 0;
  let nr = false;
  for (const f of freqs) {
    const t = ear[kind][f];
    if (!t || t.value === null) missing.push(f);
    else {
      sum += t.value;
      if (t.nr) nr = true;
    }
  }
  return { value: missing.length ? null : Math.round((sum / freqs.length) * 10) / 10, missing, includesNR: nr };
}

// Fletcher two-frequency average: mean of the best (lowest) two of 0.5, 1 and 2 kHz.
export function fletcher(ear: EarData): number | null {
  const v = [500, 1000, 2000].map((f) => ear.ac[f]?.value).filter((x): x is number => typeof x === "number");
  if (v.length < 3) return null;
  v.sort((a, b) => a - b);
  return (v[0] + v[1]) / 2;
}

// WHO World Report on Hearing (2021): grades based on the 0.5, 1, 2, 4 kHz average in the better ear.
export const WHO_GRADES: { label: string; min: number; max: number }[] = [
  { label: "No hearing loss (normal)", min: -Infinity, max: 20 },
  { label: "Mild hearing loss", min: 20, max: 35 },
  { label: "Moderate hearing loss", min: 35, max: 50 },
  { label: "Moderately severe hearing loss", min: 50, max: 65 },
  { label: "Severe hearing loss", min: 65, max: 80 },
  { label: "Profound hearing loss", min: 80, max: 95 },
  { label: "Complete or total hearing loss", min: 95, max: Infinity },
];

export function whoGrade(pta: number | null): string {
  if (pta === null) return "-";
  return WHO_GRADES.find((g) => pta >= g.min && pta < g.max)?.label ?? "-";
}

export function whoOverall(r: number | null, l: number | null): string {
  if (r === null || l === null) return "Need 0.5, 1, 2 and 4 kHz in both ears";
  const better = Math.min(r, l);
  const worse = Math.max(r, l);
  if (better < 20 && worse >= 35) return "Unilateral hearing loss (better ear under 20 dB HL, worse ear 35 dB HL or more)";
  return whoGrade(better);
}

// Clark (1981) categories as used by ASHA.
export const CLARK_GRADES: { label: string; max: number }[] = [
  { label: "Normal (-10 to 15 dB HL)", max: 15 },
  { label: "Slight (16 to 25 dB HL)", max: 25 },
  { label: "Mild (26 to 40 dB HL)", max: 40 },
  { label: "Moderate (41 to 55 dB HL)", max: 55 },
  { label: "Moderately severe (56 to 70 dB HL)", max: 70 },
  { label: "Severe (71 to 90 dB HL)", max: 90 },
  { label: "Profound (91 dB HL or more)", max: Infinity },
];

export function clarkGrade(pta: number | null): string {
  if (pta === null) return "-";
  return CLARK_GRADES.find((g) => pta <= g.max)?.label ?? "-";
}

// Type of loss from the air-bone gap (configurable screening description, not a diagnosis).
export function lossType(ear: EarData, abgCriterion: number, normalLimit: number): { type: string; abg: number | null; bcPta: number | null } {
  const ac = average(ear, [500, 1000, 2000]);
  const bc = average(ear, [500, 1000, 2000], "bc");
  if (ac.value === null) return { type: "-", abg: null, bcPta: bc.value };
  if (bc.value === null) return { type: ac.value <= normalLimit ? "Within the normal limit (AC)" : "Enter bone conduction at 0.5, 1, 2 kHz", abg: null, bcPta: null };
  const mean = (k: "ac" | "bc") => [500, 1000, 2000].reduce((t, f) => t + (ear[k][f].value as number), 0) / 3;
  const abg = Math.round((mean("ac") - mean("bc")) * 10) / 10;
  if (ac.value <= normalLimit && abg < abgCriterion) return { type: "Within the normal limit", abg, bcPta: bc.value };
  if (abg >= abgCriterion) return { type: bc.value <= normalLimit ? "Conductive pattern" : "Mixed pattern", abg, bcPta: bc.value };
  return { type: "Sensorineural pattern", abg, bcPta: bc.value };
}

// Interaural asymmetry check. Criteria are configurable; presets are labelled in the UI.
export interface AsymRule {
  mode: "frequency" | "pta";
  db: number;
  count: number;
  adjacent: boolean;
  freqs: number[];
}

export interface AsymResult {
  diffs: { f: number; diff: number; flagged: boolean }[];
  flagged: boolean;
  detail: string;
}

export function asymmetry(a: Audiogram, rule: AsymRule): AsymResult {
  const tested = rule.freqs.filter((f) => a.R.ac[f]?.value != null && a.L.ac[f]?.value != null);
  const diffs = tested.map((f) => {
    const diff = (a.R.ac[f].value as number) - (a.L.ac[f].value as number);
    return { f, diff, flagged: Math.abs(diff) >= rule.db };
  });
  if (rule.mode === "pta") {
    const r = average(a.R, rule.freqs).value;
    const l = average(a.L, rule.freqs).value;
    if (r === null || l === null) return { diffs, flagged: false, detail: "Need all selected frequencies in both ears." };
    const d = Math.round(Math.abs(r - l) * 10) / 10;
    return { diffs, flagged: d >= rule.db, detail: `Interaural difference in the average: ${d} dB (criterion ${rule.db} dB or more).` };
  }
  let flagged = false;
  if (rule.adjacent) {
    let run = 0;
    for (const d of diffs) {
      run = d.flagged ? run + 1 : 0;
      if (run >= rule.count) flagged = true;
    }
  } else {
    flagged = diffs.filter((d) => d.flagged).length >= rule.count;
  }
  const n = diffs.filter((d) => d.flagged).length;
  return {
    diffs,
    flagged,
    detail: `${n} frequency(ies) with an interaural difference of ${rule.db} dB or more (needed: ${rule.count}${rule.adjacent ? " adjacent" : ""}). ${tested.length} frequencies compared.`,
  };
}

// AAO-1979 percentage hearing handicap. Monaural: 1.5% for every dB that the 0.5, 1, 2, 3 kHz
// average exceeds 25 dB HL (maximum 100%). Binaural: (5 x better ear + worse ear) / 6.
export function aao1979(r: number | null, l: number | null) {
  const mono = (p: number | null) => (p === null ? null : Math.round(Math.min(100, Math.max(0, (p - 25) * 1.5)) * 10) / 10);
  const mr = mono(r);
  const ml = mono(l);
  const bin = mr === null || ml === null ? null : Math.round(((5 * Math.min(mr, ml) + Math.max(mr, ml)) / 6) * 10) / 10;
  return { right: mr, left: ml, binaural: bin };
}

// Tympanogram helper (226 Hz probe). Ranges are typical values and are editable in the UI.
export interface TympNorms {
  ytmLow: number;
  ytmHigh: number;
  ecvLow: number;
  ecvHigh: number;
  tppLow: number;
  tppHigh: number;
}

export const TYMP_NORMS: Record<"adult" | "child", TympNorms> = {
  adult: { ytmLow: 0.3, ytmHigh: 1.7, ecvLow: 0.6, ecvHigh: 1.5, tppLow: -100, tppHigh: 50 },
  child: { ytmLow: 0.25, ytmHigh: 1.05, ecvLow: 0.3, ecvHigh: 0.9, tppLow: -100, tppHigh: 50 },
};

export function tympType(noPeak: boolean, tpp: number | null, ytm: number | null, ecv: number | null, n: TympNorms): { type: string; note: string } {
  if (noPeak) {
    if (ecv === null) return { type: "Type B (flat)", note: "Enter ear canal volume to interpret a flat trace." };
    if (ecv > n.ecvHigh) return { type: "Type B, large volume", note: "Volume above the typical range: consider tympanic membrane perforation or a patent ventilation tube." };
    if (ecv < n.ecvLow) return { type: "Type B, small volume", note: "Volume below the typical range: consider canal occlusion (for example wax) or the probe against the canal wall. Recheck the probe fit." };
    return { type: "Type B, normal volume", note: "Flat trace with typical volume: consistent with middle ear effusion or a non-mobile tympanic membrane." };
  }
  if (tpp === null || ytm === null) return { type: "-", note: "Enter peak pressure and peak admittance, or tick No peak." };
  if (tpp < n.tppLow) return { type: "Type C", note: `Peak pressure more negative than ${n.tppLow} daPa: consistent with negative middle ear pressure (Eustachian tube dysfunction).` };
  const posNote = tpp > n.tppHigh ? ` Peak pressure above +${n.tppHigh} daPa (positive pressure), which is sometimes seen in early acute otitis media.` : "";
  if (ytm < n.ytmLow) return { type: "Type As", note: `Normal pressure with reduced admittance: consistent with a stiff middle ear system (for example otosclerosis or tympanosclerosis).${posNote}` };
  if (ytm > n.ytmHigh) return { type: "Type Ad", note: `Normal pressure with high admittance: consistent with a flaccid system (for example ossicular discontinuity or a monomeric tympanic membrane).${posNote}` };
  return { type: "Type A", note: `Pressure and admittance within the typical ranges.${posNote}` };
}

// ASHA (1994) criteria for a decrease in hearing during ototoxicity monitoring, relative to baseline:
// (a) 20 dB or more at any one frequency, (b) 10 dB or more at any two adjacent frequencies,
// (c) loss of response at three consecutive frequencies where responses were previously obtained.
export interface OtoPoint {
  base: Threshold;
  follow: Threshold;
}

export function ototoxChange(freqs: number[], pts: Record<number, OtoPoint>) {
  const rows = freqs.map((f) => {
    const p = pts[f];
    const b = p?.base;
    const fu = p?.follow;
    const both = b?.value != null && fu?.value != null;
    const shift = both ? (fu!.value as number) - (b!.value as number) : null;
    const lostResponse = Boolean(b && b.value != null && !b.nr && fu && fu.nr);
    return { f, shift, lostResponse, compared: both };
  });
  const a = rows.filter((r) => r.shift !== null && r.shift >= 20).map((r) => r.f);
  const bHits: number[][] = [];
  const cHits: number[][] = [];
  for (let i = 1; i < rows.length; i++) {
    const x = rows[i - 1];
    const y = rows[i];
    if (x.shift !== null && y.shift !== null && x.shift >= 10 && y.shift >= 10) bHits.push([x.f, y.f]);
  }
  for (let i = 2; i < rows.length; i++) {
    if (rows[i - 2].lostResponse && rows[i - 1].lostResponse && rows[i].lostResponse) cHits.push([rows[i - 2].f, rows[i - 1].f, rows[i].f]);
  }
  return { rows, a, b: bHits, c: cHits, met: a.length > 0 || bHits.length > 0 || cHits.length > 0 };
}

export function fmtHz(f: number): string {
  return f >= 1000 ? `${f / 1000}k` : String(f);
}
