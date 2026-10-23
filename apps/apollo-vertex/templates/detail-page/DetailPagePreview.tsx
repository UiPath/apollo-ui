"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { MetricCard } from "@/components/ui/metric-card";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBackButton,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderField,
  PageHeaderFieldLabel,
  PageHeaderFieldValue,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { TimelineMarker, TimelineRowLayout } from "@/components/ui/timeline";
import { DetailPage } from "@/registry/detail-page/detail-page";
import { useDetailPage } from "@/registry/detail-page/use-detail-page";

interface InvoiceRecord {
  id: string;
  vendor: string;
  amount: string;
  due: string;
  status: string;
  po: string;
}

const invoices: readonly InvoiceRecord[] = [
  {
    id: "INV-4021",
    vendor: "Acme Corp",
    amount: "$12,450.00",
    due: "Mar 27, 2026",
    status: "In progress",
    po: "PO-2026-0142",
  },
  {
    id: "INV-4020",
    vendor: "Northwind",
    amount: "$3,280.00",
    due: "Mar 18, 2026",
    status: "Needs review",
    po: "PO-2026-0118",
  },
  {
    id: "INV-4018",
    vendor: "Globex",
    amount: "$860.00",
    due: "Apr 2, 2026",
    status: "Matched",
    po: "PO-2026-0094",
  },
];

const activity = [
  {
    title: "Sync to ERP",
    detail: "Queued for the next run",
    marker: <TimelineMarker variant="ai-upcoming" />,
  },
  {
    title: "Posting entry",
    detail: "Writing to the ledger",
    marker: <TimelineMarker variant="ai-progress" />,
  },
  {
    title: "Approved",
    detail: "Accounts payable",
    marker: <TimelineMarker variant="user" initials="AP" />,
  },
  {
    title: "Agent reviewed",
    detail: "PO matched, terms verified",
    marker: <TimelineMarker variant="completed-ai" />,
  },
] as const;

export function DetailPagePreview() {
  const [selectedId, setSelectedId] = useState(invoices[0]?.id ?? "");
  const invoice =
    invoices.find((entry) => entry.id === selectedId) ?? invoices[0];
  const state = useDetailPage({
    panels: "both",
    start: { placement: "beside-header", defaultOpen: true },
    end: { placement: "below-header", defaultOpen: true },
  });

  if (!invoice) return null;

  return (
    <div className="h-full bg-background text-foreground">
      <DetailPage
        state={state}
        header={
          <PageHeader bordered>
            <PageHeaderNav>
              <PageHeaderBackButton />
              <PageHeaderTitleGroup>
                <PageHeaderTitle>{invoice.id}</PageHeaderTitle>
                <PageHeaderDescription>{invoice.vendor}</PageHeaderDescription>
              </PageHeaderTitleGroup>
            </PageHeaderNav>
            <PageHeaderContent>
              <PageHeaderField>
                <PageHeaderFieldLabel>Status</PageHeaderFieldLabel>
                <PageHeaderFieldValue>
                  <Badge variant="secondary" status="info">
                    {invoice.status}
                  </Badge>
                </PageHeaderFieldValue>
              </PageHeaderField>
              <PageHeaderField>
                <PageHeaderFieldLabel>Purchase order</PageHeaderFieldLabel>
                <PageHeaderFieldValue>{invoice.po}</PageHeaderFieldValue>
              </PageHeaderField>
            </PageHeaderContent>
            <PageHeaderActions>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => state.setPanelOpen("start", !state.open.start)}
              >
                {state.open.start ? "Hide queue" : "Show queue"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => state.setPanelOpen("end", !state.open.end)}
              >
                {state.open.end ? "Hide activity" : "Show activity"}
              </Button>
              <Button type="button" size="sm">
                Approve
              </Button>
            </PageHeaderActions>
          </PageHeader>
        }
        startSidebar={
          <Queue
            invoices={invoices}
            selectedId={invoice.id}
            onSelect={setSelectedId}
          />
        }
        content={<InvoiceContent invoice={invoice} />}
        endSidebar={<Activity />}
      />
    </div>
  );
}

function Queue({
  invoices: records,
  selectedId,
  onSelect,
}: {
  invoices: readonly InvoiceRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside
      aria-label="Queue"
      className="h-full overflow-y-auto bg-muted/40 p-2"
    >
      <ItemGroup>
        {records.map((record) => (
          <Item
            key={record.id}
            asChild
            variant={record.id === selectedId ? "outline" : "muted"}
            size="sm"
          >
            <button
              type="button"
              aria-current={record.id === selectedId ? "true" : "false"}
              className="w-full text-left"
              onClick={() => onSelect(record.id)}
            >
              <ItemContent>
                <ItemTitle>{record.id}</ItemTitle>
                <ItemDescription>
                  {record.vendor} · {record.amount}
                </ItemDescription>
              </ItemContent>
            </button>
          </Item>
        ))}
      </ItemGroup>
    </aside>
  );
}

function InvoiceContent({ invoice }: { invoice: InvoiceRecord }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Amount" value={invoice.amount} />
        <MetricCard label="Due" value={invoice.due} />
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Vendor</dt>
              <dd className="font-medium">{invoice.vendor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Purchase order</dt>
              <dd className="font-medium">{invoice.po}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline">{invoice.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Terms</dt>
              <dd className="font-medium">Net 30</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Activity() {
  return (
    <aside aria-label="Activity" className="h-full overflow-y-auto p-4">
      <h2 className="mb-4 text-sm font-semibold">Activity</h2>
      <ol>
        {activity.map((event, index) => (
          <li key={event.title}>
            <TimelineRowLayout
              isLast={index === activity.length - 1}
              marker={event.marker}
            >
              <div
                className={index === activity.length - 1 ? "" : "pb-6"}
              >
                <p className="text-sm font-medium text-foreground">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground">{event.detail}</p>
              </div>
            </TimelineRowLayout>
          </li>
        ))}
      </ol>
    </aside>
  );
}
