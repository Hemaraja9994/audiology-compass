// Audiology domain definitions used to query the ClinicalTrials.gov API v2.
// `cond` maps to query.cond, `intr` to query.intr and `term` to query.term (Essie syntax).
// `adv` is an extra Essie expression ANDed into filter.advanced.

export type DomainId =
  | "snhl"
  | "arhl"
  | "ssnhl"
  | "nihl"
  | "hearingaids"
  | "ci"
  | "implants"
  | "tinnitus"
  | "hyperacusis"
  | "vestibular"
  | "apd"
  | "an"
  | "paeds"
  | "ototox"
  | "ar";

export interface DomainDef {
  id: DomainId;
  label: string;
  cond?: string;
  intr?: string;
  term?: string;
  adv?: string;
}

const HL = '"hearing loss" OR deafness OR "hearing impairment"';

export const DOMAINS: DomainDef[] = [
  {
    id: "snhl",
    label: "Sensorineural and conductive hearing loss",
    cond: '"sensorineural hearing loss" OR "conductive hearing loss" OR "mixed hearing loss" OR otosclerosis OR "hearing loss, sensorineural" OR "hearing loss, conductive"',
  },
  {
    id: "arhl",
    label: "Age-related hearing loss",
    cond: 'presbycusis OR "age-related hearing loss" OR "age related hearing loss"',
  },
  {
    id: "ssnhl",
    label: "Sudden sensorineural hearing loss",
    cond: '"sudden sensorineural hearing loss" OR "sudden hearing loss" OR "sudden deafness" OR "idiopathic sudden sensorineural hearing loss"',
  },
  {
    id: "nihl",
    label: "Noise-induced hearing loss",
    cond: '"noise-induced hearing loss" OR "noise induced hearing loss" OR "acoustic trauma" OR "hearing loss, noise-induced"',
  },
  {
    id: "hearingaids",
    label: "Hearing aids",
    intr: '"hearing aid" OR "hearing aids" OR "sound amplification" OR "personal sound amplification"',
  },
  {
    id: "ci",
    label: "Cochlear implants",
    intr: '"cochlear implant" OR "cochlear implants" OR "cochlear implantation"',
  },
  {
    id: "implants",
    label: "Bone conduction, middle ear and brainstem implants",
    cond: `${HL} OR "single-sided deafness" OR "conductive hearing loss" OR "mixed hearing loss" OR microtia OR "aural atresia"`,
    intr: '"bone conduction" OR "bone-anchored" OR "bone anchored" OR "middle ear implant" OR "active middle ear implant" OR "auditory brainstem implant" OR "vibrant soundbridge" OR osseointegrated',
  },
  { id: "tinnitus", label: "Tinnitus", cond: "tinnitus" },
  {
    id: "hyperacusis",
    label: "Hyperacusis and sound tolerance",
    cond: 'hyperacusis OR misophonia OR "decreased sound tolerance" OR "sound sensitivity"',
  },
  {
    id: "vestibular",
    label: "Vestibular disorders and dizziness",
    cond: `vertigo OR dizziness OR "vestibular disease" OR "vestibular diseases" OR "benign paroxysmal positional vertigo" OR "vestibular neuritis" OR "vestibular neuronitis" OR "Meniere disease" OR "Meniere's disease" OR "vestibular migraine" OR "vestibular hypofunction" OR "persistent postural-perceptual dizziness" OR labyrinthitis`,
  },
  {
    id: "apd",
    label: "Auditory processing disorder",
    cond: '"auditory processing disorder" OR "central auditory processing disorder" OR "auditory processing disorders" OR "auditory perceptual disorders"',
  },
  {
    id: "an",
    label: "Auditory neuropathy",
    cond: '"auditory neuropathy" OR "auditory neuropathy spectrum disorder" OR "auditory dyssynchrony"',
  },
  {
    id: "paeds",
    label: "Newborn and paediatric hearing",
    cond: `${HL} OR "congenital hearing loss" OR "newborn hearing screening"`,
    adv: "AREA[MaximumAge]RANGE[MIN, 18 years]",
  },
  {
    id: "ototox",
    label: "Ototoxicity and otoprotection",
    cond: 'ototoxicity OR "drug-induced hearing loss" OR "cisplatin-induced hearing loss" OR "ototoxic hearing loss"',
  },
  {
    id: "ar",
    label: "Auditory training and aural rehabilitation",
    cond: `${HL} OR "cochlear implant" OR "hearing aid"`,
    term: '"auditory training" OR "aural rehabilitation" OR "auditory rehabilitation" OR "auditory-verbal" OR "auditory verbal" OR "listening training" OR "speech perception training" OR "communication training" OR speechreading OR lipreading',
  },
];

export const DOMAIN_IDS = DOMAINS.map((d) => d.id);

export function domainLabel(id: string): string {
  return DOMAINS.find((d) => d.id === id)?.label ?? id;
}

// Audiology trials commonly test drugs (for example steroids for sudden hearing loss, otoprotectants)
// and procedures (implant surgery, repositioning manoeuvres), so these are offered alongside
// behavioural and device interventions. Default: Behavioral + Device + Procedure.
export const INTERVENTION_TYPES = ["BEHAVIORAL", "DEVICE", "PROCEDURE", "DRUG", "BIOLOGICAL", "GENETIC", "OTHER"] as const;
export type InterventionTypeFilter = (typeof INTERVENTION_TYPES)[number];
export const DEFAULT_TYPES: string[] = ["BEHAVIORAL", "DEVICE", "PROCEDURE"];
