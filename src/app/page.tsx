import Link from "next/link";
import { HeroAudiogram, WaveEdge } from "@/components/HeroMotif";

type Division = { href: string; n: string; title: string; text: string; icon: React.ReactNode; wide?: boolean };

const ico = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const DIVISIONS: Division[] = [
  {
    href: "/evidence",
    n: "01",
    title: "Evidence division",
    wide: true,
    icon: ico("M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6"),
    text: "Live search of ClinicalTrials.gov across 15 audiology and vestibular domains, from sudden hearing loss and tinnitus to cochlear implants and ototoxicity. Rule-based intervention, outcome, dose and delivery tags, dashboards, CSV export and an optional AI annotation agent that you verify.",
  },
  {
    href: "/assessment",
    n: "02",
    title: "Assessment division",
    icon: ico("M3 12h3l2-6 4 12 3-9 2 3h4"),
    text: "Audiogram plotter with standard symbols and PNG export, pure-tone averages, WHO 2021 and Clark grades, asymmetry and SRT checks, AAO-1979 handicap, tympanogram types, ototoxicity change and real-ear vs target.",
  },
  {
    href: "/planning",
    n: "03",
    title: "Planning division",
    icon: ico("M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01"),
    text: "ICF goal builder for aural rehabilitation, tinnitus and vestibular rehabilitation (b230, b235, b240, d115, d310, e125 and more). Generates printable SMART goal text from your inputs.",
  },
  {
    href: "/safety",
    n: "04",
    title: "Safety division",
    icon: ico("M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3zM12 8v5M12 16h.01"),
    text: "Red flags: sudden hearing loss, asymmetric loss, pulsatile or unilateral tinnitus, central vertigo signs, ear disease, paediatric follow-up timelines and ototoxic drug monitoring, with verified guideline links.",
  },
  {
    href: "/outcomes",
    n: "05",
    title: "Outcomes division",
    icon: ico("M4 18l5-6 4 3 7-9M15 6h5v5"),
    text: "Track aided vs unaided thresholds, speech in quiet and noise, questionnaire totals and data logging by participant code. Data stays in your browser. Charts and CSV or JSON export.",
  },
];

const DOMAIN_CHIPS = [
  "Hearing loss",
  "Sudden SNHL",
  "Hearing aids",
  "Cochlear implants",
  "Bone conduction and middle ear",
  "Tinnitus",
  "Hyperacusis",
  "Vestibular",
  "APD",
  "Auditory neuropathy",
  "Paediatric",
  "Ototoxicity",
  "Aural rehabilitation",
];

const PRIVACY = [
  { t: "No accounts, no database", d: "No analytics. Nothing about clients or patients is sent to or stored on the server." },
  { t: "Runs in your browser", d: "Assessment, planning and outcomes tools run locally. Outcome data lives in browser storage under participant codes." },
  { t: "Public registry only", d: "The Evidence division only requests public registry data from ClinicalTrials.gov." },
  { t: "Your key, your browser", d: "If you use the optional AI agent, your API key stays in your browser and is sent only with each annotation request." },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Full-bleed hero */}
      <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 bg-plum-dark text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-6 pt-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber">Open source · Browser-first · Clinician in charge</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Audiology <span className="italic text-amber">Compass</span>
            </h1>
            <p className="mt-4 font-display text-xl text-stone-100 sm:text-2xl">An open web platform for evidence-guided audiology practice</p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-300">
              A human-guided, multi-division workspace for audiologists. Inspired by the Virtual Biotech framework (Zhang et
              al., Science, 2026), where AI agents are organised like divisions of an organisation and a human expert stays
              in charge of every decision.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/evidence" className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-plum-dark shadow-lg shadow-black/20 transition hover:bg-[#f7bd66]">
                Open the Evidence division
              </Link>
              <Link href="/assessment" className="rounded-full border-2 border-white/70 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10">
                Plot an audiogram
              </Link>
              <Link href="/about" className="px-2 py-2 text-sm font-semibold text-stone-200 underline decoration-amber decoration-2 underline-offset-4 hover:text-white">
                About, privacy and disclaimer
              </Link>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
              {[
                ["15", "evidence domains"],
                ["5", "divisions"],
                ["0", "patient data on server"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-white/15 bg-white/5 px-2 py-2">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-2xl font-semibold text-amber">{v}</dd>
                  <dd className="text-[0.7rem] leading-tight text-stone-300">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-3 rotate-3 rounded-[1.6rem] border-2 border-amber/70" aria-hidden="true" />
            <div className="relative -rotate-2 rounded-[1.4rem] p-1.5 shadow-2xl shadow-black/40 ring-1 ring-white/20">
              <HeroAudiogram />
            </div>
            <p className="mt-4 text-center text-[0.7rem] text-stone-300">Illustration. Right ear O in red, left ear X in blue, as in the ASHA convention.</p>
          </div>
        </div>
        <WaveEdge />
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="label">How it is organised</p>
            <h2 className="font-display text-3xl font-semibold text-plum-dark">Five divisions, one clinician</h2>
          </div>
          <p className="max-w-md text-sm text-stone-600">
            Every automated output, rule-based or AI, is a suggestion. You review, edit and verify it before it is used for research or care.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {DIVISIONS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className={`group relative overflow-hidden rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-plum hover:shadow-[0_14px_30px_-18px_rgba(42,16,53,0.55)] ${
                d.wide ? "md:col-span-2 lg:col-span-4" : "lg:col-span-2"
              }`}
            >
              <span className="absolute right-4 top-2 font-display text-5xl font-semibold text-plum-light transition group-hover:text-amber/40" aria-hidden="true">
                {d.n}
              </span>
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-plum text-white">{d.icon}</span>
              <h3 className="relative mt-3 font-display text-lg font-semibold text-plum-dark">{d.title}</h3>
              <p className="relative mt-1 text-sm leading-relaxed text-stone-700">{d.text}</p>
              {d.wide && (
                <ul className="relative mt-3 flex flex-wrap gap-1.5" aria-label="Example evidence domains">
                  {DOMAIN_CHIPS.map((c) => (
                    <li key={c} className="rounded-full border border-line bg-cream px-2.5 py-0.5 text-xs font-semibold text-plum">{c}</li>
                  ))}
                </ul>
              )}
              <span className="relative mt-3 inline-block text-sm font-bold text-amber-dark">Open →</span>
            </Link>
          ))}
          <a
            href="https://slpcompass.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col justify-center rounded-2xl border-2 border-dashed border-plum-mid bg-plum-light p-5 transition hover:border-plum md:col-span-2 lg:col-span-6"
          >
            <p className="label">Sister tool</p>
            <h3 className="font-display text-lg font-semibold text-plum-dark">SLP Compass</h3>
            <p className="mt-1 text-sm text-stone-700">
              The speech-language pathology counterpart, with the same privacy model: slpcompass.vercel.app
            </p>
          </a>
        </div>
      </section>

      <section className="rounded-3xl bg-plum-light p-6 sm:p-8">
        <p className="label">Privacy at a glance</p>
        <h2 className="font-display text-2xl font-semibold text-plum-dark">Designed so patient data never leaves your device</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRIVACY.map((p) => (
            <li key={p.t} className="rounded-2xl bg-white p-4">
              <span className="mb-2 block h-1.5 w-8 rounded-full bg-amber" aria-hidden="true" />
              <p className="font-semibold text-plum-dark">{p.t}</p>
              <p className="mt-1 text-sm text-stone-700">{p.d}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
