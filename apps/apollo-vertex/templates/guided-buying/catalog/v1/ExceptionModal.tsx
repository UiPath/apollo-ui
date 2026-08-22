"use client";

import { Lock, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EnvelopeField } from "./RequestEnvelope";

// ESCALATE: placeholder demo fixture for the "different address" option, tied
// to the Fusion Event context named in the seed request — exact venue string
// not confirmed, flagged rather than treated as decided.
const LAS_VEGAS_VENUE_ADDRESS =
  "Mandalay Bay Convention Center · 3950 S Las Vegas Blvd, Las Vegas, NV 89119";

const OTHER_ADDRESS_VALUE = "__other__";

interface ExceptionModalProps {
  field: EnvelopeField;
  currentValue: string;
  approverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (requestedValue: string, reason: string) => void;
}

/**
 * Generic exception request modal, driven entirely by the field's own
 * provenance/options — no hardcoded field name, owner, or alternates, so it
 * works for any locked field, not just Ship to.
 */
export function ExceptionModal({
  field,
  currentValue,
  approverName,
  open,
  onOpenChange,
  onSubmit,
}: ExceptionModalProps) {
  const [selected, setSelected] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");

  // Reset to a fresh form every time the modal opens, so a prior cancel
  // doesn't leave stale values on the next open.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSelected("");
      setAddress("");
      setReason("");
    }
    onOpenChange(next);
  };

  const handleSelect = (value: string) => {
    setSelected(value);
    // Pre-fills the venue address once, for a smoother live demo — still a
    // plain editable field after that.
    if (value === OTHER_ADDRESS_VALUE && address === "") {
      setAddress(LAS_VEGAS_VENUE_ADDRESS);
    }
  };

  const isOther = selected === OTHER_ADDRESS_VALUE;
  const requestedValue = isOther ? address.trim() : selected;
  const canSubmit = selected !== "" && (!isOther || address.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request an exception</DialogTitle>
          <DialogDescription>
            {field.label}, owned by {field.provenance.ownerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              Current
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {currentValue}
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              Deliver to instead
            </p>
            {/* The allowed set (field.options) needs no exception — those are
            selectable directly from the field's own picker. This modal is
            the path for a value outside that set, so it offers only one
            row, never derived from or listing field.options. */}
            <RadioGroup value={selected} onValueChange={handleSelect}>
              <label
                className={cn(
                  "flex items-start gap-2 rounded-md border px-3 py-2 transition-colors",
                  isOther
                    ? "border-(--primary) bg-(--primary)/5"
                    : "border-border hover:bg-muted",
                )}
              >
                <RadioGroupItem
                  value={OTHER_ADDRESS_VALUE}
                  className="mt-0.5"
                />
                <span className="text-sm font-medium text-foreground">
                  A different address
                </span>
              </label>
            </RadioGroup>
            {isOther && (
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter a delivery address"
                className="mt-1.5"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="exception-reason"
              className="text-sm font-medium text-foreground"
            >
              Why{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="exception-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What's driving the change for this request?"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden
            />
            <span className="text-foreground">
              {field.provenance.ownerName} and {approverName} will see this
              exception, along with procurement.
            </span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              onSubmit(requestedValue, reason.trim());
              onOpenChange(false);
            }}
          >
            Add exception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
