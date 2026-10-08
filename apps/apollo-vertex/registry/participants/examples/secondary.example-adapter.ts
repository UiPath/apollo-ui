/**
 * EXAMPLE ADAPTER (secondary). Not shipped: it shows how a solution (home
 * renovation) maps its own data into the participants view model. Adapters
 * belong to solutions.
 */
import type { ParticipantsViewModel } from "../participants.view-model";

interface RenovationJob {
  jobNumber: number;
  crew: {
    tradeId: string;
    company: string;
    trade?: string;
    lastVisit?: string;
  }[];
}

export function jobToParticipants(job: RenovationJob): ParticipantsViewModel {
  return {
    subject: `JOB-${job.jobNumber}`,
    participants: job.crew.map((member) => ({
      id: member.tradeId,
      name: member.company,
      ...(member.trade && { role: member.trade }),
      ...(member.lastVisit && { lastActive: `On site ${member.lastVisit}` }),
    })),
  };
}

export const SECONDARY = jobToParticipants({
  jobNumber: 5812,
  crew: [
    {
      tradeId: "t-1",
      company: "Brightline Electric",
      trade: "Electrician",
      lastVisit: "Sep 24",
    },
    {
      tradeId: "t-2",
      company: "Hollis & Sons Plumbing",
      trade: "Plumber",
      lastVisit: "Sep 26",
    },
    { tradeId: "t-3", company: "Cedar Ridge Carpentry", trade: "Carpenter" },
    { tradeId: "t-4", company: "M. Alvarez", lastVisit: "Sep 27" },
  ],
});
