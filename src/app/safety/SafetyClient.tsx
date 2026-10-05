"use client";

import { useState } from "react";

interface Section {
  id: string;
  title: string;
  intro: string;
  action: string;
  urgent?: boolean;
  items: string[];
}

const SECTIONS: Section[] = [
  {
    id: "urgent",
    title: "Seek urgent or emergency medical help",
    intro: "These signs can indicate a medical emergency. Follow your local emergency pathway first.",
    action: "Arrange immediate medical assessment through your local emergency pathway.",
    urgent: true,
    items: [
      "Vertigo, dizziness or sudden hearing loss with new neurological signs: facial weakness, double vision, slurred speech, limb weakness or numbness, inability to stand or walk, or a sudden severe headache (possible stroke)",
      "Vertigo or hearing loss after a head injury, or clear fluid or blood from the ear or nose after trauma",
      "Ear pain with swelling, redness or tenderness behind the ear, the ear pushed forward, or high fever (possible mastoiditis)",
      "Severe or persistent ear pain with discharge in a person with diabetes or reduced immunity (possible necrotising otitis externa)",
      "Facial weakness together with ear pain, ear discharge or blisters in or around the ear",
      "Tinnitus or hearing loss with thoughts of self-harm or severe distress (urgent mental health support)",
    ],
  },
  {
    id: "ssnhl",
    title: "Sudden hearing loss: urgent ENT referral",
    intro: "The AAO-HNSF guideline (2019 update) defines sudden hearing loss as onset over 72 hours or less. Treatment options are time-sensitive.",
    action: "Refer urgently (same day where possible) to ENT. Confirm a sensorineural loss with audiometry as soon as possible (the guideline says within 14 days of onset). Corticosteroids, if offered, are an option within 2 weeks of onset; retrocochlear evaluation (MRI or ABR) is recommended.",
    urgent: true,
    items: [
      "Hearing loss in one or both ears that developed over 72 hours or less",
      "No obvious conductive cause on otoscopy (for example wax or acute infection); tuning fork or audiometric findings suggest a sensorineural loss",
      "Sudden loss with vertigo, tinnitus or aural fullness",
      "Bilateral sudden loss, recurrent episodes, or focal neurological findings (the guideline asks clinicians to assess for these)",
      "Incomplete recovery 2 to 6 weeks after onset (the guideline recommends offering, or referring for, intratympanic steroid therapy)",
    ],
  },
  {
    id: "asym",
    title: "Asymmetric or unilateral sensorineural hearing loss",
    intro: "Asymmetry can be the first sign of retrocochlear pathology such as vestibular schwannoma.",
    action: "Refer for ENT evaluation; imaging or other retrocochlear assessment follows local protocols. Use the Assessment division asymmetry check to document the criterion used.",
    items: [
      "Interaural threshold difference meeting your service's asymmetry criterion (for example 15 dB or more at 3 kHz, or at two or more frequencies)",
      "Unilateral or asymmetric word recognition scores out of proportion to the thresholds",
      "Unilateral hearing loss with unilateral tinnitus or imbalance",
      "Progressive one-sided hearing loss across serial audiograms",
      "Absent or elevated acoustic reflexes or abnormal ABR on the poorer side, when tested",
    ],
  },
  {
    id: "tinnitus",
    title: "Tinnitus: signs that need medical evaluation",
    intro: "Most tinnitus is bilateral and associated with hearing loss. Some patterns need further medical assessment.",
    action: "Refer to ENT or the treating doctor for evaluation. Offer audiological assessment and support for bothersome tinnitus.",
    items: [
      "Pulsatile tinnitus (in time with the heartbeat)",
      "Unilateral tinnitus, especially with asymmetric hearing loss",
      "Tinnitus with sudden hearing loss, vertigo or focal neurological symptoms",
      "Tinnitus with ear pain, discharge or a feeling of pressure that does not settle",
      "Bothersome tinnitus causing marked anxiety, low mood or sleep disturbance",
    ],
  },
  {
    id: "vestibular",
    title: "Vertigo and dizziness: peripheral or central?",
    intro: "Most positional vertigo is BPPV, but some features point to a central (brain) cause.",
    action: "Central features need prompt medical or neurological assessment. Typical posterior canal BPPV (vertigo with torsional, upbeating nystagmus on the Dix-Hallpike test) can be treated with a canalith repositioning procedure by a trained clinician.",
    items: [
      "Positional nystagmus that is purely downbeating or purely torsional, does not fatigue, or does not match the canal tested",
      "Vertigo with new headache, neck pain, or any neurological sign (see the urgent section)",
      "Severe imbalance (unable to walk unaided) out of proportion to the vertigo",
      "Positional symptoms that persist after repositioning; the BPPV guideline recommends reassessment within 1 month",
      "Recurrent episodes of vertigo lasting minutes to hours with fluctuating hearing loss, tinnitus or aural fullness (consider Meniere disease; refer to ENT)",
      "Falls or high fall risk, impaired mobility, or no support at home (these modify management in the BPPV guideline)",
    ],
  },
  {
    id: "ear",
    title: "Ear examination findings that need medical referral",
    intro: "Refer before fitting hearing aids, taking impressions or irrigating the ear when these are present.",
    action: "Refer to ENT or the treating doctor as appropriate.",
    items: [
      "Ear discharge (otorrhoea) or bleeding from the ear",
      "Ear pain, or a visible perforation, retraction pocket, mass or debris suggesting cholesteatoma",
      "Foreign body, or wax that cannot be safely removed",
      "Conductive hearing loss without an obvious cause, or a significant air-bone gap",
      "Visible ear deformity (congenital or traumatic)",
    ],
  },
  {
    id: "paeds",
    title: "Newborn and paediatric hearing: follow-up timelines",
    intro: "JCIH 2019 retains the 1-3-6 benchmarks and encourages 1-2-3 timelines where programmes already meet 1-3-6.",
    action: "Arrange timely diagnostic audiology and early intervention referral. Do not delay referral because of a passed screen when there is concern.",
    items: [
      "Newborn did not pass the hearing screen: complete screening by 1 month of age and diagnostic audiological evaluation by 3 months (or by 2 months where 1-2-3 is in place)",
      "Confirmed permanent hearing loss: enrol in early intervention by 6 months (or by 3 months where 1-2-3 is in place)",
      "Risk factors for delayed-onset or progressive hearing loss (for example NICU stay over 5 days, congenital CMV, family history, craniofacial anomalies, bacterial meningitis, ototoxic medication): arrange audiological monitoring as recommended by JCIH",
      "Caregiver concern about hearing, speech or language development at any age, even after a passed newborn screen",
      "Persistent otitis media with effusion with hearing difficulty, speech delay or school concerns",
    ],
  },
  {
    id: "ototox",
    title: "Ototoxic medication: monitoring",
    intro: "Platinum chemotherapy (for example cisplatin), aminoglycoside antibiotics and some other drugs can damage hearing or balance.",
    action: "Obtain a baseline before or soon after the first dose, monitor during treatment, and report confirmed changes to the treating team. Use the Assessment division ototoxicity check (ASHA 1994 criteria).",
    items: [
      "Patient starting cisplatin, carboplatin at high dose, aminoglycosides, or other known ototoxic drugs",
      "No baseline audiogram (include extended high frequencies where available)",
      "New tinnitus, hearing difficulty, aural fullness or imbalance during treatment",
      "Threshold shift meeting the ASHA criteria (20 dB at one frequency, 10 dB at two adjacent frequencies, or loss of response at three consecutive frequencies)",
      "Children receiving ototoxic treatment (speech and language development at risk)",
    ],
  },
];

const SOURCES = [
  {
    label: "Chandrasekhar SS, et al. Clinical Practice Guideline: Sudden Hearing Loss (Update). Otolaryngol Head Neck Surg. 2019;161(1 Suppl):S1-S45. doi:10.1177/0194599819859885",
    href: "https://doi.org/10.1177/0194599819859885",
  },
  {
    label: "Bhattacharyya N, et al. Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update). Otolaryngol Head Neck Surg. 2017;156(3 Suppl):S1-S47. doi:10.1177/0194599816689667",
    href: "https://doi.org/10.1177/0194599816689667",
  },
  {
    label: "Tunkel DE, et al. Clinical Practice Guideline: Tinnitus. Otolaryngol Head Neck Surg. 2014;151(2 Suppl):S1-S40. doi:10.1177/0194599814545325",
    href: "https://doi.org/10.1177/0194599814545325",
  },
  {
    label: "Joint Committee on Infant Hearing. Year 2019 Position Statement: Principles and Guidelines for Early Hearing Detection and Intervention Programs. J Early Hear Detect Interv. 2019;4(2):1-44. doi:10.15142/fptk-b748",
    href: "https://doi.org/10.15142/fptk-b748",
  },
  { label: "World Health Organization. World Report on Hearing. Geneva: WHO; 2021", href: "https://www.who.int/publications/i/item/9789240020481" },
  { label: "ASHA (1994). Audiologic Management of Individuals Receiving Cochleotoxic Drug Therapy", href: "https://www.asha.org/policy/gl1994-00003/" },
  { label: "ASHA Practice Portal: Hearing Loss in Adults", href: "https://www.asha.org/practice-portal/clinical-topics/hearing-loss/" },
  { label: "ASHA Practice Portal: Hearing Loss in Children", href: "https://www.asha.org/practice-portal/clinical-topics/permanent-childhood-hearing-loss/" },
  { label: "ASHA Practice Portal: Tinnitus and Hyperacusis", href: "https://www.asha.org/practice-portal/clinical-topics/tinnitus-and-hyperacusis/" },
  { label: "ASHA Practice Portal: Balance System Disorders", href: "https://www.asha.org/practice-portal/clinical-topics/balance-system-disorders/" },
  { label: "ASHA Practice Portal: Central Auditory Processing Disorder", href: "https://www.asha.org/practice-portal/clinical-topics/central-auditory-processing-disorder/" },
];

export default function SafetyClient() {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setTicked((t) => ({ ...t, [k]: !t[k] }));
  const count = (s: Section) => s.items.filter((_, i) => ticked[`${s.id}-${i}`]).length;
  const totalTicked = Object.values(ticked).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Safety division: audiology and vestibular red flags</h1>
        <div className="mt-2 rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
          <b>Educational use only.</b> These general prompts summarise widely taught warning signs. They are not a
          diagnostic tool, not exhaustive, and not a substitute for clinical judgment, local protocols or medical
          advice. Nothing you tick here is saved or sent anywhere.
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center gap-3">
        <span className="text-sm">{totalTicked} item(s) ticked</span>
        <button className="btn-outline" onClick={() => setTicked({})}>Clear all</button>
        <button className="btn" onClick={() => window.print()}>Print checklist</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => {
          const c = count(s);
          return (
            <section key={s.id} className={`card ${s.urgent ? "border-red-400" : ""}`}>
              <h2 className={s.urgent ? "text-lg font-bold text-red-700" : "h2"}>{s.title}</h2>
              <p className="muted mt-1">{s.intro}</p>
              <ul className="mt-2 space-y-1.5">
                {s.items.map((it, i) => {
                  const k = `${s.id}-${i}`;
                  return (
                    <li key={k}>
                      <label className="flex items-start gap-2 text-sm">
                        <input type="checkbox" className="mt-1" checked={!!ticked[k]} onChange={() => toggle(k)} />
                        <span>{it}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {c > 0 && (
                <div className={`mt-3 rounded p-2 text-sm ${s.urgent ? "bg-red-50 text-red-800" : "bg-plum-light text-plum"}`}>
                  <b>{c} sign(s) noted.</b> {s.action}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="card">
        <h2 className="h2">Further reading (verified links)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a className="text-plum underline" href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone-500">
          Checklist wording is a general summary written for this tool and is not quoted from these sources. Always
          follow the guidance and protocols that apply in your setting and country.
        </p>
      </section>
    </div>
  );
}
