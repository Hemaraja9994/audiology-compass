"use client";

import { useMemo, useRef, useState } from "react";
import AudiogramChart, { downloadSvgAsPng } from "@/components/Audiogram";
import {
  BC_FREQS,
  FREQS,
  TYMP_NORMS,
  aao1979,
  asymmetry,
  average,
  cellText,
  clarkGrade,
  emptyAudiogram,
  fletcher,
  fmtHz,
  lossType,
  ototoxChange,
  parseCell,
  tympType,
  whoGrade,
  whoOverall,
  type AsymRule,
  type Audiogram,
  type Ear,
  type OtoPoint,
  type Threshold,
  type TympNorms,
} from "@/lib/audiology";

const EAR_NAME: Record<Ear, string> = { R: "Right", L: "Left" };

function Result({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded bg-navy-light p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-navy">{value}</div>
      {note && <div className="text-xs text-slate-600">{note}</div>}
    </div>
  );
}

function num(s: string): number | null {
  if (s.trim() === "") return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

const EXAMPLE: Record<Ear, { ac: (string | null)[]; bc: (string | null)[] }> = {
  // Illustrative values only (not a real person): right ear sloping sensorineural, left ear asymmetric with a mild conductive component.
  R: { ac: ["15", "20", null, "25", null, "35", "45", "55", "60", "65"], bc: ["10", "20", null, "25", null, "30", "40", "50"] },
  L: { ac: ["35", "40", null, "45", null, "55", "65", "75", "80", "85NR"], bc: ["15", "20", null, "25", null, "40", "55", "65"] },
};

function exampleAudiogram(): Audiogram {
  const a = emptyAudiogram();
  (["R", "L"] as Ear[]).forEach((ear) => {
    FREQS.forEach((f, i) => {
      const v = EXAMPLE[ear].ac[i];
      if (v) {
        const p = parseCell(v);
        a[ear].ac[f] = { value: p.value, nr: p.nr, masked: ear === "L" && f >= 3000 };
      }
    });
    BC_FREQS.forEach((f, i) => {
      const v = EXAMPLE[ear].bc[i];
      if (v) {
        const p = parseCell(v);
        a[ear].bc[f] = { value: p.value, nr: p.nr, masked: ear === "L" };
      }
    });
  });
  return a;
}

const ASYM_PRESETS: { id: string; label: string; rule: AsymRule }[] = [
  { id: "15x2", label: "15 dB or more at two or more frequencies (0.25 to 8 kHz)", rule: { mode: "frequency", db: 15, count: 2, adjacent: false, freqs: [...FREQS] } },
  { id: "15x2adj", label: "15 dB or more at two or more adjacent frequencies (0.25 to 8 kHz)", rule: { mode: "frequency", db: 15, count: 2, adjacent: true, freqs: [...FREQS] } },
  { id: "10x2adj", label: "10 dB or more at two or more adjacent frequencies (more sensitive)", rule: { mode: "frequency", db: 10, count: 2, adjacent: true, freqs: [...FREQS] } },
  { id: "r3000", label: "15 dB or more at 3 kHz (Rule 3000; Saliba et al., 2009)", rule: { mode: "frequency", db: 15, count: 1, adjacent: false, freqs: [3000] } },
  { id: "pta4", label: "15 dB or more difference in the 0.5, 1, 2, 4 kHz average", rule: { mode: "pta", db: 15, count: 1, adjacent: false, freqs: [500, 1000, 2000, 4000] } },
];

const REM_FREQS = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000];
const OTO_CONV = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const OTO_EHF = [9000, 10000, 11200, 12500, 14000, 16000];

export default function AssessmentClient() {
  const [aud, setAud] = useState<Audiogram>(emptyAudiogram);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [testDate, setTestDate] = useState("");
  const [hfa, setHfa] = useState<number[]>([4000, 6000, 8000]);
  const [scheme, setScheme] = useState<"who" | "clark" | "both">("both");
  const [clarkBasis, setClarkBasis] = useState<"3" | "4">("3");
  const [abgCrit, setAbgCrit] = useState("15");
  const [normalLimit, setNormalLimit] = useState("25");
  const [asymId, setAsymId] = useState("15x2");
  const [srt, setSrt] = useState<Record<Ear, string>>({ R: "", L: "" });
  const [srtTol, setSrtTol] = useState("10");
  const svgRef = useRef<SVGSVGElement>(null);

  const key = (ear: Ear, kind: "ac" | "bc", f: number) => `${ear}-${kind}-${f}`;
  const setCell = (ear: Ear, kind: "ac" | "bc", f: number, text: string) => {
    setRaw((r) => ({ ...r, [key(ear, kind, f)]: text }));
    const p = parseCell(text);
    if (!p.ok) return;
    setAud((a) => {
      const next: Audiogram = structuredClone(a);
      next[ear][kind][f] = { ...next[ear][kind][f], value: p.value, nr: p.nr };
      return next;
    });
  };
  const setMasked = (ear: Ear, kind: "ac" | "bc", f: number, masked: boolean) =>
    setAud((a) => {
      const next: Audiogram = structuredClone(a);
      next[ear][kind][f] = { ...next[ear][kind][f], masked };
      return next;
    });
  const loadAud = (a: Audiogram) => {
    setAud(a);
    const r: Record<string, string> = {};
    (["R", "L"] as Ear[]).forEach((ear) => {
      FREQS.forEach((f) => (r[key(ear, "ac", f)] = cellText(a[ear].ac[f])));
      BC_FREQS.forEach((f) => (r[key(ear, "bc", f)] = cellText(a[ear].bc[f])));
    });
    setRaw(r);
  };

  const avgs = useMemo(() => {
    const out = {} as Record<Ear, { p3: ReturnType<typeof average>; p4: ReturnType<typeof average>; hf: ReturnType<typeof average>; aao: ReturnType<typeof average>; fl: number | null }>;
    (["R", "L"] as Ear[]).forEach((ear) => {
      out[ear] = {
        p3: average(aud[ear], [500, 1000, 2000]),
        p4: average(aud[ear], [500, 1000, 2000, 4000]),
        hf: average(aud[ear], hfa.length ? [...hfa].sort((a, b) => a - b) : [4000]),
        aao: average(aud[ear], [500, 1000, 2000, 3000]),
        fl: fletcher(aud[ear]),
      };
    });
    return out;
  }, [aud, hfa]);

  const asymRule = ASYM_PRESETS.find((p) => p.id === asymId)!.rule;
  const asym = useMemo(() => asymmetry(aud, asymRule), [aud, asymRule]);
  const aao = aao1979(avgs.R.aao.value, avgs.L.aao.value);
  const anyNR = (["R", "L"] as Ear[]).some((e) => avgs[e].p4.includesNR || avgs[e].p3.includesNR);

  const cellCls = (ok: boolean) => `w-14 rounded border px-1 py-0.5 text-center text-sm ${ok ? "border-slate-300" : "border-red-500 bg-red-50"}`;
  const fmt = (v: number | null) => (v === null ? "-" : `${v} dB HL`);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="h1">Assessment division</h1>
        <p className="muted mt-1 max-w-3xl">
          Calculators that run entirely in your browser. Nothing you type is sent to a server or saved. They compute
          descriptive values from results you have already measured; they do not replace calibrated testing, clinical
          interpretation or local protocols.
        </p>
      </div>

      {/* Audiogram */}
      <section className="card space-y-3">
        <div className="no-print flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="h2">Audiogram entry and plotter</h2>
            <p className="muted">
              Enter thresholds in dB HL (-10 to 130). Add NR for no response at that level, for example <code>110NR</code>.
              Tick M for a masked threshold. Leave blank if not tested.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={() => loadAud(exampleAudiogram())}>Load example</button>
            <button className="btn-outline" onClick={() => loadAud(emptyAudiogram())}>Clear</button>
          </div>
        </div>
        <div className="no-print grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="acode">Participant code (optional, no names)</label>
            <input id="acode" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. P-014" />
          </div>
          <div>
            <label className="label" htmlFor="adate">Test date (optional)</label>
            <input id="adate" type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </div>
        </div>
        <div className="no-print overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="pr-2 text-left">Hz</th>
                {FREQS.map((f) => (
                  <th key={f} className="px-1">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["R", "L"] as Ear[]).flatMap((ear) =>
                (["ac", "bc"] as const).map((kind) => (
                  <tr key={`${ear}${kind}`}>
                    <td className={`whitespace-nowrap pr-2 text-xs font-semibold ${ear === "R" ? "text-red-700" : "text-blue-700"}`}>
                      {EAR_NAME[ear]} {kind.toUpperCase()}
                    </td>
                    {FREQS.map((f) => {
                      const allowed = kind === "ac" || (BC_FREQS as readonly number[]).includes(f);
                      if (!allowed) return <td key={f} className="px-1 text-center text-xs text-slate-300">n/a</td>;
                      const k = key(ear, kind, f);
                      const text = raw[k] ?? "";
                      const t: Threshold = aud[ear][kind][f];
                      return (
                        <td key={f} className="px-1 py-0.5 text-center">
                          <input
                            aria-label={`${EAR_NAME[ear]} ${kind.toUpperCase()} ${f} Hz`}
                            className={cellCls(parseCell(text).ok)}
                            value={text}
                            onChange={(e) => setCell(ear, kind, f, e.target.value)}
                          />
                          <label className="flex items-center justify-center gap-0.5 text-[10px] text-slate-500">
                            <input type="checkbox" checked={t.masked} onChange={(e) => setMasked(ear, kind, f, e.target.checked)} /> M
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-start gap-6">
          <AudiogramChart ref={svgRef} data={aud} title={`Audiogram${code ? `: ${code}` : ""}${testDate ? ` (${testDate})` : ""}`} />
          <div className="no-print space-y-2 text-sm">
            <button className="btn w-full" onClick={() => svgRef.current && downloadSvgAsPng(svgRef.current, `audiogram${code ? `_${code.replace(/[^\w-]+/g, "_")}` : ""}.png`)}>
              Download PNG
            </button>
            <button className="btn-outline w-full" onClick={() => window.print()}>Print page</button>
            <p className="max-w-xs text-xs text-slate-500">
              Symbols follow the ASHA (1990) Guidelines for Audiometric Symbols. Colour (right red, left blue) is a
              convention, not part of the guideline. The dashed line at 20 dB HL marks the WHO 2021 normal limit.
            </p>
          </div>
        </div>
      </section>

      {/* Averages and degree */}
      <section className="card space-y-3">
        <h2 className="h2">Pure-tone averages and degree of hearing loss</h2>
        <div className="no-print flex flex-wrap items-end gap-4 text-sm">
          <div>
            <label className="label" htmlFor="scheme">Classification scheme</label>
            <select id="scheme" className="input w-72" value={scheme} onChange={(e) => setScheme(e.target.value as typeof scheme)}>
              <option value="both">Show both</option>
              <option value="who">WHO 2021 (World Report on Hearing)</option>
              <option value="clark">ASHA / Clark (1981)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cb">Average used for Clark categories</label>
            <select id="cb" className="input w-56" value={clarkBasis} onChange={(e) => setClarkBasis(e.target.value as "3" | "4")}>
              <option value="3">0.5, 1, 2 kHz</option>
              <option value="4">0.5, 1, 2, 4 kHz</option>
            </select>
          </div>
          <div>
            <span className="label">High-frequency average (definitions vary; choose yours)</span>
            <div className="flex flex-wrap gap-2">
              {[2000, 3000, 4000, 6000, 8000].map((f) => (
                <label key={f} className="flex items-center gap-1">
                  <input type="checkbox" checked={hfa.includes(f)} onChange={() => setHfa((h) => (h.includes(f) ? h.filter((x) => x !== f) : [...h, f]))} />
                  {fmtHz(f)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-1">Ear</th>
                <th className="py-1">PTA 0.5, 1, 2 kHz</th>
                <th className="py-1">PTA 0.5, 1, 2, 4 kHz</th>
                <th className="py-1">HFA {[...hfa].sort((a, b) => a - b).map(fmtHz).join(", ") || "-"}</th>
                <th className="py-1">Fletcher (best 2 of 0.5, 1, 2 kHz)</th>
                {scheme !== "clark" && <th className="py-1">WHO 2021 grade (per ear)</th>}
                {scheme !== "who" && <th className="py-1">Clark (1981) category</th>}
              </tr>
            </thead>
            <tbody>
              {(["R", "L"] as Ear[]).map((ear) => (
                <tr key={ear} className="border-b border-slate-100">
                  <td className={`py-1 font-semibold ${ear === "R" ? "text-red-700" : "text-blue-700"}`}>{EAR_NAME[ear]}</td>
                  <td className="py-1 tabular-nums">{fmt(avgs[ear].p3.value)}</td>
                  <td className="py-1 tabular-nums">{fmt(avgs[ear].p4.value)}</td>
                  <td className="py-1 tabular-nums">{fmt(avgs[ear].hf.value)}</td>
                  <td className="py-1 tabular-nums">{fmt(avgs[ear].fl)}</td>
                  {scheme !== "clark" && <td className="py-1">{whoGrade(avgs[ear].p4.value)}</td>}
                  {scheme !== "who" && <td className="py-1">{clarkGrade(clarkBasis === "3" ? avgs[ear].p3.value : avgs[ear].p4.value)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {scheme !== "clark" && (
          <Result label="WHO 2021 grade (better ear, 0.5 to 4 kHz average)" value={whoOverall(avgs.R.p4.value, avgs.L.p4.value)} />
        )}
        {anyNR && <p className="text-xs text-amber-700">One or more averages include a no-response value, so the true average is worse than shown.</p>}
        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-navy">Criteria and sources</summary>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              WHO 2021 grades use the 0.5, 1, 2 and 4 kHz average in the better ear: under 20 dB HL no hearing loss; 20 to
              under 35 mild; 35 to under 50 moderate; 50 to under 65 moderately severe; 65 to under 80 severe; 80 to under
              95 profound; 95 or more complete or total. Unilateral: under 20 dB HL in the better ear and 35 dB HL or more
              in the worse ear. Source:{" "}
              <a className="text-navy underline" href="https://www.who.int/publications/i/item/9789240020481" target="_blank" rel="noreferrer">WHO World Report on Hearing (2021)</a>.
              Per-ear grades are shown for description only.
            </li>
            <li>
              Clark (1981) categories: -10 to 15 normal, 16 to 25 slight, 26 to 40 mild, 41 to 55 moderate, 56 to 70
              moderately severe, 71 to 90 severe, 91 or more profound. Source: Clark JG. Uses and abuses of hearing loss
              classification. ASHA. 1981;23(7):493-500 (
              <a className="text-navy underline" href="https://pubmed.ncbi.nlm.nih.gov/7052898/" target="_blank" rel="noreferrer">PubMed 7052898</a>).
            </li>
            <li>Averages need every listed frequency; none are interpolated.</li>
          </ul>
        </details>
      </section>

      {/* Type of loss */}
      <section className="card space-y-3">
        <h2 className="h2">Air-bone gap and pattern of loss</h2>
        <div className="no-print flex flex-wrap gap-4 text-sm">
          <div>
            <label className="label" htmlFor="abg">Significant air-bone gap (dB, configurable)</label>
            <input id="abg" className="input w-28" inputMode="numeric" value={abgCrit} onChange={(e) => setAbgCrit(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="nl">Normal limit for averages (dB HL, configurable)</label>
            <input id="nl" className="input w-28" inputMode="numeric" value={normalLimit} onChange={(e) => setNormalLimit(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["R", "L"] as Ear[]).map((ear) => {
            const lt = lossType(aud[ear], num(abgCrit) ?? 15, num(normalLimit) ?? 25);
            return (
              <Result
                key={ear}
                label={`${EAR_NAME[ear]} ear`}
                value={lt.type}
                note={`Mean air-bone gap 0.5, 1, 2 kHz: ${lt.abg ?? "-"} dB; BC average: ${lt.bcPta ?? "-"} dB HL`}
              />
            );
          })}
        </div>
        <p className="text-xs text-slate-500">A screening description from averages only. Check masking adequacy and the full audiogram.</p>
      </section>

      {/* Asymmetry */}
      <section className="card space-y-3">
        <h2 className="h2">Interaural asymmetry check</h2>
        <div className="no-print">
          <label className="label" htmlFor="asym">Criterion (select one; all are configurable screening rules)</label>
          <select id="asym" className="input max-w-xl" value={asymId} onChange={(e) => setAsymId(e.target.value)}>
            {ASYM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="pr-2 text-left">Hz</th>
                {asym.diffs.map((d) => (
                  <th key={d.f} className="px-2">{d.f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-2 text-xs font-semibold">Right minus left (AC)</td>
                {asym.diffs.map((d) => (
                  <td key={d.f} className={`px-2 text-center tabular-nums ${d.flagged ? "font-bold text-red-700" : ""}`}>{d.diff}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className={`rounded p-3 text-sm ${asym.flagged ? "bg-red-50 text-red-800" : "bg-navy-light text-navy"}`}>
          <b>{asym.flagged ? "Asymmetry criterion met." : "Criterion not met."}</b> {asym.detail}
          {asym.flagged && " Consider referral for medical (ENT) evaluation to exclude retrocochlear pathology, according to your local protocol."}
        </div>
        <p className="text-xs text-slate-500">
          No single asymmetry definition is universally agreed; criteria differ in sensitivity and specificity. Rule 3000:
          Saliba I, Martineau G, Chagnon M. Asymmetric hearing loss: rule 3,000 for screening vestibular schwannoma.
          Otol Neurotol. 2009;30(4):515-521.{" "}
          <a className="text-navy underline" href="https://doi.org/10.1097/MAO.0b013e3181a5297a" target="_blank" rel="noreferrer">doi:10.1097/MAO.0b013e3181a5297a</a>.
          Other presets are commonly used rules offered as configurable options, not attributed to a single guideline.
        </p>
      </section>

      {/* SRT-PTA */}
      <section className="card space-y-3">
        <h2 className="h2">SRT and PTA agreement</h2>
        <div className="no-print flex flex-wrap gap-4 text-sm">
          {(["R", "L"] as Ear[]).map((ear) => (
            <div key={ear}>
              <label className="label" htmlFor={`srt${ear}`}>{EAR_NAME[ear]} SRT (dB HL)</label>
              <input id={`srt${ear}`} className="input w-28" inputMode="numeric" value={srt[ear]} onChange={(e) => setSrt({ ...srt, [ear]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="tol">Agreement tolerance (+/- dB, configurable)</label>
            <input id="tol" className="input w-28" inputMode="numeric" value={srtTol} onChange={(e) => setSrtTol(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["R", "L"] as Ear[]).map((ear) => {
            const s = num(srt[ear]);
            const p = avgs[ear].p3.value;
            const fl = avgs[ear].fl;
            const tol = num(srtTol) ?? 10;
            if (s === null || p === null) return <Result key={ear} label={`${EAR_NAME[ear]} ear`} value="-" note="Enter SRT and thresholds at 0.5, 1, 2 kHz." />;
            const d = Math.round((s - p) * 10) / 10;
            const dFl = fl === null ? null : Math.round((s - fl) * 10) / 10;
            const ok = Math.abs(d) <= tol;
            return (
              <Result
                key={ear}
                label={`${EAR_NAME[ear]} ear`}
                value={ok ? "Agrees with PTA" : "Poor agreement"}
                note={`SRT minus 3-frequency PTA: ${d} dB${dFl !== null ? `; SRT minus Fletcher average: ${dFl} dB` : ""}. Tolerance +/- ${tol} dB.`}
              />
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          Poor agreement can reflect instructions or reliability, a steeply sloping audiogram (compare with the Fletcher
          two-frequency average) or non-organic hearing loss. Recheck before interpreting.
        </p>
      </section>

      {/* AAO 1979 */}
      <section className="card space-y-3">
        <h2 className="h2">Percentage hearing handicap (AAO-1979 formula)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Result label="Right monaural" value={aao.right === null ? "-" : `${aao.right}%`} note={`PTA 0.5, 1, 2, 3 kHz: ${fmt(avgs.R.aao.value)}`} />
          <Result label="Left monaural" value={aao.left === null ? "-" : `${aao.left}%`} note={`PTA 0.5, 1, 2, 3 kHz: ${fmt(avgs.L.aao.value)}`} />
          <Result label="Binaural (5:1 weighting)" value={aao.binaural === null ? "-" : `${aao.binaural}%`} note="(5 x better ear + worse ear) / 6" />
        </div>
        <p className="text-xs text-slate-500">
          Monaural impairment = 1.5% for every dB that the 0.5, 1, 2, 3 kHz average exceeds 25 dB HL (0% at 25 dB HL or
          better, 100% at 92 dB HL or worse). Source: American Academy of Otolaryngology Committee on Hearing and
          Equilibrium and American Council of Otolaryngology. Guide for the evaluation of hearing handicap. JAMA.
          1979;241(19):2055-2059.{" "}
          <a className="text-navy underline" href="https://doi.org/10.1001/jama.1979.03290450053025" target="_blank" rel="noreferrer">doi:10.1001/jama.1979.03290450053025</a>.
          Disability certification uses country-specific rules (for example notified guidelines in India); this value is
          for education and research only.
        </p>
      </section>

      <TympSection />
      <OtoSection />
      <RemSection />

      <section className="card space-y-2">
        <h2 className="h2">Questionnaires</h2>
        <p className="text-sm text-slate-700">
          Questionnaire items (for example HHIE, THI, TFI, DHI, APHAB, SSQ or COSI) are copyrighted and are not reproduced
          here. Administer and score them with licensed forms, then record the total score in the Outcomes division to
          track change over time.
        </p>
      </section>
    </div>
  );
}

function TympSection() {
  const [age, setAge] = useState<"adult" | "child">("adult");
  const [norms, setNorms] = useState<Record<"adult" | "child", TympNorms>>(TYMP_NORMS);
  const [vals, setVals] = useState<Record<Ear, { tpp: string; ytm: string; ecv: string; noPeak: boolean }>>({
    R: { tpp: "", ytm: "", ecv: "", noPeak: false },
    L: { tpp: "", ytm: "", ecv: "", noPeak: false },
  });
  const n = norms[age];
  const setN = (k: keyof TympNorms, v: string) => {
    const x = num(v);
    if (x === null) return;
    setNorms((all) => ({ ...all, [age]: { ...all[age], [k]: x } }));
  };
  return (
    <section className="card space-y-3">
      <h2 className="h2">Tympanogram type helper (226 Hz probe)</h2>
      <div className="no-print flex flex-wrap items-end gap-4 text-sm">
        <div>
          <label className="label" htmlFor="tage">Age group</label>
          <select id="tage" className="input w-56" value={age} onChange={(e) => setAge(e.target.value as "adult" | "child")}>
            <option value="adult">Adult</option>
            <option value="child">Child (about 3 to 10 years)</option>
          </select>
        </div>
        {(
          [
            ["ytmLow", "Admittance low (mL)"],
            ["ytmHigh", "Admittance high (mL)"],
            ["ecvLow", "Volume low (mL)"],
            ["ecvHigh", "Volume high (mL)"],
            ["tppLow", "Pressure low (daPa)"],
            ["tppHigh", "Pressure high (daPa)"],
          ] as [keyof TympNorms, string][]
        ).map(([k, l]) => (
          <div key={k}>
            <label className="label" htmlFor={`n${k}`}>{l}</label>
            <input id={`n${k}`} key={`${age}${k}`} className="input w-24" defaultValue={n[k]} onBlur={(e) => setN(k, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(["R", "L"] as Ear[]).map((ear) => {
          const v = vals[ear];
          const r = tympType(v.noPeak, num(v.tpp), num(v.ytm), num(v.ecv), n);
          const upd = (patch: Partial<typeof v>) => setVals({ ...vals, [ear]: { ...v, ...patch } });
          return (
            <div key={ear} className="space-y-2">
              <div className={`text-sm font-semibold ${ear === "R" ? "text-red-700" : "text-blue-700"}`}>{EAR_NAME[ear]} ear</div>
              <div className="no-print grid grid-cols-3 gap-2">
                <div>
                  <label className="label" htmlFor={`tpp${ear}`}>Peak pressure (daPa)</label>
                  <input id={`tpp${ear}`} className="input" disabled={v.noPeak} value={v.tpp} onChange={(e) => upd({ tpp: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor={`ytm${ear}`}>Peak admittance (mL)</label>
                  <input id={`ytm${ear}`} className="input" disabled={v.noPeak} value={v.ytm} onChange={(e) => upd({ ytm: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor={`ecv${ear}`}>Ear canal volume (mL)</label>
                  <input id={`ecv${ear}`} className="input" value={v.ecv} onChange={(e) => upd({ ecv: e.target.value })} />
                </div>
              </div>
              <label className="no-print flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={v.noPeak} onChange={(e) => upd({ noPeak: e.target.checked })} /> No peak (flat trace)
              </label>
              <Result label="Jerger type" value={r.type} note={r.note} />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Types follow Jerger J. Clinical experience with impedance audiometry. Arch Otolaryngol. 1970;92(4):311-324 (
        <a className="text-navy underline" href="https://doi.org/10.1001/archotol.1970.04310040005002" target="_blank" rel="noreferrer">doi:10.1001/archotol.1970.04310040005002</a>).
        The default ranges are typical values offered as a starting point, not published norms; replace them with your
        equipment and clinic norms. Infants under about 6 months need a 1000 Hz probe tone, which this helper does not
        cover.
      </p>
    </section>
  );
}

function OtoSection() {
  const [ehf, setEhf] = useState(false);
  const freqs = useMemo(() => (ehf ? [...OTO_CONV, ...OTO_EHF] : OTO_CONV), [ehf]);
  const [ear, setEar] = useState<Ear>("R");
  const [raw, setRaw] = useState<Record<string, string>>({});
  const pts = useMemo(() => {
    const out: Record<number, OtoPoint> = {};
    for (const f of freqs) {
      const b = parseCell(raw[`${ear}-b-${f}`] ?? "");
      const u = parseCell(raw[`${ear}-f-${f}`] ?? "");
      out[f] = { base: { value: b.ok ? b.value : null, nr: b.nr, masked: false }, follow: { value: u.ok ? u.value : null, nr: u.nr, masked: false } };
    }
    return out;
  }, [raw, ear, freqs]);
  const res = ototoxChange(freqs, pts);
  return (
    <section className="card space-y-3">
      <h2 className="h2">Ototoxicity monitoring: change from baseline</h2>
      <div className="no-print flex flex-wrap items-end gap-4 text-sm">
        <div>
          <label className="label" htmlFor="oear">Ear</label>
          <select id="oear" className="input w-32" value={ear} onChange={(e) => setEar(e.target.value as Ear)}>
            <option value="R">Right</option>
            <option value="L">Left</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={ehf} onChange={(e) => setEhf(e.target.checked)} /> Include extended high frequencies (9 to 16 kHz)
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="pr-2 text-left">Hz</th>
              {freqs.map((f) => (
                <th key={f} className="px-1">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["b", "f"] as const).map((row) => (
              <tr key={row}>
                <td className="pr-2 text-xs font-semibold">{row === "b" ? "Baseline" : "Follow-up"}</td>
                {freqs.map((f) => {
                  const k = `${ear}-${row}-${f}`;
                  const t = raw[k] ?? "";
                  return (
                    <td key={f} className="px-1 py-0.5">
                      <input aria-label={`${row === "b" ? "Baseline" : "Follow-up"} ${f} Hz`} className={`w-14 rounded border px-1 py-0.5 text-center text-sm ${parseCell(t).ok ? "border-slate-300" : "border-red-500 bg-red-50"}`} value={t} onChange={(e) => setRaw({ ...raw, [k]: e.target.value })} />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="pr-2 text-xs font-semibold">Shift (dB)</td>
              {res.rows.map((r) => (
                <td key={r.f} className={`px-1 text-center tabular-nums ${r.shift !== null && r.shift >= 10 ? "font-bold text-red-700" : ""}`}>
                  {r.lostResponse ? "lost" : r.shift ?? "-"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className={`rounded p-3 text-sm ${res.met ? "bg-red-50 text-red-800" : "bg-navy-light text-navy"}`}>
        <b>{res.met ? "ASHA change criterion met." : "No ASHA change criterion met."}</b>
        {res.a.length > 0 && <> (a) 20 dB or more at {res.a.map(fmtHz).join(", ")} Hz.</>}
        {res.b.length > 0 && <> (b) 10 dB or more at adjacent {res.b.map((p) => p.map(fmtHz).join("+")).join("; ")} Hz.</>}
        {res.c.length > 0 && <> (c) Loss of response at {res.c.map((p) => p.map(fmtHz).join("+")).join("; ")} Hz.</>}
        {res.met && " Confirm by retest (ASHA recommends confirming a change) and inform the treating team."}
      </div>
      <p className="text-xs text-slate-500">
        Criteria relative to baseline: (a) 20 dB or more decrease at any one test frequency, (b) 10 dB or more decrease at
        any two adjacent test frequencies, or (c) loss of response at three consecutive test frequencies where responses
        were previously obtained. Adjacency is judged along the frequencies listed here. Source: American
        Speech-Language-Hearing Association (1994).{" "}
        <a className="text-navy underline" href="https://www.asha.org/policy/gl1994-00003/" target="_blank" rel="noreferrer">
          Audiologic Management of Individuals Receiving Cochleotoxic Drug Therapy
        </a>
        . Use NR (for example <code>100NR</code>) for no response.
      </p>
    </section>
  );
}

function RemSection() {
  const [ear, setEar] = useState<Ear>("R");
  const [level, setLevel] = useState("65");
  const [tolLow, setTolLow] = useState("5");
  const [tolHigh, setTolHigh] = useState("8");
  const [raw, setRaw] = useState<Record<string, string>>({});
  const rows = REM_FREQS.map((f) => {
    const t = num(raw[`${ear}-${level}-t-${f}`] ?? "");
    const m = num(raw[`${ear}-${level}-m-${f}`] ?? "");
    const d = t !== null && m !== null ? Math.round((m - t) * 10) / 10 : null;
    const tol = f <= 2000 ? num(tolLow) ?? 5 : num(tolHigh) ?? 8;
    return { f, t, m, d, tol, out: d !== null && Math.abs(d) > tol };
  });
  const core = rows.filter((r) => r.f >= 500 && r.f <= 4000 && r.d !== null);
  const mad = core.length ? Math.round((core.reduce((s, r) => s + Math.abs(r.d as number), 0) / core.length) * 10) / 10 : null;
  const rms = core.length ? Math.round(Math.sqrt(core.reduce((s, r) => s + (r.d as number) ** 2, 0) / core.length) * 10) / 10 : null;
  return (
    <section className="card space-y-3">
      <h2 className="h2">Hearing aid fitting check: real-ear measured vs target</h2>
      <div className="no-print flex flex-wrap items-end gap-4 text-sm">
        <div>
          <label className="label" htmlFor="rear">Ear</label>
          <select id="rear" className="input w-32" value={ear} onChange={(e) => setEar(e.target.value as Ear)}>
            <option value="R">Right</option>
            <option value="L">Left</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="rlev">Input level</label>
          <select id="rlev" className="input w-48" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="50">Soft (about 50 dB SPL)</option>
            <option value="65">Average (about 65 dB SPL)</option>
            <option value="80">Loud (about 80 dB SPL)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tl">Tolerance 0.25 to 2 kHz (+/- dB)</label>
          <input id="tl" className="input w-24" value={tolLow} onChange={(e) => setTolLow(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="th">Tolerance 3 to 6 kHz (+/- dB)</label>
          <input id="th" className="input w-24" value={tolHigh} onChange={(e) => setTolHigh(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="pr-2 text-left">Hz</th>
              {REM_FREQS.map((f) => (
                <th key={f} className="px-1">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["t", "m"] as const).map((row) => (
              <tr key={row}>
                <td className="pr-2 text-xs font-semibold">{row === "t" ? "Target (dB SPL)" : "Measured (dB SPL)"}</td>
                {REM_FREQS.map((f) => {
                  const k = `${ear}-${level}-${row}-${f}`;
                  return (
                    <td key={f} className="px-1 py-0.5">
                      <input aria-label={`${row === "t" ? "Target" : "Measured"} ${f} Hz`} className="w-14 rounded border border-slate-300 px-1 py-0.5 text-center text-sm" value={raw[k] ?? ""} onChange={(e) => setRaw({ ...raw, [k]: e.target.value })} />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="pr-2 text-xs font-semibold">Measured minus target</td>
              {rows.map((r) => (
                <td key={r.f} className={`px-1 text-center tabular-nums ${r.out ? "font-bold text-red-700" : ""}`}>{r.d ?? "-"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Result label="Frequencies outside tolerance" value={rows.filter((r) => r.out).map((r) => fmtHz(r.f)).join(", ") || "none"} />
        <Result label="Mean absolute deviation 0.5 to 4 kHz" value={mad === null ? "-" : `${mad} dB`} />
        <Result label="RMS error 0.5 to 4 kHz" value={rms === null ? "-" : `${rms} dB`} />
      </div>
      <p className="text-xs text-slate-500">
        Works with any prescription target (for example NAL-NL2 or DSL v5) entered as real-ear aided response (REAR) or
        insertion gain, as long as target and measured values use the same measure. Tolerances are configurable; the
        defaults are a commonly used starting point, so set them to your local protocol. Values are kept per ear and
        input level on this page only.
      </p>
    </section>
  );
}
