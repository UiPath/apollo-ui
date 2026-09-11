// Cast for J3. Sam Rivera and Dana Kim already exist in J1/J2 seeds under
// different roles (GuidedBuyingShell.tsx's persona list, RequestEnvelope.tsx's
// provenance copy). Declared here anyway per spec. Reconciling the two casts
// is a later prompt, not this one.

export type PersonId =
  | "priya-nair"
  | "sam-rivera"
  | "dana-kim"
  | "casey-morgan"
  | "elena-vasquez"
  | "ravi-mehta"
  | "marcus-webb"
  | "infosec-team"
  | "legal-team";

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  org: string;
  /** Only Casey Morgan, the external supplier contact, carries one. */
  email?: string;
}

export const PEOPLE: Record<PersonId, Person> = {
  "priya-nair": {
    id: "priya-nair",
    name: "Priya Nair",
    role: "Requester",
    org: "IT, Denver",
  },
  "sam-rivera": {
    id: "sam-rivera",
    name: "Sam Rivera",
    role: "Procurement buyer",
    org: "Procurement",
  },
  "dana-kim": {
    id: "dana-kim",
    name: "Dana Kim",
    // PH-07
    role: "Sr. Director, budget owner",
    org: "IT Collaboration (US)",
  },
  "casey-morgan": {
    id: "casey-morgan",
    name: "Casey Morgan",
    role: "Supplier contact",
    org: "ConnectMeet",
    email: "c.morgan@connectmeet.com",
  },
  "elena-vasquez": {
    id: "elena-vasquez",
    name: "Elena Vasquez",
    role: "VP Procurement",
    org: "Procurement",
  },
  "ravi-mehta": {
    id: "ravi-mehta",
    name: "Ravi Mehta",
    role: "Config Admin",
    org: "Automation CoE",
  },
  "marcus-webb": {
    id: "marcus-webb",
    name: "Marcus Webb",
    role: "Requester",
    org: "Denver",
  },
  "infosec-team": {
    id: "infosec-team",
    name: "InfoSec team",
    role: "Security reviewer",
    org: "Security",
  },
  "legal-team": {
    id: "legal-team",
    name: "Legal",
    role: "DPA reviewer",
    org: "Legal",
  },
};

export function getPerson(id: PersonId): Person {
  return PEOPLE[id];
}
