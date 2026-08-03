"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "../catalog/v1/QuantityStepper";

export interface ReceiptSubmission {
  qtyReceived: number;
  damaged: boolean;
  note?: string;
}

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  deliveryDate?: string;
  itemDescription: string;
  qtyOrdered: number;
  onConfirm: (submission: ReceiptSubmission) => void;
}

/**
 * Goods receipt needs input, not a single click — a $27k order shouldn't be
 * marked received without confirming what actually showed up.
 */
export function ReceiptModal({
  open,
  onOpenChange,
  requestId,
  deliveryDate,
  itemDescription,
  qtyOrdered,
  onConfirm,
}: ReceiptModalProps) {
  const [qtyReceived, setQtyReceived] = useState(qtyOrdered);
  const [damaged, setDamaged] = useState(false);
  const [note, setNote] = useState("");

  // Reset to a fresh form every time the modal opens, so a prior cancel
  // doesn't leave stale values on the next open.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQtyReceived(qtyOrdered);
      setDamaged(false);
      setNote("");
    }
    onOpenChange(next);
  };

  const matches = qtyReceived === qtyOrdered;
  const shortBy = qtyOrdered - qtyReceived;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm receipt</DialogTitle>
          <DialogDescription>
            {requestId}
            {deliveryDate != null && <> · delivered {deliveryDate}</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">
              {itemDescription}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ordered {qtyOrdered}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Quantity received
            </p>
            <QuantityStepper
              value={qtyReceived}
              onChange={setQtyReceived}
              min={0}
            />
            <p
              className={cn(
                "mt-2 text-xs",
                matches
                  ? "text-success"
                  : "text-warning-foreground dark:text-warning",
              )}
            >
              {matches
                ? "Matches the ordered quantity."
                : shortBy > 0
                  ? `${shortBy} short of the ${qtyOrdered} ordered.`
                  : `${Math.abs(shortBy)} more than the ${qtyOrdered} ordered.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <Checkbox
                id="receipt-damaged"
                checked={damaged}
                onCheckedChange={(v) => setDamaged(v === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="receipt-damaged"
                className="text-sm text-foreground"
              >
                Some items arrived damaged or incorrect
              </label>
            </div>
            {damaged && (
              <p className="pl-6 text-xs text-muted-foreground">
                A supplier issue is opened for the affected units.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="receipt-note"
              className="text-sm font-medium text-foreground"
            >
              Note{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="receipt-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth flagging…"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              onConfirm({
                qtyReceived,
                damaged,
                note: note.trim() || undefined,
              });
              onOpenChange(false);
            }}
          >
            Confirm receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
