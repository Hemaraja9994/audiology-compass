"use client";

import { useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { MultiLineChart } from "@/components/Charts";
import { downloadText, toCsv } from "@/lib/csv";

interface Entry {
  id: string;
  code: string;
  measure: string;
  unit: string;
  ear: string;
  condition: string;
  session: number;
  date: string;
  value: number;
  notes: string;
}

const EARS = ["Right", "Left", "Both ears", "Sound field", "Not applicable"];
const CONDITIONS = ["Unaided", "Aided (hearing aid)", "Cochlear implant", "Bimodal (CI + hearing aid)", "Bone conduction device", "Not applicable"];

// Preset measures. Questionnaire entries record TOTAL scores only; no items are reproduced.
const PRESETS: { measure: string; unit: string; lowerIsBetter?: boolean }[] = [
  { measure: "Pure-tone average 0.5 to 4 kHz", unit: "dB HL", lowerIsBetter: true },
  { measure: "Sound-field threshold average", unit: "dB HL", lowerIsBetter: true },
  { measure: "Word recognition in quiet", unit: "%" },
  { measure: "Speech in noise: SNR for 50% correct", unit: "dB SNR", lowerIsBetter: true },
  { measure: "Speech in noise: percent correct", unit: "%" },
  { measure: "Questionnaire total: HHIE", unit: "points", lowerIsBetter: true },
  { measure: "Questionnaire total: THI", unit: "points", lowerIsBetter: true },
  { measure: "Questionnaire total: TFI", unit: "points", lowerIsBetter: true },
  { measure: "Questionnaire total: DHI", unit: "points", lowerIsBetter: true },
  { measure: "Questionnaire total: APHAB global", unit: "% problems", lowerIsBetter: true },
  { measure: "Questionnaire total: SSQ average", unit: "points" },
  { measure: "Hearing aid data logging", unit: "hours/day" },
  { measure: "Tinnitus intrusiveness rating", unit: "0 to 10", lowerIsBetter: true },
];

const CODE_RE = /^[A-Za-z0-9_-]{1,20}$/;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OutcomesClient() {
  const [entries, setEntries, hydrated] = useLocalStorage<Entry[]>("acomp.outcomes", []);
  const [code, setCode] = useState("");
  const [measure, setMeasure] = useState("");
  const [unit, setUnit] = useState("");
  const [ear, setEar] = useState("Both ears");
  const [condition, setCondition] = useState("Aided (hearing aid)");
  const [session, setSession] = useState("");
  const [date, setDate] = useState(today);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [viewCode, setViewCode] = useState("");
  const [viewMeasure, setViewMeasure] = useState("");
  const [viewEar, setViewEar] = useState("");

  const codes = useMemo(() => Array.from(new Set(entries.map((e) => e.code))).sort(), [entries]);
  const vc = viewCode || codes[0] || "";
  const measuresForCode = useMemo(() => Array.from(new Set(entries.filter((e) => e.code === vc).map((e) => e.measure))).sort(), [entries, vc]);
  const vm = measuresForCode.includes(viewMeasure) ? viewMeasure : measuresForCode[0] || "";
  const earsFor = useMemo(() => Array.from(new Set(entries.filter((e) => e.code === vc && e.measure === vm).map((e) => e.ear))), [entries, vc, vm]);
  const ve = viewEar === "All" || earsFor.includes(viewEar) ? viewEar : earsFor[0] || "All";
  const rows = useMemo(
    () =>
      entries
        .filter((e) => e.code === vc && e.measure === vm && (ve === "All" || e.ear === ve))
        .sort((a, b) => a.session - b.session || a.date.localeCompare(b.date)),
    [entries, vc, vm, ve],
  );
  const chart = useMemo(() => {
    const xs = Array.from(new Set(rows.map((r) => r.session))).sort((a, b) => a - b);
    const groups = new Map<string, { x: number; y: number }[]>();
    for (const r of rows) {
      const name = ve === "All" ? `${r.ear}: ${r.condition}` : r.condition;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push({ x: r.session, y: r.value });
    }
    return { xs, series: Array.from(groups.entries()).map(([name, points]) => ({ name, points })) };
  }, [rows, ve]);
  const preset = PRESETS.find((p) => p.measure === vm);
  const viewUnit = rows[0]?.unit ?? "";
  const invert = preset?.lowerIsBetter ?? viewUnit === "dB HL";

  const nextSession = (c: string, m: string, e: string, cond: string) => {
    const s = entries.filter((x) => x.code === c && x.measure === m && x.ear === e && x.condition === cond).map((x) => x.session);
    return s.length ? Math.max(...s) + 1 : 1;
  };

  function pickMeasure(m: string) {
    setMeasure(m);
    const p = PRESETS.find((x) => x.measure === m);
    if (p) setUnit(p.unit);
  }

  function add() {
    setErr("");
    if (!CODE_RE.test(code)) {
      setErr("Participant code must be 1 to 20 letters, numbers, dashes or underscores, with no spaces. Do not use names.");
      return;
    }
    if (!measure.trim()) return setErr("Choose or type a measure name.");
    const v = parseFloat(value);
    if (!Number.isFinite(v)) return setErr("Enter a numeric value.");
    const sess = session ? parseInt(session, 10) : nextSession(code, measure.trim(), ear, condition);
    const e: Entry = {
      id: Math.random().toString(36).slice(2),
      code,
      measure: measure.trim(),
      unit: unit.trim(),
      ear,
      condition,
      session: Number.isFinite(sess) ? sess : 1,
      date,
      value: v,
      notes: notes.trim(),
    };
    setEntries((prev) => [...prev, e]);
    setViewCode(code);
    setViewMeasure(e.measure);
    setViewEar(e.ear);
    setValue("");
    setNotes("");
    setSession("");
  }

  function exportCsv(all: boolean) {
    const out = (all ? entries : rows).map((e) => ({
      participant_code: e.code,
      measure: e.measure,
      unit: e.unit,
      ear: e.ear,
      condition: e.condition,
      session: e.session,
      date: e.date,
      value: e.value,
      notes: e.notes,
    }));
    downloadText(`audiology-compass_outcomes_${all ? "all" : `${vc}_${vm}`}_${today()}.csv`.replace(/[^\w.-]+/g, "_"), toCsv(out));
  }

  function importJson(file: File) {
    file.text().then((t) => {
      try {
        const data = JSON.parse(t) as Entry[];
        if (!Array.isArray(data)) throw new Error("not a list");
        const clean = data
          .filter((d) => d && CODE_RE.test(d.code) && typeof d.value === "number")
          .map((d) => ({ ...d, ear: d.ear ?? "Not applicable", condition: d.condition ?? "Not applicable", unit: d.unit ?? "", notes: d.notes ?? "" }));
        if (confirm(`Import ${clean.length} entries and merge with the ${entries.length} already in this browser?`)) {
          setEntries((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...clean.filter((c) => !ids.has(c.id))];
          });
        }
      } catch {
        alert("Could not read this file. Use a JSON backup exported from this page.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Outcomes division: progress tracker</h1>
        <p className="muted mt-1 max-w-3xl">
          Track aided and unaided thresholds, speech recognition in quiet and noise, questionnaire total scores and
          hearing aid data logging by participant code. Data is stored only in this browser&apos;s local storage on this
          device. It is not uploaded, synced or backed up; export a CSV or JSON backup regularly. Use participant codes
          only, never names or other identifiers.
        </p>
      </div>

      <section className="card space-y-3">
        <h2 className="h2">Add a data point</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="oc">Participant code</label>
            <input id="oc" className="input" list="codes" value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="e.g. P-014" />
            <datalist id="codes">{codes.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="lg:col-span-2">
            <label className="label" htmlFor="om">Measure (pick a preset or type your own)</label>
            <input id="om" className="input" list="measures" value={measure} onChange={(e) => pickMeasure(e.target.value)} placeholder="e.g. Word recognition in quiet" />
            <datalist id="measures">
              {Array.from(new Set([...PRESETS.map((p) => p.measure), ...entries.map((e) => e.measure)])).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="ou">Unit</label>
            <input id="ou" className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="dB HL, %, points" />
          </div>
          <div>
            <label className="label" htmlFor="oe">Ear</label>
            <select id="oe" className="input" value={ear} onChange={(e) => setEar(e.target.value)}>
              {EARS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ocd">Condition</label>
            <select id="ocd" className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ov">Value</label>
            <input id="ov" className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="os">Session number</label>
            <input id="os" className="input" inputMode="numeric" value={session} onChange={(e) => setSession(e.target.value)} placeholder={code && measure ? `auto: ${nextSession(code, measure.trim(), ear, condition)}` : "auto"} />
          </div>
          <div>
            <label className="label" htmlFor="od">Date</label>
            <input id="od" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label" htmlFor="on">Notes (no identifiers)</label>
            <input id="on" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 2 weeks after fitting, new programme" />
          </div>
        </div>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn" onClick={add}>Add data point</button>
        <p className="text-xs text-stone-500">Questionnaire presets store the total score only. Score questionnaires with licensed forms.</p>
      </section>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="vc">Participant</label>
            <select id="vc" className="input w-36" value={vc} onChange={(e) => setViewCode(e.target.value)}>
              {codes.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="vm">Measure</label>
            <select id="vm" className="input w-72" value={vm} onChange={(e) => setViewMeasure(e.target.value)}>
              {measuresForCode.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ve">Ear</label>
            <select id="ve" className="input w-40" value={ve} onChange={(e) => setViewEar(e.target.value)}>
              {earsFor.map((x) => <option key={x}>{x}</option>)}
              <option value="All">All ears</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" disabled={!rows.length} onClick={() => exportCsv(false)}>Export this view (CSV)</button>
            <button className="btn-outline" disabled={!entries.length} onClick={() => exportCsv(true)}>Export all (CSV)</button>
            <button className="btn-outline" disabled={!entries.length} onClick={() => downloadText(`audiology-compass_outcomes_backup_${today()}.json`, JSON.stringify(entries, null, 1), "application/json")}>
              Backup (JSON)
            </button>
            <label className="btn-outline cursor-pointer">
              Restore JSON
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            </label>
          </div>
        </div>
        {!hydrated ? (
          <p className="muted">Loading data from this browser...</p>
        ) : entries.length === 0 ? (
          <p className="muted">No data yet. Add a data point above.</p>
        ) : (
          <>
            <h2 className="h2">
              {`${vc}: ${vm}${viewUnit ? ` (${viewUnit})` : ""}${ve !== "All" ? `, ${ve}` : ""}`}
            </h2>
            <p className="text-xs text-stone-500">
              One line per condition, so aided and unaided results can be compared session by session.
              {invert ? " For this measure lower values are better, so the axis is drawn with lower values at the top." : " Interpret direction according to the measure."}
            </p>
            <MultiLineChart xs={chart.xs} series={chart.series} yLabel={viewUnit || vm} invertY={invert} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-stone-500">
                    <th className="py-1">Session</th>
                    <th className="py-1">Date</th>
                    <th className="py-1">Ear</th>
                    <th className="py-1">Condition</th>
                    <th className="py-1 text-right">Value</th>
                    <th className="py-1 pl-3">Notes</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b border-stone-100">
                      <td className="py-1">{e.session}</td>
                      <td className="py-1">{e.date}</td>
                      <td className="py-1">{e.ear}</td>
                      <td className="py-1">{e.condition}</td>
                      <td className="py-1 text-right tabular-nums">{e.value}</td>
                      <td className="py-1 pl-3">{e.notes}</td>
                      <td className="py-1 text-right">
                        <button className="text-xs text-red-700 underline" onClick={() => setEntries((p) => p.filter((x) => x.id !== e.id))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {entries.length > 0 && (
          <button
            className="text-xs text-red-700 underline"
            onClick={() => {
              if (confirm("Delete ALL outcome data stored in this browser? Export a backup first if you need it.")) setEntries([]);
            }}
          >
            Delete all outcome data from this browser
          </button>
        )}
      </section>
    </div>
  );
}
