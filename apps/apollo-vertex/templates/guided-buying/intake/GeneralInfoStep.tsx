"use client";

import {
  Banknote,
  Building2,
  CalendarClock,
  Check,
  Landmark,
  type LucideIcon,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FieldEditToggle,
  FieldOptionList,
} from "../catalog/v1/InlineFieldEditor";
import {
  COST_CENTRE_RULE_PREFIX,
  FIELD_PROVENANCE_LABEL,
  type FieldProvenance,
  GENERAL_INFO_FOOTER_LINE,
  IDENTITY,
  RECOMMENDED_COST_CENTRE_LABEL,
  REJECTED_COST_CENTRE_DISPLAY,
} from "../data";
import { useIntakeState } from "./intake-state-context";

// Reconciled against Details' own provenance vocabulary (see the report):
// from-profile reuses Details' exact label. from-entity and from-you were
// registered but unattached in the seed until this step; both are kept as
// already defined in req-10482.ts rather than reworded here, since neither
// has a closer J1 equivalent worth collapsing into.
function ProvenanceLabel({ provenance }: { provenance: FieldProvenance }) {
  return (
    <span className="whitespace-nowrap text-right text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
      {FIELD_PROVENANCE_LABEL[provenance]}
    </span>
  );
}

interface FieldRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  provenance: FieldProvenance;
  /** Replaces the provenance label in this row's own slot, e.g. the cost
   * centre's validity/blocked chip. Every other row keeps its provenance
   * label (see the report). */
  statusChip?: ReactNode;
  /** Apollo's error treatment on the value text, while the cost centre row
   * holds the rejected value. Every other row stays at the default color. */
  valueTone?: "default" | "error";
  /** An error-side accent on the row itself, matching how the source marks
   * the blocked row against its siblings. */
  accent?: "error";
  /** Present only for the two rows the table marks editable; the row's
   * right-hand slot holds the pencil instead of ending at the provenance
   * label. */
  edit?: {
    editing: boolean;
    onToggle: () => void;
  };
}

function FieldRow({
  icon: Icon,
  label,
  value,
  provenance,
  statusChip,
  valueTone = "default",
  accent,
  edit,
}: FieldRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5",
        accent === "error" && "border-l-2 border-destructive",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            valueTone === "error" ? "text-destructive" : "text-foreground",
          )}
        >
          {value}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {statusChip ?? <ProvenanceLabel provenance={provenance} />}
        {edit != null && (
          <FieldEditToggle
            label={label}
            editing={edit.editing}
            onToggle={edit.onToggle}
          />
        )}
      </div>
    </div>
  );
}

/**
 * General Info, the fourth phase: the four fields the assembled journey and
 * the eventual approval routing both depend on. Buying entity and Currency
 * are entity defaults, not agent output, so unlike Details this step gets
 * no AI mark or caveat, per A3's own principle applied here (see the
 * report).
 */
export function GeneralInfoStep() {
  // Committed value is shared (Review reads it); everything else here is
  // transient UI local to this step.
  const { costCentre, setCostCentre } = useIntakeState();
  const [costCentreEditing, setCostCentreEditing] = useState(false);
  // What the field currently shows, as distinct from what's committed. The
  // rejected value renders here while blocked, but is never passed to
  // setCostCentre, so it never reaches Review or the journey (see the
  // report).
  const [displayedCostCentre, setDisplayedCostCentre] = useState(costCentre);
  const blocked = displayedCostCentre === REJECTED_COST_CENTRE_DISPLAY;

  function chooseCostCentre(value: string) {
    setDisplayedCostCentre(value);
    if (value !== REJECTED_COST_CENTRE_DISPLAY) {
      setCostCentre(value);
    }
  }

  function applyRecommended() {
    chooseCostCentre(IDENTITY.costCentre);
  }

  return (
    <div className="w-full space-y-3">
      <div className={cn(GLASS_CLASSES, "divide-y overflow-hidden rounded-xl")}>
        <FieldRow
          icon={Landmark}
          label="Buying entity"
          value={IDENTITY.buyingEntity}
          provenance="from-profile"
        />
        <div>
          <FieldRow
            icon={Building2}
            label="Cost center"
            value={displayedCostCentre}
            provenance="from-profile"
            valueTone={blocked ? "error" : "default"}
            {...(blocked ? { accent: "error" as const } : {})}
            statusChip={
              blocked ? (
                <Badge variant="secondary" status="error">
                  Blocked
                </Badge>
              ) : (
                <Badge variant="secondary" status="success">
                  <Check className="size-3" aria-hidden />
                  Valid for this entity
                </Badge>
              )
            }
            edit={{
              editing: costCentreEditing,
              onToggle: () => setCostCentreEditing((v) => !v),
            }}
          />
          <div className="px-4 pb-2.5">
            {/* Blocked by policy: the rule message, its recommended cost
            centre emphasised, plus the one action that resolves it. The
            row's own chip above already names the blocked state; this
            block only explains it and offers the fix. */}
            {blocked && (
              <div role="alert" className="mb-2 space-y-1.5 pl-7">
                <p className="text-xs font-medium text-destructive">
                  {COST_CENTRE_RULE_PREFIX}
                  <strong className="font-semibold">
                    {RECOMMENDED_COST_CENTRE_LABEL}
                  </strong>
                  .
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={applyRecommended}
                >
                  {`Use ${RECOMMENDED_COST_CENTRE_LABEL}`}
                </Button>
              </div>
            )}
            <div className="pl-7">
              <FieldOptionList
                options={[
                  {
                    value: IDENTITY.costCentre,
                    reason: "Committed for this request",
                  },
                  {
                    value: REJECTED_COST_CENTRE_DISPLAY,
                    blocked,
                    // No rationale once named (A3), except while it's the
                    // refused selection: the row above already carries the
                    // rule message, this sub-line only echoes that it's
                    // blocked, not why.
                    ...(blocked ? { reason: "Blocked by policy" } : {}),
                  },
                ]}
                selectedValue={displayedCostCentre}
                open={costCentreEditing}
                onSelect={chooseCostCentre}
              />
            </div>
          </div>
        </div>
        <FieldRow
          icon={Banknote}
          label="Currency"
          value={IDENTITY.currency}
          provenance="from-entity"
        />
        <FieldRow
          icon={CalendarClock}
          label="Needed from"
          value={IDENTITY.neededFrom}
          provenance="from-you"
          edit={{
            editing: false,
            onToggle: () => {
              // Needed-from isn't editable from this row yet.
            },
          }}
        />
      </div>

      <p className="flex items-start gap-3 px-4 text-xs text-muted-foreground">
        <Shield className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{GENERAL_INFO_FOOTER_LINE}</span>
      </p>
    </div>
  );
}
