import Link from "next/link";

const DIVISIONS = [
  {
    href: "/evidence",
    title: "Evidence division",
    text: "Live search of ClinicalTrials.gov across 15 audiology and vestibular domains, from sudden hearing loss and tinnitus to cochlear implants and ototoxicity. Rule-based intervention, outcome, dose and delivery tags, dashboards, CSV export and an optional AI annotation agent that you verify.",
  },
  {
    href: "/assessment",
    title: "Assessment division",
    text: "Audiogram plotter with standard symbols and PNG export, pure-tone averages, WHO 2021 and Clark grades, asymmetry and SRT checks, AAO-1979 handicap, tympanogram types, ototoxicity change and real-ear vs target.",
  },
  {
    href: "/planning",
    title: "Planning division",
    text: "ICF goal builder for aural rehabilitation, tinnitus and vestibular rehabilitation (b230, b235, b240, d115, d310, e125 and more). Generates printable SMART goal text from your inputs.",
  },
  {
    href: "/safety",
    title: "Safety division",
    text: "Red flags: sudden hearing loss, asymmetric loss, pulsatile or unilateral tinnitus, central vertigo signs, ear disease, paediatric follow-up timelines and ototoxic drug monitoring, with verified guideline links.",
  },
  {
    href: "/outcomes",
    title: "Outcomes division",
    text: "Track aided vs unaided thresholds, speech in quiet and noise, questionnaire totals and data logging by participant code. Data stays in your browser. Charts and CSV or JSON export.",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-navy px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Audiology Compass</h1>
        <p className="mt-1 text-lg font-semibold text-slate-100">An open web platform for evidence-guided audiology practice</p>
        <p className="mt-2 max-w-3xl text-base text-slate-100">
          A human-guided, multi-division workspace for audiologists. Inspired by the Virtual Biotech framework (Zhang et
          al., Science, 2026), where AI agents are organised like divisions of an organisation and a human expert stays
          in charge of every decision.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/evidence" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-100">
            Open the Evidence division
          </Link>
          <Link href="/assessment" className="rounded-md border border-white px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
            Plot an audiogram
          </Link>
          <Link href="/about" className="rounded-md border border-white px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
            About, privacy and disclaimer
          </Link>
        </div>
      </section>

      <section>
        <h2 className="h2">Divisions</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((d) => (
            <Link key={d.href} href={d.href} className="card block transition hover:border-navy">
              <h3 className="font-bold text-navy">{d.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{d.text}</p>
            </Link>
          ))}
          <a href="https://slpcompass.vercel.app" target="_blank" rel="noreferrer" className="card block border-dashed bg-slate-50 transition hover:border-navy">
            <h3 className="font-bold text-navy">Sister tool: SLP Compass</h3>
            <p className="mt-1 text-sm text-slate-700">
              The speech-language pathology counterpart, with the same design and privacy model:
              slpcompass.vercel.app
            </p>
          </a>
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Privacy at a glance</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>No accounts, no database, no analytics. Nothing about clients or patients is sent to or stored on the server.</li>
          <li>Assessment, planning and outcomes tools run entirely in your browser. Outcome data lives in your browser storage only, under participant codes.</li>
          <li>The Evidence division only requests public registry data from ClinicalTrials.gov.</li>
          <li>If you use the optional AI agent, your API key stays in your browser and is sent only with each annotation request.</li>
        </ul>
      </section>
    </div>
  );
}
