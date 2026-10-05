"use client";

import { useState } from "react";

type Component = "Body Functions and Structures" | "Activity" | "Participation" | "Environmental factors";
type Focus = "hearing" | "vestibular" | "tinnitus";

interface Goal {
  id: string;
  component: Component;
  icfCode: string;
  behaviour: string;
  condition: string;
  criterion: string;
  measure: string;
  support: string;
  weeks: string;
  rationale: string;
}

// ICF codes relevant to aural rehabilitation, tinnitus and vestibular rehabilitation.
// Each code and title was checked against the WHO ICF browser (apps.who.int/classifications/icfbrowser).
const ICF_SUGGESTIONS: Record<Component, string[]> = {
  "Body Functions and Structures": [
    "b230 Hearing functions",
    "b2300 Sound detection",
    "b2301 Sound discrimination",
    "b2302 Localization of sound source",
    "b2304 Speech discrimination",
    "b1560 Auditory perception",
    "b235 Vestibular functions",
    "b2351 Vestibular function of balance",
    "b240 Sensations associated with hearing and vestibular function",
    "b2400 Ringing in ears or tinnitus",
    "b2401 Dizziness",
    "b2405 Aural pressure",
    "b134 Sleep functions",
    "b152 Emotional functions",
    "s240 Structure of external ear",
    "s250 Structure of middle ear",
    "s260 Structure of inner ear",
  ],
  Activity: [
    "d115 Listening",
    "d310 Communicating with - receiving - spoken messages",
    "d350 Conversation",
    "d360 Using communication devices and techniques",
    "d3600 Using telecommunication devices",
    "d240 Handling stress and other psychological demands",
    "d415 Maintaining a body position",
    "d450 Walking",
    "d460 Moving around in different locations",
    "d475 Driving",
  ],
  Participation: [
    "d710 Basic interpersonal interactions",
    "d750 Informal social relationships",
    "d760 Family relationships",
    "d820 School education",
    "d850 Remunerative employment",
    "d910 Community life",
    "d920 Recreation and leisure",
  ],
  "Environmental factors": [
    "e125 Products and technology for communication",
    "e1251 Assistive products and technology for communication",
    "e250 Sound",
    "e2500 Sound intensity",
    "e310 Immediate family",
    "e355 Health professionals",
    "e585 Education and training services, systems and policies",
  ],
};

const EXAMPLES: Record<Focus, Record<Component, Partial<Goal>>> = {
  hearing: {
    "Body Functions and Structures": {
      icfCode: "b2300 Sound detection",
      behaviour: "detect all six Ling sounds",
      condition: "presented at a conversational level from 3 metres in a quiet room",
      criterion: "6 of 6 sounds on 3 consecutive sessions",
      measure: "clinician-administered Ling six-sound check",
      support: "while wearing both hearing aids",
    },
    Activity: {
      icfCode: "d310 Communicating with - receiving - spoken messages",
      behaviour: "repeat key words in everyday sentences",
      condition: "presented in multi-talker babble at +5 dB signal-to-noise ratio in the sound field",
      criterion: "at least 70% key words correct on 2 of 3 lists",
      measure: "recorded sentence-in-noise lists scored by key words",
      support: "with hearing aids on the noise programme",
    },
    Participation: {
      icfCode: "d760 Family relationships",
      behaviour: "take part in family mealtime conversation",
      condition: "at home with 4 to 6 family members",
      criterion: "a self-rated ease of at least 7 out of 10 on 3 of 4 weekly ratings",
      measure: "client and family weekly rating log",
      support: "using agreed communication tactics (face the speaker, reduce background noise)",
    },
    "Environmental factors": {
      icfCode: "e1251 Assistive products and technology for communication",
      behaviour: "use a remote microphone system",
      condition: "during teacher-led lessons in the classroom",
      criterion: "on at least 4 of 5 school days",
      measure: "teacher checklist and device data logging",
      support: "with the teacher wearing the transmitter",
    },
  },
  vestibular: {
    "Body Functions and Structures": {
      icfCode: "b2351 Vestibular function of balance",
      behaviour: "maintain gaze stability during horizontal head movements",
      condition: "while seated, looking at a target at arm's length",
      criterion: "for 60 seconds with dizziness rated 3 out of 10 or less",
      measure: "timed gaze stabilisation exercise with symptom rating",
      support: "independently",
    },
    Activity: {
      icfCode: "d450 Walking",
      behaviour: "walk 20 metres while turning the head side to side",
      condition: "in a clinic corridor",
      criterion: "without loss of balance on 3 of 3 trials",
      measure: "therapist observation and timed walk",
      support: "without a walking aid",
    },
    Participation: {
      icfCode: "d920 Recreation and leisure",
      behaviour: "go shopping at the local market",
      condition: "for at least 30 minutes",
      criterion: "on 2 occasions in a week without stopping because of dizziness",
      measure: "client activity diary",
      support: "with a family member nearby",
    },
    "Environmental factors": {
      icfCode: "e310 Immediate family",
      behaviour: "support home exercise practice and fall-safe changes at home",
      condition: "following a home exercise and safety plan",
      criterion: "with exercises logged on at least 5 days per week",
      measure: "exercise log and home safety checklist",
      support: "with a family member present for balance exercises",
    },
  },
  tinnitus: {
    "Body Functions and Structures": {
      icfCode: "b2400 Ringing in ears or tinnitus",
      behaviour: "report reduced tinnitus intrusiveness",
      condition: "in quiet evening settings",
      criterion: "a fall of at least 2 points on a 0 to 10 intrusiveness rating over 4 weeks",
      measure: "weekly 0 to 10 rating and a validated questionnaire total score",
      support: "using sound enrichment",
    },
    Activity: {
      icfCode: "d240 Handling stress and other psychological demands",
      behaviour: "use a relaxation or attention-shifting strategy when tinnitus is bothersome",
      condition: "at home and at work",
      criterion: "on at least 5 of 7 days",
      measure: "client diary",
      support: "independently",
    },
    Participation: {
      icfCode: "d850 Remunerative employment",
      behaviour: "complete a full working day",
      condition: "in the usual workplace",
      criterion: "on 5 of 5 days without leaving early because of tinnitus",
      measure: "client report",
      support: "with workplace sound enrichment agreed with the employer",
    },
    "Environmental factors": {
      icfCode: "e2500 Sound intensity",
      behaviour: "use hearing protection",
      condition: "during noisy leisure activities (concerts, power tools)",
      criterion: "on every reported exposure over 4 weeks",
      measure: "exposure diary",
      support: "with filtered earplugs provided",
    },
  },
};

function newGoal(component: Component = "Activity"): Goal {
  return {
    id: Math.random().toString(36).slice(2),
    component,
    icfCode: "",
    behaviour: "",
    condition: "",
    criterion: "",
    measure: "",
    support: "",
    weeks: "12",
    rationale: "",
  };
}

export function smartText(g: Goal, code: string): string {
  const who = code.trim() || "The client";
  const parts = [
    `Within ${g.weeks || "[timeframe]"} weeks, ${who} will ${g.behaviour || "[observable behaviour]"}`,
    g.condition ? ` ${g.condition}` : " [condition or context]",
    g.support ? ` ${g.support}` : "",
    `, achieving ${g.criterion || "[measurable criterion]"}`,
    `, as measured by ${g.measure || "[measurement method]"}.`,
  ];
  return parts.join("").replace(/\s+/g, " ").replace(/ ,/g, ",");
}

export default function PlanningClient() {
  const [code, setCode] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [env, setEnv] = useState({ facilitators: "", barriers: "" });
  const [personal, setPersonal] = useState("");
  const [focus, setFocus] = useState<Focus>("hearing");
  const [goals, setGoals] = useState<Goal[]>([newGoal("Body Functions and Structures"), newGoal("Activity"), newGoal("Participation"), newGoal("Environmental factors")]);

  const upd = (id: string, patch: Partial<Goal>) => setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="h1">Planning division: ICF aural rehabilitation and vestibular goal builder</h1>
        <p className="muted mt-1 max-w-3xl">
          Build SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) organised by the WHO
          International Classification of Functioning, Disability and Health (ICF). Everything stays in this page; use
          Print or Save as PDF to keep a copy. Use a participant code, not a name.
        </p>
        <p className="mt-1 text-xs text-stone-500">
          ICF reference:{" "}
          <a className="text-plum underline" href="https://www.who.int/standards/classifications/international-classification-of-functioning-disability-and-health" target="_blank" rel="noreferrer">
            WHO ICF
          </a>{" "}
          and the{" "}
          <a className="text-plum underline" href="https://apps.who.int/classifications/icfbrowser/" target="_blank" rel="noreferrer">
            ICF browser
          </a>
          . Suggested codes were checked against the ICF browser; choose the code that fits the goal.
        </p>
      </div>

      <section className="card no-print grid gap-3 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="pc">Participant code</label>
          <input id="pc" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. P-014" />
        </div>
        <div>
          <label className="label" htmlFor="dx">Hearing, tinnitus or balance profile</label>
          <input id="dx" className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. bilateral moderate SNHL, new hearing aid user" />
        </div>
        <div>
          <label className="label" htmlFor="ef">Environmental factors: facilitators</label>
          <textarea id="ef" className="input" value={env.facilitators} onChange={(e) => setEnv({ ...env, facilitators: e.target.value })} placeholder="e.g. supportive family (e310), remote microphone available (e1251)" />
        </div>
        <div>
          <label className="label" htmlFor="eb">Environmental factors: barriers</label>
          <textarea id="eb" className="input" value={env.barriers} onChange={(e) => setEnv({ ...env, barriers: e.target.value })} placeholder="e.g. noisy workplace (e250), limited access to follow-up" />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="pf">Personal factors</label>
          <textarea id="pf" className="input" value={personal} onChange={(e) => setPersonal(e.target.value)} placeholder="e.g. motivated, bilingual Kannada and English, prefers evening sessions" />
        </div>
      </section>

      <div className="no-print flex flex-wrap items-center gap-2 text-sm">
        <span className="label mb-0">Example set</span>
        {(["hearing", "vestibular", "tinnitus"] as Focus[]).map((f) => (
          <label key={f} className="flex items-center gap-1">
            <input type="radio" name="focus" checked={focus === f} onChange={() => setFocus(f)} />
            {f === "hearing" ? "Hearing and aural rehabilitation" : f === "vestibular" ? "Vestibular rehabilitation" : "Tinnitus"}
          </label>
        ))}
        <span className="text-xs text-stone-500">Used by the Fill example buttons.</span>
      </div>

      <div className="no-print space-y-4">
        {goals.map((g, idx) => (
          <section key={g.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="h2">Goal {idx + 1}</h2>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => upd(g.id, EXAMPLES[focus][g.component])}>Fill example</button>
                <button className="btn-outline" onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))}>Remove</button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="label">ICF component</label>
                <select className="input" value={g.component} onChange={(e) => upd(g.id, { component: e.target.value as Component, icfCode: "" })}>
                  {(Object.keys(ICF_SUGGESTIONS) as Component[]).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">ICF code (optional)</label>
                <input className="input" list={`icf-${g.id}`} value={g.icfCode} onChange={(e) => upd(g.id, { icfCode: e.target.value })} placeholder="type or pick" />
                <datalist id={`icf-${g.id}`}>
                  {ICF_SUGGESTIONS[g.component].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">Timeframe (weeks)</label>
                <input className="input" inputMode="numeric" value={g.weeks} onChange={(e) => upd(g.id, { weeks: e.target.value })} />
              </div>
              <div>
                <label className="label">Specific behaviour (will...)</label>
                <input className="input" value={g.behaviour} onChange={(e) => upd(g.id, { behaviour: e.target.value })} placeholder="observable action" />
              </div>
              <div>
                <label className="label">Condition or context</label>
                <input className="input" value={g.condition} onChange={(e) => upd(g.id, { condition: e.target.value })} placeholder="where, when, with what material" />
              </div>
              <div>
                <label className="label">Support level</label>
                <input className="input" value={g.support} onChange={(e) => upd(g.id, { support: e.target.value })} placeholder="e.g. with both hearing aids" />
              </div>
              <div>
                <label className="label">Measurable criterion</label>
                <input className="input" value={g.criterion} onChange={(e) => upd(g.id, { criterion: e.target.value })} placeholder="e.g. 70% key words correct on 2 of 3 lists" />
              </div>
              <div>
                <label className="label">Measurement method</label>
                <input className="input" value={g.measure} onChange={(e) => upd(g.id, { measure: e.target.value })} placeholder="probe, rating, recording" />
              </div>
              <div>
                <label className="label">Relevance (why it matters)</label>
                <input className="input" value={g.rationale} onChange={(e) => upd(g.id, { rationale: e.target.value })} placeholder="link to client priorities" />
              </div>
            </div>
            <div className="rounded bg-plum-light p-3 text-sm">
              <span className="font-semibold text-plum">Generated goal: </span>
              {smartText(g, code)}
            </div>
          </section>
        ))}
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={() => setGoals((gs) => [...gs, newGoal()])}>Add goal</button>
          <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
        </div>
      </div>

      {/* Printable summary */}
      <section className="card">
        <h2 className="h2">Goal plan summary</h2>
        <p className="text-sm text-stone-700">
          <b>Participant code:</b> {code || "not entered"} {diagnosis && <> | <b>Profile:</b> {diagnosis}</>} | <b>Date:</b>{" "}
          <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span>
        </p>
        {(["Body Functions and Structures", "Activity", "Participation", "Environmental factors"] as Component[]).map((c) => {
          const gs = goals.filter((g) => g.component === c);
          if (!gs.length) return null;
          return (
            <div key={c} className="mt-3">
              <h3 className="font-bold text-plum">{c}</h3>
              <ol className="ml-5 list-decimal space-y-1 text-sm">
                {gs.map((g) => (
                  <li key={g.id}>
                    {smartText(g, code)}
                    {g.icfCode && <span className="text-stone-600"> [ICF: {g.icfCode}]</span>}
                    {g.rationale && <span className="text-stone-600"> Relevance: {g.rationale}.</span>}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
        <div className="mt-3 text-sm">
          <h3 className="font-bold text-plum">Contextual factors</h3>
          <p><b>Environmental facilitators:</b> {env.facilitators || "not recorded"}</p>
          <p><b>Environmental barriers:</b> {env.barriers || "not recorded"}</p>
          <p><b>Personal factors:</b> {personal || "not recorded"}</p>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Generated with Audiology Compass (educational and research use). Goals are drafted from clinician inputs and
          must be reviewed by the treating clinician with the client and family.
        </p>
      </section>
    </div>
  );
}
