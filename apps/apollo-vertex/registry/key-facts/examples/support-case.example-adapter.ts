/**
 * EXAMPLE ADAPTER. Not shipped: it shows how a second solution (customer
 * support) maps its own data into the same key facts view model.
 */
import type { KeyFactsViewModel } from "../key-facts.view-model";

interface SupportCase {
  caseId: string;
  priority: 1 | 2 | 3;
  assignee?: { name: string };
  openedAt: string;
  channel: string;
}

export function caseToKeyFacts(supportCase: SupportCase): KeyFactsViewModel {
  return {
    subject: supportCase.caseId,
    facts: [
      { id: "priority", label: "Priority", value: `P${supportCase.priority}` },
      // No assignee yet: the occupant shows it as not set.
      {
        id: "assignee",
        label: "Assignee",
        ...(supportCase.assignee && { value: supportCase.assignee.name }),
      },
      { id: "opened", label: "Opened", value: supportCase.openedAt },
      { id: "channel", label: "Channel", value: supportCase.channel },
    ],
  };
}

export const SUPPORT_CASE = caseToKeyFacts({
  caseId: "CASE-5520",
  priority: 2,
  openedAt: "Sep 28, 2026",
  channel: "Email",
});
