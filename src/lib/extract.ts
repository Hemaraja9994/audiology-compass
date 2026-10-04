// Rule-based feature extraction from ClinicalTrials.gov API v2 study records.
// Everything here is deterministic and transparent: regular expressions over
// the registry text. Extracted values are hints for a clinician to verify,
// not ground truth.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TrialRecord {
  nctId: string;
  title: string;
  url: string;
  domains: string[];
  status: string;
  whyStopped: string;
  stopCategory: string;
  phase: string;
  allocation: string;
  masking: string;
  interventionTypes: string[];
  interventions: string[];
  enrollment: number | null;
  enrollmentType: string;
  startDate: string;
  completionDate: string;
  countries: string[];
  sponsor: string;
  sponsorClass: string;
  hasResults: boolean;
  ageGroups: string[];
  minAge: string;
  maxAge: string;
  populationTags: string[];
  sessions: number | null;
  minutesPerSession: number | null;
  sessionsPerWeek: number | null;
  durationWeeks: number | null;
  totalHours: number | null;
  intensity: string;
  delivery: string[];
  interventionCategories: string[];
  outcomeTags: string[];
  primaryOutcomes: string[];
  doseEvidence: string;
}

const WORD_NUMS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  once: 1, twice: 2, thrice: 3,
};
const NUM = "(\\d{1,3}(?:\\.\\d)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|eighteen|twenty|thirty|forty|fifty|sixty)";

function toNum(s: string | undefined): number | null {
  if (!s) return null;
  const t = s.toLowerCase();
  if (t in WORD_NUMS) return WORD_NUMS[t];
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function snippet(text: string, index: number, len: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + len + 40);
  return (start > 0 ? "..." : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "..." : "");
}

export interface DoseFeatures {
  sessions: number | null;
  minutesPerSession: number | null;
  sessionsPerWeek: number | null;
  durationWeeks: number | null;
  totalHours: number | null;
  intensity: string;
  evidence: string[];
}

export function extractDose(text: string): DoseFeatures {
  const evidence: string[] = [];
  let sessions: number | null = null;
  let minutesPerSession: number | null = null;
  let sessionsPerWeek: number | null = null;
  let durationWeeks: number | null = null;

  // Total sessions: "24 sessions", "a total of 12 therapy sessions", "10 treatment sessions"
  const sessRe = new RegExp(
    `(?:total of\\s+)?${NUM}\\s*(?:x\\s*)?(?:total\\s+|individual\\s+|group\\s+|weekly\\s+|daily\\s+|consecutive\\s+)?(?:treatment|therapy|training|intervention|practice|study|teletherapy|telepractice)?\\s*sessions?\\b`,
    "i",
  );
  const sm = text.match(sessRe);
  if (sm && sm.index !== undefined) {
    const n = toNum(sm[1]);
    // Ignore "1 session" style statements that are usually not totals, and absurd values
    if (n !== null && n >= 2 && n <= 400) {
      sessions = n;
      evidence.push(snippet(text, sm.index, sm[0].length));
    }
  }

  // Minutes per session: "45-minute sessions", "30 min", "60 minutes per session"; or hours
  const minRe = /(\d{1,3})\s*(?:-|to|–)?\s*(\d{1,3})?\s*-?\s*(?:min(?:ute)?s?)\b/i;
  const mm = text.match(minRe);
  if (mm && mm.index !== undefined) {
    const a = toNum(mm[1]);
    const b = toNum(mm[2]);
    const v = a !== null && b !== null && b > a ? (a + b) / 2 : a;
    if (v !== null && v >= 5 && v <= 240) {
      minutesPerSession = v;
      evidence.push(snippet(text, mm.index, mm[0].length));
    }
  }
  if (minutesPerSession === null) {
    const hr = text.match(
      new RegExp(`${NUM}\\s*-?\\s*(?:hours?|hrs?|h)\\b(?:\\s*(?:per|a|each|\\/)\\s*(?:session|day)|\\s+(?:[a-z]+\\s+)?sessions?)`, "i"),
    );
    if (hr && hr.index !== undefined) {
      const h = toNum(hr[1]);
      if (h !== null && h > 0 && h <= 6) {
        minutesPerSession = h * 60;
        evidence.push(snippet(text, hr.index, hr[0].length));
      }
    }
  }

  // Frequency: "3 times per week", "twice a week", "5 days/week", "3 sessions per week", "daily"
  const freqRe = new RegExp(
    `${NUM}\\s*(?:x|times?|days?|visits?|(?:\\d{1,3}(?:\\.\\d)?\\s*-?\\s*(?:minutes?|mins?|hours?|h)\\s+)?(?:[a-z]+\\s+)?sessions?)?\\s*(?:per|a|each|\\/|every)\\s*week`,
    "i",
  );
  const fm = text.match(freqRe);
  if (fm && fm.index !== undefined) {
    const n = toNum(fm[1]);
    if (n !== null && n >= 1 && n <= 14) {
      sessionsPerWeek = n;
      evidence.push(snippet(text, fm.index, fm[0].length));
    }
  } else {
    const twice = /\btwice (?:a day|daily|per day)\b|\b2 times (?:a|per) day\b/i;
    const daily = /\bonce (?:a day|daily|per day)\b|\bevery day\b|\bdaily (?:sessions?|practice|therapy|training|exercises?|treatment|intervention|use|for)\b|\b(?:performed|practised|practiced|administered|delivered|given|done|provided|completed) daily\b/i;
    const tm = text.match(twice);
    const dm2 = tm ? null : text.match(daily);
    const hit = tm ?? dm2;
    if (hit && hit.index !== undefined) {
      sessionsPerWeek = tm ? 14 : 7;
      evidence.push(snippet(text, hit.index, hit[0].length));
    }
  }

  // Duration: "for 6 weeks", "over 3 months", "8-week program", "12 weeks of therapy"
  const durRe = new RegExp(
    `(?:for|over|during|lasting|period of|across|within)\\s+(?:a\\s+|the\\s+)?(?:total of\\s+)?${NUM}\\s*(?:consecutive\\s+)?(weeks?|months?|days?)\\b|${NUM}\\s*-\\s*(week|month|day)\\s+(?:program|programme|intervention|treatment|therapy|training|period|course|protocol|block)`,
    "i",
  );
  const dm = text.match(durRe);
  if (dm && dm.index !== undefined) {
    const n = toNum(dm[1] ?? dm[3]);
    const unit = (dm[2] ?? dm[4] ?? "").toLowerCase();
    if (n !== null) {
      let w: number | null = null;
      if (unit.startsWith("week")) w = n;
      else if (unit.startsWith("month")) w = Math.round(n * 4.35 * 10) / 10;
      else if (unit.startsWith("day")) w = Math.round((n / 7) * 10) / 10;
      if (w !== null && w > 0 && w <= 260) {
        durationWeeks = w;
        evidence.push(snippet(text, dm.index, dm[0].length));
      }
    }
  }

  // Derived total hours
  let totalSessions = sessions;
  if (totalSessions === null && sessionsPerWeek !== null && durationWeeks !== null) {
    totalSessions = Math.round(sessionsPerWeek * durationWeeks);
  }
  const totalHours =
    totalSessions !== null && minutesPerSession !== null
      ? Math.round(((totalSessions * minutesPerSession) / 60) * 10) / 10
      : null;

  // Intensity label (simple, transparent rule)
  let intensity = "Not stated";
  const intensiveWords = /\b(intensive|intense|high[- ]intensity|massed practice|boot camp)\b/i;
  if (intensiveWords.test(text) || (sessionsPerWeek !== null && sessionsPerWeek >= 4)) {
    intensity = "High (stated intensive or 4+ sessions/week)";
  } else if (sessionsPerWeek !== null && sessionsPerWeek >= 2) {
    intensity = "Moderate (2 to 3 sessions/week)";
  } else if (sessionsPerWeek !== null) {
    intensity = "Low (1 session/week or less)";
  }

  return { sessions, minutesPerSession, sessionsPerWeek, durationWeeks, totalHours, intensity, evidence };
}

export const TELE = "Tele-audiology / remote";

export function extractDelivery(text: string): string[] {
  const out: string[] = [];
  if (/\btele[- ]?(audiology|practice|rehabilitation|rehab|therapy|health|medicine|intervention|coaching|care|fitting)\b|\bremote(ly)? (fitting|programming|programmed|adjust|support|session|delivery|care|monitoring)|\bremote(ly)?\b|\bvideo[- ]?conferenc|\bonline\b|\binternet[- ]based\b|\bweb[- ]based\b/i.test(text)) out.push(TELE);
  if (/\bapp\b|\bapplication\b|\btablet\b|\bipad\b|\bsmartphone\b|\bcomputer[- ](based|assisted|program)|\bsoftware\b|\bdigital\b|\bvirtual reality\b|\bgame\b|\bgamified\b/i.test(text)) out.push("App / computer / digital");
  if (/\bover[- ]the[- ]counter\b|\bOTC\b|\bself[- ]fit(ting)?\b|\bdirect[- ]to[- ]consumer\b/i.test(text)) out.push("Over-the-counter / self-fitting");
  if (/\bgroup (therapy|sessions?|treatment|intervention|program|training|rehabilitation)\b|\bgroup[- ]based\b/i.test(text)) out.push("Group");
  if (/\bhome[- ](based|practice|program|programme|exercise|exercises|training)\b|\bat home\b|\bparent[- ](implemented|mediated|delivered|training|coaching)\b|\bcaregiver[- ](mediated|delivered|training|implemented)\b/i.test(text)) out.push("Home / caregiver-mediated");
  if (/\bface[- ]to[- ]face\b|\bin[- ]person\b|\bclinic[- ]based\b|\bin the clinic\b|\binpatient\b|\boutpatient\b/i.test(text)) out.push("In-person");
  return out;
}

// Intervention categories from intervention names, types and descriptions (rules, multiple allowed).
const INTERVENTION_CATS: [string, RegExp][] = [
  ["Hearing aid / amplification", /\bhearing aids?\b|\bhearing instruments?\b|\bamplification\b|\bPSAP\b|\bsound amplif/i],
  ["Cochlear implant", /\bcochlear implant|\bsound processor|\bnucleus\b|\bCP\d{3,4}\b|\bcodacs/i],
  ["Bone conduction / middle ear implant", /\bbone[- ]conduct|\bbone[- ]anchored|\bBAHA\b|\bosseointegrat|\bmiddle ear implant|\bsoundbridge\b|\bbonebridge\b|\bosia\b/i],
  ["Auditory brainstem implant", /\bauditory brainstem implant|\bABI\b/i],
  ["Vestibular implant", /\bvestibular (implant|prosthes)/i],
  ["Remote microphone / assistive listening", /\bremote microphone|\bFM system|\bassistive listening|\bDM system|\bloop system|\broger\b/i],
  ["Auditory training / aural rehabilitation", /\bauditory (training|rehabilitation)|\baural rehabilitation|\bauditory[- ]verbal|\blistening training|\bspeech perception training|\bcommunication training|\bspeechreading|\blipreading|\bmusic training/i],
  ["Sound therapy / counselling", /\bsound (therapy|generator|enrichment)|\btinnitus retraining|\bTRT\b|\bnotched (music|sound)|\bmasker|\bmasking device|\bcounsel+ing/i],
  ["CBT / psychological therapy", /\bcognitive[- ]behavio|\bCBT\b|\bmindfulness|\bacceptance and commitment|\bpsychotherap|\bpsychological/i],
  ["Neuromodulation / stimulation", /\bneuromodulat|\bTMS\b|\btranscranial|\btDCS\b|\bvagus nerve|\bbimodal (stimulation|neuromodulation)|\belectrical stimulation|\blenire\b/i],
  ["Vestibular rehabilitation", /\bvestibular (rehabilitation|physiotherapy|physical therapy|exercises?|training)|\bgaze stabili[sz]ation|\bbalance (training|exercises?|rehabilitation)|\bhabituation exercises?|\bcawthorne/i],
  ["Repositioning manoeuvre", /\brepositioning|\bepley\b|\bsemont\b|\bgufoni\b|\bbarbecue roll|\bliberatory man/i],
  ["Corticosteroid (systemic)", /\b(predniso(lo)?ne|methylprednisolone|dexamethasone|steroids?|corticosteroids?|hydrocortisone)\b/i],
  ["Intratympanic therapy", /\bintratympanic|\btranstympanic|\bround window/i],
  ["Hyperbaric oxygen", /\bhyperbaric/i],
  ["Otoprotectant / pharmacological protection", /\bsodium thiosulfate|\bototoxicity prevention|\botoprotect|\bN-acetylcysteine|\bebselen|\bD-methionine|\balpha[- ]lipoic|\bamifostine/i],
  ["Gene or cell therapy", /\bgene therapy|\bOTOF\b|\bAAV\b|\bstem cell|\bcell therapy/i],
  ["Ear or skull base surgery", /\bstapedotomy|\bstapedectomy|\btympanoplasty|\bmastoidectomy|\bmyringotomy|\bgrommet|\bventilation tube|\btympanostomy|\bendolymphatic sac|\blabyrinthectomy|\bvestibular neurectomy|\bsurgery|\bsurgical/i],
  ["Hearing protection / noise education", /\bhearing protect|\bear ?plugs?\b|\bearmuffs?\b|\bnoise (education|exposure reduction)|\bhearing conservation/i],
  ["Speech, language or communication therapy", /\bspeech (and |& )?language (therapy|intervention|treatment)|\bcommunication (treatment|intervention|therapy)|\bphonological awareness|\blanguage intervention|\bliteracy/i],
  ["Diet / lifestyle / exercise", /\bdiet\b|\bdietary|\blifestyle|\baerobic|\bexercise program|\bsalt restriction|\bcaffeine|\bweight loss/i],
  ["Diagnostic test or assessment tool", /\belectrocochleograph|\bEFR\b|\bABR\b|\botoacoustic|\bOAE\b|\bassessment system|\bdiagnostic (test|tool|device)|\bscreening (test|tool|device|app)/i],
  ["Screening / service delivery model", /\bscreening\b|\bservice[- ]delivery|\bcare pathway|\bcommunity health worker|\bfollow[- ]up (program|intervention)/i],
];

export function extractInterventionCategories(text: string): string[] {
  return INTERVENTION_CATS.filter(([, re]) => re.test(text)).map(([t]) => t);
}

// Outcome measure families detected in primary outcome names (rules). Questionnaire names are matched
// by abbreviation only; no questionnaire content is reproduced.
const OUTCOME_TAGS: [string, RegExp][] = [
  ["Pure-tone thresholds / PTA", /\bpure[- ]tone|\bPTA\b|\baudiometr|\bhearing threshold|\bthreshold shift|\bair[- ]conduction|\bbone[- ]conduction threshold|\bhearing (level|recovery|improvement|gain)\b/i],
  ["Speech recognition in quiet", /\bword recognition|\bspeech (recognition|discrimination|perception|understanding)|\bCNC\b|\bmonosyllab|\bSRT\b|\bspeech reception threshold|\bWRS\b|\bSDS\b/i],
  ["Speech in noise", /\bin noise\b|\bspeech[- ]in[- ]noise|\bSIN\b|\bQuickSIN|\bHINT\b|\bAzBio|\bdigits?[- ]in[- ]noise|\bmatrix (test|sentence)|\bSRT50|\bsignal[- ]to[- ]noise/i],
  ["Tinnitus questionnaire", /\bTHI\b|\bTFI\b|\btinnitus (handicap|functional|questionnaire|severity|loudness|distress)|\bTQ\b/i],
  ["Dizziness / balance measure", /\bDHI\b|\bdizziness handicap|\bvertigo (symptom|attacks?|frequency|control)|\bposturograph|\bbalance|\bvHIT\b|\bhead impulse|\bnystagmus|\bVNG\b|\bcaloric|\bVEMP|\bDix[- ]Hallpike|\bfalls?\b/i],
  ["Hearing handicap / benefit questionnaire", /\bHHIE|\bHHIA|\bAPHAB|\bCOSI\b|\bSSQ\b|\bIOI[- ]HA|\bhearing handicap|\bhearing aid benefit|\bself[- ]reported hearing/i],
  ["Quality of life / wellbeing / cognition", /\bquality of life|\bQoL\b|\bHRQoL|\bEQ-5D|\bSF-36|\bdepression|\banxiety|\bloneliness|\bcogniti|\bdementia|\bwellbeing|\bwell-being/i],
  ["Device use / datalogging", /\bdatalog|\bdata[- ]log|\bhours? of (daily )?use|\busage\b|\badherence|\bcompliance|\bwear time/i],
  ["Electrophysiology / OAE / immittance", /\bABR\b|\bauditory brainstem response|\bOAE|\botoacoustic|\bDPOAE|\bECochG|\belectrocochleograph|\btympanometr|\bacoustic reflex|\bcortical (auditory )?evoked|\bCAEP/i],
  ["Language / speech development", /\blanguage (development|outcomes?|skills)|\bvocabulary|\bspeech production|\bintelligibility|\bCDI\b|\bPLS\b|\bLittlEARS/i],
  ["Safety / adverse events", /\badverse (event|effect|device)|\bsafety\b|\bcomplication/i],
];

export function extractOutcomeTags(text: string): string[] {
  return OUTCOME_TAGS.filter(([, re]) => re.test(text)).map(([t]) => t);
}

const POP_TAGS: [string, RegExp][] = [
  ["Older adults", /\bolder adults?\b|\belderly\b|\bpresbycusis\b|\bage[- ]related hearing\b|\baged 6[05]\b|\bnursing home/i],
  ["Newborns / infants", /\bnewborns?\b|\bneonat|\binfants?\b|\bNICU\b|\bpreterm\b/i],
  ["Children", /\bchild(ren)?\b|\bpaediatric|\bpediatric|\bschool[- ]age/i],
  ["Single-sided deafness / asymmetric loss", /\bsingle[- ]sided deafness|\bSSD\b|\bunilateral hearing loss|\basymmetric hearing loss/i],
  ["Cochlear implant users", /\bcochlear implant/i],
  ["Hearing aid users", /\bhearing aid/i],
  ["Cancer / cisplatin exposure", /\bcisplatin|\bcarboplatin|\bplatinum|\bcancer\b|\bchemotherap|\bhepatoblastoma|\bneuroblastoma|\bosteosarcoma|\bmedulloblastoma/i],
  ["Meniere disease", /\bmeni[eè]re/i],
  ["BPPV", /\bbenign paroxysmal positional vertigo|\bBPPV\b/i],
  ["Vestibular schwannoma / NF2", /\bvestibular schwannoma|\bacoustic neuroma|\bneurofibromatosis type 2|\bNF2\b/i],
  ["Otitis media", /\botitis media|\bglue ear|\bmiddle ear effusion|\bOME\b/i],
  ["Cognitive decline / dementia", /\bdementia\b|\bcognitive (decline|impairment)|\bmild cognitive|\balzheimer/i],
  ["Military / noise-exposed workers", /\bmilitary\b|\bveterans?\b|\bsoldiers?\b|\bnoise[- ]exposed|\boccupational noise|\bworkers?\b/i],
  ["Diabetes", /\bdiabet/i],
  ["Traumatic brain injury", /\btraumatic brain injur|\bTBI\b|\bconcussion/i],
];

export function extractPopulation(text: string): string[] {
  return POP_TAGS.filter(([, re]) => re.test(text)).map(([t]) => t);
}

export function categoriseWhyStopped(why: string): string {
  if (!why) return "";
  const w = why.toLowerCase();
  if (/covid|pandemic|sars-cov|coronavirus/.test(w)) return "COVID-19";
  if (/recruit|enrol|enroll|accrual|inclusion rate|participation|participants|subjects|patients? (were|was)? ?(not|un)|low (number|interest)|eligible/.test(w)) return "Recruitment / enrolment";
  if (/fund|budget|financ|grant|money|cost|resources/.test(w)) return "Funding";
  if (/safety|adverse|harm|risk/.test(w)) return "Safety";
  if (/futil|efficacy|ineffect|interim analysis|no benefit|lack of effect|no effect|no reliable|stopping rule|proof of principle|significant difference|saturation|not worth|research question|novelty|similar study/.test(w)) return "Efficacy, futility or scientific";
  if (/sponsor|business|strategic|company|commercial|portfolio|recall|manufacturer|patent/.test(w)) return "Sponsor / business decision";
  if (/\bpi\b|investigator|principal|staff|personnel|student|researcher|collaborator|left the|relocat|retire|leave|time off|another institution/.test(w)) return "Investigator / staffing";
  if (/irb|ethic|regulator|approval|fda/.test(w)) return "Regulatory / ethics";
  if (/corrupt|unreliable|data quality|data loss/.test(w)) return "Data quality";
  if (/device|equipment|technical|software|supply|logistic|site|feasib/.test(w)) return "Logistics / feasibility";
  return "Other / unspecified";
}

function ageGroupsFrom(std: string[] | undefined): string[] {
  const map: Record<string, string> = { CHILD: "Children", ADULT: "Adults", OLDER_ADULT: "Older adults" };
  return (std ?? []).map((s) => map[s] ?? s);
}

function joinText(ps: any): string {
  const parts: string[] = [];
  const d = ps?.descriptionModule;
  if (d?.briefSummary) parts.push(d.briefSummary);
  const di = ps?.designModule?.designInfo;
  if (di?.interventionModelDescription) parts.push(di.interventionModelDescription);
  for (const a of ps?.armsInterventionsModule?.armGroups ?? []) {
    if (a.description) parts.push(a.description);
  }
  for (const i of ps?.armsInterventionsModule?.interventions ?? []) {
    if (i.name) parts.push(i.name);
    if (i.description) parts.push(i.description);
  }
  return parts.join("\n");
}

export function studyToRecord(study: any, domain: string): TrialRecord {
  const ps = study?.protocolSection ?? {};
  const id = ps.identificationModule ?? {};
  const st = ps.statusModule ?? {};
  const de = ps.designModule ?? {};
  const ai = ps.armsInterventionsModule ?? {};
  const el = ps.eligibilityModule ?? {};
  const locs: any[] = ps.contactsLocationsModule?.locations ?? [];
  const text = joinText(ps);
  const condText = [
    ...(ps.conditionsModule?.conditions ?? []),
    ...(ps.conditionsModule?.keywords ?? []),
    id.briefTitle ?? "",
    el.eligibilityCriteria ? String(el.eligibilityCriteria).slice(0, 1500) : "",
  ].join(" ");
  const dose = extractDose(text);
  const interventions: any[] = ai.interventions ?? [];
  const countries = Array.from(new Set(locs.map((l) => l?.country).filter(Boolean))) as string[];
  const nctId: string = id.nctId ?? "";
  const whyStopped: string = st.whyStopped ?? "";
  return {
    nctId,
    title: id.briefTitle ?? id.officialTitle ?? "",
    url: `https://clinicaltrials.gov/study/${nctId}`,
    domains: [domain],
    status: st.overallStatus ?? "UNKNOWN",
    whyStopped,
    stopCategory: categoriseWhyStopped(whyStopped),
    phase: (de.phases ?? []).join("/") || "Not stated",
    allocation: de.designInfo?.allocation ?? "",
    masking: de.designInfo?.maskingInfo?.masking ?? "",
    interventionTypes: Array.from(new Set(interventions.map((i) => i.type).filter(Boolean))),
    interventions: interventions.map((i) => `${i.type ?? ""}: ${i.name ?? ""}`).slice(0, 8),
    enrollment: typeof de.enrollmentInfo?.count === "number" ? de.enrollmentInfo.count : null,
    enrollmentType: de.enrollmentInfo?.type ?? "",
    startDate: st.startDateStruct?.date ?? "",
    completionDate: st.completionDateStruct?.date ?? st.primaryCompletionDateStruct?.date ?? "",
    countries,
    sponsor: ps.sponsorCollaboratorsModule?.leadSponsor?.name ?? "",
    sponsorClass: ps.sponsorCollaboratorsModule?.leadSponsor?.class ?? "",
    hasResults: Boolean(study?.hasResults),
    ageGroups: ageGroupsFrom(el.stdAges),
    minAge: el.minimumAge ?? "",
    maxAge: el.maximumAge ?? "",
    populationTags: extractPopulation(condText + " " + text),
    sessions: dose.sessions,
    minutesPerSession: dose.minutesPerSession,
    sessionsPerWeek: dose.sessionsPerWeek,
    durationWeeks: dose.durationWeeks,
    totalHours: dose.totalHours,
    intensity: dose.intensity,
    delivery: extractDelivery(text),
    interventionCategories: extractInterventionCategories(
      interventions.map((i) => `${i.type ?? ""} ${i.name ?? ""} ${i.description ?? ""}`).join(" ") + " " + (id.briefTitle ?? ""),
    ),
    outcomeTags: extractOutcomeTags(
      (ps.outcomesModule?.primaryOutcomes ?? []).map((o: any) => `${o.measure ?? ""} ${o.description ?? ""}`).join(" "),
    ),
    primaryOutcomes: (ps.outcomesModule?.primaryOutcomes ?? []).map((o: any) => o.measure).filter(Boolean).slice(0, 4),
    doseEvidence: dose.evidence.join(" | ").slice(0, 600),
  };
}
