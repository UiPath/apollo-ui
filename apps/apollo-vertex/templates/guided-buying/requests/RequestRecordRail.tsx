"use client";

// oxlint-disable max-lines -- the request rail: items/total/budget,
// supplier/logistics, the order form attachment, and linked records, one
// component so the highlight/ref plumbing (registerRef, highlightField)
// stays in one place rather than split across files (Chunk C2 growth).

import { ChevronDown, FileText, Link as LinkIcon } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ATTACHMENT_STATE_LABEL,
  type DecisionDetail,
  type DecisionStatus,
  type RailFieldKey,
} from "./data";
import { useRequests } from "./requests-context";
import { TruncatedSubtitle } from "./TruncatedSubtitle";

/**
 * The budget-impact card: a label, a percentage against the "committed"/
 * "after approval" split, a progress bar, and the remaining-pool detail
 * line. Extracted from the rail's own "Total" field (Chunk C1) so a second
 * caller (the P2-only budget impact module on REQ-10482's decision page,
 * in the main column rather than the rail) can render the identical card
 * instead of a second hand-built one. `className`/`ref` are the rail's own
 * hook for its highlight-flash behaviour; the main-column caller passes
 * neither.
 */
export function BudgetImpactCallout({
  budget,
  approved,
  className,
  ref,
}: {
  budget: DecisionDetail["packet"]["budget"];
  approved: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "space-y-2 rounded-lg border border-border bg-muted/30 p-3 font-normal",
        className,
      )}
    >
      <p className="text-xs font-medium text-foreground">{budget.label}</p>
      <p className="text-xs text-foreground">
        {budget.pct} {approved ? "committed" : "after approval"}
      </p>
      <Progress value={Number.parseFloat(budget.pct)} className="h-1.5" />
      <p className="text-xs text-muted-foreground">{budget.detail}</p>
    </div>
  );
}

export interface RequestRecordRailHandle {
  /** Flashes the field. Hovering a mark calls this with no `scroll` — the
   * rail is already on screen, so hover shouldn't also yank the page.
   * Click/keyboard passes `scroll: true` to bring the field into view first. */
  highlightField: (key: RailFieldKey, options?: { scroll?: boolean }) => void;
}

interface RequestRecordRailProps {
  detail: DecisionDetail;
  status: DecisionStatus;
  onOpenPo: () => void;
  /** Opens the order form preview overlay (Chunk C2: previously a no-op —
   * the C1 cleanup investigated reusing WorkbenchDetail.tsx's own "Source"
   * tab, but it's private to that file, coupled to its own local Detail
   * type, and lives on the buyer's surface, not the approver's, with no
   * deep link to reach it. DecisionWindow.tsx now owns a real preview
   * overlay and passes this the same way it already passes onOpenPo). */
  onPreviewAttachment: () => void;
}

function FieldRow({
  fieldKey,
  label,
  highlighted,
  registerRef,
  children,
}: {
  fieldKey: RailFieldKey;
  /** Chunk C2: an empty string renders no label at all — the "Total" slot
   * when a recurring commitment replaces it with the budget callout alone
   * (see the report). Every other caller still passes a real label. */
  label: string;
  highlighted: boolean;
  registerRef: (key: RailFieldKey, el: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={(el) => registerRef(fieldKey, el)}
      className={cn(
        "-mx-2 rounded-md px-2 py-1 transition-colors duration-500",
        highlighted && "bg-primary/10",
      )}
    >
      {label && (
        <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      )}
      <div
        className={cn("text-sm font-medium text-foreground", label && "mt-1")}
      >
        {children}
      </div>
    </div>
  );
}

/** "15 units · $1,849 each" — both slots derived, never a composed string
 * authored once and reused; the quantity never appears anywhere else on
 * the same row. */
function quantityLine(item: DecisionDetail["lineItems"][number]): string {
  const unit = item.quantity === 1 ? "unit" : "units";
  return `${item.quantity} ${unit} · ${item.unitPrice} each`;
}

/** `showAmount` drops the per-line amount when it's the only row on
 * screen — the Items field's `amount` is identical to the Total field
 * right below it, so showing it twice is a redundant repeat, not a second
 * fact. Multi-item rows keep it, since each line's amount is the only
 * place that number appears. */
function ItemRow({
  item,
  showAmount = true,
}: {
  item: DecisionDetail["lineItems"][number];
  showAmount?: boolean;
}) {
  return (
    <div>
      <p>{item.description}</p>
      <div className="flex items-baseline justify-between gap-3 font-normal">
        <span className="text-muted-foreground">{quantityLine(item)}</span>
        {showAmount && (
          <span className="shrink-0 tabular-nums text-foreground">
            {item.amount}
          </span>
        )}
      </div>
    </div>
  );
}

/** Items as a summary row with a count and an expand control — a single
 * item shows one row with no expand affordance, since there's nothing to
 * expand into. Multi-line SOWs (J2) just add more rows here, no rewrite. */
function ItemsSummary({ items }: { items: DecisionDetail["lineItems"] }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 1) {
    return <ItemRow item={items[0]!} showAmount={false} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1"
      >
        {items.length} items
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-2">
          {items.map((item) => (
            <ItemRow key={item.description} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The request rail — items, total (with the budget callout beneath it),
 * supplier, ship to, charged to, linked records, in that order. Each field
 * carries a ref so the AI summary's marks can highlight it (see
 * `highlightField`). No width/scroll/sticky classes on the root — the
 * caller supplies those (matching the requester's own rail, a plain div in
 * RequestWindow.tsx, so both share one scroll container instead of each
 * rail running its own).
 */
export const RequestRecordRail = forwardRef<
  RequestRecordRailHandle,
  RequestRecordRailProps
>(function RequestRecordRail(
  { detail, status, onOpenPo, onPreviewAttachment },
  ref,
) {
  const fieldRefs = useRef<Partial<Record<RailFieldKey, HTMLDivElement>>>({});
  const [highlighted, setHighlighted] = useState<RailFieldKey | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerRef = (key: RailFieldKey, el: HTMLDivElement | null) => {
    if (el) fieldRefs.current[key] = el;
    else delete fieldRefs.current[key];
  };

  useImperativeHandle(ref, () => ({
    highlightField(key, options) {
      if (options?.scroll) {
        fieldRefs.current[key]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      setHighlighted(key);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setHighlighted(null), 1200);
    },
  }));

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const [department, costCode] = detail.costCenter.split(" · ");
  const approved = status === "approved";

  const { fieldExceptions } = useRequests();
  const shipException = (fieldExceptions[detail.id] ?? []).find(
    (e) => e.field === "Ship to",
  );

  return (
    <div className="space-y-4">
      <p className="text-base font-bold tracking-tighter text-foreground">
        Request details
      </p>

      {/* Three groups, separated by a hairline: (1) items/total (budget
          now lives inside total, see below), (2) the supplier/logistics
          trio, (3) linked records. Group gaps (space-y-5) read as
          noticeably larger than the field gaps inside each group
          (space-y-4), which in turn read as larger than a field's own
          label-to-value gap (mt-1 on FieldRow) — three spacing levels, all
          `--spacing`-token multiples. */}
      <div className="space-y-5">
        <div className="space-y-4">
          <FieldRow
            fieldKey="items"
            label="Items"
            highlighted={highlighted === "items"}
            registerRef={registerRef}
          >
            <ItemsSummary items={detail.lineItems} />
          </FieldRow>

          <FieldRow
            fieldKey="total"
            // Chunk C1 cleanup suppressed the figure when a recurring
            // commitment is present (the two fields were showing the
            // identical amount a moment apart), but left this label
            // pointing at nothing. Chunk C2: the label goes with its
            // value — no "Total" text renders unless there's a total
            // beneath it. `detail.total` itself stays on the interface
            // unchanged (REQ-2052's one-time purchase still reads it
            // here); only this rendering steps aside for a request whose
            // real total is the recurring line below. The budget callout
            // still renders in this same spot either way, unmoved and
            // unrestyled — the rail card is P1 and out of scope for this
            // chunk's own budget work (see the report).
            label={detail.recurringCommitment ? "" : "Total"}
            highlighted={highlighted === "total"}
            registerRef={registerRef}
          >
            {!detail.recurringCommitment && detail.total}
            {/* Budget as a callout on the total, not its own rail section —
                the percentage is meaningless without the price it's a
                percentage of, so it sits directly beneath the value it
                modifies rather than as a separate field the approver has
                to reconcile against this one. Its own ref/highlight, since
                the AI summary's budget mark targets this specifically, not
                the total as a whole. Accent role at any value — no
                threshold-based coloring exists yet. */}
            <BudgetImpactCallout
              ref={(el) => registerRef("budget", el)}
              budget={detail.packet.budget}
              approved={approved}
              className={cn(
                "mt-2 transition-colors duration-500",
                highlighted === "budget" && "bg-primary/10",
              )}
            />
          </FieldRow>

          {/* A recurring line's own related figures (Chunk C1): annual
              commitment, total contract value, term, grouped the same way
              the budget callout groups its own related figures under the
              value they modify, rather than three separate rail fields the
              approver would have to mentally recombine. Absent for a
              one-time purchase like REQ-2052's own laptops. */}
          {detail.recurringCommitment && (
            <FieldRow
              fieldKey="commitment"
              label="Recurring commitment"
              highlighted={highlighted === "commitment"}
              registerRef={registerRef}
            >
              {detail.recurringCommitment.annual}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-normal text-muted-foreground">
                <span>{detail.recurringCommitment.term} term</span>
                <span>{detail.recurringCommitment.total} total</span>
              </div>
            </FieldRow>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-4">
          <FieldRow
            fieldKey="supplier"
            label="Supplier"
            highlighted={highlighted === "supplier"}
            registerRef={registerRef}
          >
            {detail.supplier}
          </FieldRow>

          {/* Absent for a request with no physical fulfilment (Chunk C1
              cleanup) — shipTo is optional on DecisionDetail now, so this
              field simply doesn't render rather than showing an invented
              or borrowed address. Same conditional-render shape as
              RequestWindow.tsx's own already-optional shipTo field. */}
          {detail.shipTo != null &&
            (() => {
              const [shipLocation, shipAddress] = detail.shipTo.split(" · ");
              return (
                <FieldRow
                  fieldKey="shipTo"
                  label="Ship to"
                  highlighted={highlighted === "shipTo"}
                  registerRef={registerRef}
                >
                  {shipLocation}
                  {shipAddress != null && (
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {shipAddress}
                    </p>
                  )}
                  {shipException && (
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      Ships here if the exception is declined.
                    </p>
                  )}
                  {shipException && (
                    <div className="mt-2 space-y-1.5 rounded-none border-l-2 border-warning py-1 pl-3 font-normal">
                      <Badge variant="secondary" status="warning">
                        Exception requested
                      </Badge>
                      <p className="text-xs font-medium text-foreground">
                        {shipException.requestedValue}
                      </p>
                      <p className="text-xs font-normal text-muted-foreground">
                        {`${shipException.ownerName} decides. Visible to ${detail.approver.split(" · ")[0]} and procurement.`}
                      </p>
                    </div>
                  )}
                </FieldRow>
              );
            })()}

          <FieldRow
            fieldKey="chargedTo"
            label="Charged to"
            highlighted={highlighted === "chargedTo"}
            registerRef={registerRef}
          >
            {department}
            {costCode != null && (
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                {costCode}
              </p>
            )}
          </FieldRow>

          {/* The order form on file (Chunk C1): filename, state, and the
              governing agreement it's under, with a preview affordance.
              REQ-2052 has no document in its rail, so this is absent
              there. Preview is a no-op (see the report): no PDF viewer
              exists on this surface to open it into. */}
          {detail.attachment && (
            <FieldRow
              fieldKey="attachment"
              label="Order form"
              highlighted={highlighted === "attachment"}
              registerRef={registerRef}
            >
              <div className="flex items-start gap-2">
                <FileText
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div className="min-w-0">
                  {/* TruncatedSubtitle (Chunk C1 cleanup), not a bare
                      truncated <p>: the filename was clipping with no way
                      to read the rest. className restores this field's own
                      value weight instead of the header-subtitle styling
                      TruncatedSubtitle defaults to. */}
                  <TruncatedSubtitle
                    text={detail.attachment.filename}
                    className="text-sm font-medium text-foreground"
                  />
                  <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                    {ATTACHMENT_STATE_LABEL[detail.attachment.state]}
                    {detail.contractReference &&
                      ` · ${detail.contractReference}`}
                  </p>
                  {detail.attachmentStateNote && (
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {detail.attachmentStateNote}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 font-normal"
                onClick={onPreviewAttachment}
              >
                Preview
              </Button>
            </FieldRow>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-4">
          <FieldRow
            fieldKey="linkedRecords"
            label="Linked records"
            highlighted={highlighted === "linkedRecords"}
            registerRef={registerRef}
          >
            <div className="flex flex-wrap gap-1.5 font-normal">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary">
                <LinkIcon className="size-3 shrink-0" aria-hidden />
                {detail.id.replace("REQ", "PR")}
              </span>
              {/* The PO doesn't exist until approval creates it — plain and
                  unlinked until then, a real linked record once it does. */}
              {detail.poNumber != null &&
                (approved ? (
                  <button
                    type="button"
                    onClick={onOpenPo}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-0.5 text-[10.5px] font-semibold text-primary"
                  >
                    <LinkIcon className="size-3 shrink-0" aria-hidden />
                    {detail.poNumber}
                  </button>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                    PO · created on approval
                  </span>
                ))}
              {/* Chunk C2: a record whose PO already exists independent of
                  this decision (REQ-10482's own, created by PR conversion,
                  not by Dana's approval — see linkedPoId's own doc comment)
                  states the real id plainly, not gated on `approved` the
                  way the future-tense badge above is, and not clickable:
                  there's no PO_DETAILS entry for it to open, so a button
                  here would only ever land on "Purchase order not found." */}
              {detail.linkedPoId != null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[10.5px] text-muted-foreground">
                  <LinkIcon className="size-3 shrink-0" aria-hidden />
                  {detail.linkedPoId}
                </span>
              )}
            </div>
          </FieldRow>
        </div>
      </div>
    </div>
  );
});
