/**
 * EXAMPLE ADAPTER (secondary). Not shipped: it shows how a solution
 * (customer support) maps its own data into the queue view model. Adapters
 * belong to solutions.
 */
import type { OccupantTone } from "@/components/ui/occupant";
import type { QueueViewModel } from "../queue.view-model";

interface SupportTicket {
  key: string;
  summary: string;
  category: "billing" | "login" | "export" | "integration" | "feature_request";
  priority: 1 | 2 | 3 | 4;
  /** When the response target is breached. None for feature requests. */
  slaBreachAt?: Date;
  linkedTickets: string[];
  state: "new" | "pending_customer" | "solved";
}

const CATEGORY_LABEL: Record<SupportTicket["category"], string> = {
  billing: "Billing question",
  login: "Can't sign in",
  export: "Export failing",
  integration: "Integration error",
  feature_request: "Feature request",
};

const PRIORITY_TONE: Record<SupportTicket["priority"], OccupantTone> = {
  1: "error",
  2: "warning",
  3: "info",
  4: "neutral",
};

const FILTERS = [
  { id: "new", label: "New" },
  { id: "pending_customer", label: "Waiting on customer" },
  { id: "solved", label: "Solved" },
] satisfies { id: SupportTicket["state"]; label: string }[];

// A fixed moment, so the example reads the same every time.
const NOW = new Date(2026, 8, 30, 13, 0);
const MINUTE_MS = 60 * 1000;
const SOON_MS = 4 * 60 * MINUTE_MS;

const span = (minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;

function timeLeft(breachAt: Date): string {
  const minutes = Math.round((breachAt.getTime() - NOW.getTime()) / MINUTE_MS);
  return minutes < 0 ? `Overdue ${span(-minutes)}` : `${span(minutes)} left`;
}

function slaGroup(breachAt: Date | undefined): string {
  if (!breachAt) return "No deadline";
  return breachAt.getTime() - NOW.getTime() <= SOON_MS
    ? "Due soon"
    : "Later today";
}

const byDeadline = (ticket: SupportTicket) =>
  ticket.slaBreachAt?.getTime() ?? Number.POSITIVE_INFINITY;

export function ticketsToQueue(
  view: string,
  tickets: SupportTicket[],
): QueueViewModel {
  return {
    subject: view,
    filters: FILTERS,
    items: tickets
      .toSorted((a, b) => byDeadline(a) - byDeadline(b))
      .map((ticket) => ({
        id: ticket.key,
        title: ticket.summary,
        ...(ticket.slaBreachAt && { value: timeLeft(ticket.slaBreachAt) }),
        status: {
          label: CATEGORY_LABEL[ticket.category],
          tone: PRIORITY_TONE[ticket.priority],
          ...(ticket.linkedTickets.length > 0 && {
            more: ticket.linkedTickets.length,
          }),
        },
        reference: ticket.key,
        group: slaGroup(ticket.slaBreachAt),
        filter: ticket.state,
      })),
  };
}

const at = (hours: number, minutes = 0) =>
  new Date(2026, 8, 30, hours, minutes);

export const SECONDARY = ticketsToQueue("Tier 2 support", [
  {
    key: "SUP-4412",
    summary: "Monthly report export stops at 80%",
    category: "export",
    priority: 2,
    slaBreachAt: at(15, 15),
    linkedTickets: ["SUP-4398"],
    state: "new",
  },
  {
    key: "SUP-4420",
    summary: "SSO users locked out after the certificate renewal",
    category: "login",
    priority: 1,
    slaBreachAt: at(12, 40),
    linkedTickets: ["SUP-4421", "SUP-4423", "SUP-4425"],
    state: "new",
  },
  {
    key: "SUP-4381",
    summary: "Charged twice for the September seat increase",
    category: "billing",
    priority: 3,
    slaBreachAt: at(16, 30),
    linkedTickets: [],
    state: "pending_customer",
  },
  {
    key: "SUP-4402",
    summary: "Webhook deliveries return 401 since Monday",
    category: "integration",
    priority: 2,
    slaBreachAt: at(19, 0),
    linkedTickets: [],
    state: "new",
  },
  {
    key: "SUP-4376",
    summary: "Invoice PDF missing the purchase order number",
    category: "billing",
    priority: 4,
    slaBreachAt: at(21, 0),
    linkedTickets: [],
    state: "solved",
  },
  {
    key: "SUP-4390",
    summary: "Add a dark theme to the customer portal",
    category: "feature_request",
    priority: 4,
    linkedTickets: ["SUP-4011"],
    state: "pending_customer",
  },
]);
