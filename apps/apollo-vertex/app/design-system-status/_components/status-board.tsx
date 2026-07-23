import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/registry/badge/badge";
import { fetchJiraIssues } from "@/lib/jira";
import {
  processIssues,
  type BadgeLabel,
  type BoardData,
  type ProcessedCard,
} from "@/lib/jira-resolve";

// ─── status tag ──────────────────────────────────────────────────────────────

function StatusTag({ status }: { status: string }) {
  const s = status.toLowerCase();

  if (s === "in review" || s === "review") {
    return (
      <Badge variant="default" status="info">
        In Review
      </Badge>
    );
  }
  if (s === "in progress") {
    return <Badge variant="secondary">In Progress</Badge>;
  }
  if (s === "closed" || s === "done") {
    return (
      <Badge variant="secondary" status="success">
        Delivered
      </Badge>
    );
  }
  return <Badge variant="secondary">{status}</Badge>;
}

// ─── label badge ─────────────────────────────────────────────────────────────

function LegalBadge({ label }: { label: BadgeLabel }) {
  if (label === "required") {
    return (
      <Badge variant="secondary" status="error">
        Required
      </Badge>
    );
  }
  if (label === "best-practice") {
    return (
      <Badge variant="secondary" status="warning">
        Best practice
      </Badge>
    );
  }
  return null;
}

// ─── card ────────────────────────────────────────────────────────────────────

function StatusCard({ card }: { card: ProcessedCard }) {
  const isExternal = card.link.startsWith("http");

  return (
    <Link
      href={card.link}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <StatusTag status={card.status} />
          {card.badge && <LegalBadge label={card.badge} />}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="text-sm font-medium leading-snug text-card-foreground">
        {card.summary}
      </p>

      <div className="flex flex-col gap-0.5">
        {card.epicName && (
          <p className="text-xs text-muted-foreground/70">{card.epicName}</p>
        )}
        <p className="text-xs text-muted-foreground">{card.key}</p>
      </div>
    </Link>
  );
}

// ─── section ─────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  icon,
  cards,
  empty,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  cards: ProcessedCard[];
  empty: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {cards.length}
        </span>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <StatusCard key={card.key} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── error state ─────────────────────────────────────────────────────────────

function SetupError({ message }: { message: string }) {
  const isMissingConfig = message.includes("Missing Jira configuration");
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2 text-warning-foreground">
        <TriangleAlert className="size-5" />
        <span className="font-semibold">
          {isMissingConfig
            ? "Jira credentials not configured"
            : "Could not load Jira data"}
        </span>
      </div>
      {isMissingConfig ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Add{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              JIRA_BASE_URL
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              JIRA_EMAIL
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              JIRA_API_TOKEN
            </code>{" "}
            to{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              apps/apollo-vertex/.env.local
            </code>
            , then restart the dev server.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

// ─── board ───────────────────────────────────────────────────────────────────

export async function StatusBoard() {
  let data: BoardData | null = null;
  let error: string | null = null;

  try {
    const issues = await fetchJiraIssues();
    const jiraBaseUrl =
      process.env.JIRA_BASE_URL ?? "https://uipath.atlassian.net";
    data = processIssues(issues, jiraBaseUrl);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <div className="not-prose mt-6">
        <SetupError message={error} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="not-prose mt-6 space-y-10">
      <Section
        title="Recently Delivered"
        description="Shipped in the last 30 days. Links go directly to the Vertex page."
        icon={<CheckCircle2 className="size-5 shrink-0 text-success" />}
        cards={data.delivered}
        empty="Nothing shipped in the last 30 days."
      />

      <Section
        title="Coming Soon"
        description="In Review is closest to landing and sorted first."
        icon={<Clock className="size-5 shrink-0 text-info" />}
        cards={data.comingSoon}
        empty="Nothing in progress right now."
      />

      <Section
        title="Backlog"
        description="Planned work not yet started."
        icon={<Inbox className="size-5 shrink-0 text-muted-foreground" />}
        cards={data.backlog}
        empty="Backlog is empty."
      />
    </div>
  );
}
