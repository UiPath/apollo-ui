"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * The shared park-family confirm dialog (Hold, Route, and later Flag / Reject).
 * Modeled on the v1 "Flag for follow-up" dialog: a title, an optional
 * description, single-select reason chips, an optional note textarea, then
 * Cancel + a primary commit. Built strictly from the component library's Dialog
 * primitives so it is indistinguishable in chrome from any other Apollo Vertex
 * dialog. Title and description render exactly what DialogTitle/DialogDescription
 * give us: no bespoke type styles.
 *
 * The description doubles as the side-effect slot: an action can declare what
 * else happens ("also posts to #ap-exceptions") in its description text.
 *
 * Dismissal is zero trace: Cancel, X, Esc, and overlay click all close without
 * committing (the chip resets to the default and the note clears on close, and
 * the fields are mounted only while open). Commit is the only path that writes.
 *
 * Opens either from its own `trigger` (uncontrolled) or from a parent via
 * `open`/`onOpenChange` (controlled), so it can be driven from a menu item where
 * an inline trigger cannot survive the menu closing.
 */
export function ReasonDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  chips,
  defaultChip,
  notePlaceholder = "Add a note (optional)…",
  commitLabel,
  commitVariant = "default",
  onCommit,
}: {
  /** the control that opens the dialog (rendered via DialogTrigger asChild) */
  trigger?: ReactNode;
  /** controlled open state; pair with onOpenChange (omit both for uncontrolled) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  /** optional supporting line; also the slot for declaring side effects */
  description?: string;
  /** reason options; the first (or defaultChip) is preselected */
  chips: readonly string[];
  defaultChip?: string;
  notePlaceholder?: string;
  commitLabel: string;
  /** commit button style: "destructive" for irreversible actions (e.g. Reject) */
  commitVariant?: "default" | "destructive";
  onCommit: (reason: string, note?: string) => void;
}) {
  const initialChip = defaultChip ?? chips[0] ?? "";
  const [openState, setOpenState] = useState(false);
  const [reason, setReason] = useState(initialChip);
  const [note, setNote] = useState("");
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;

  function setOpen(o: boolean) {
    if (!isControlled) setOpenState(o);
    onOpenChange?.(o);
  }

  function reset() {
    setReason(initialChip);
    setNote("");
  }

  function commit() {
    onCommit(reason, note.trim() || undefined);
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Reason</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <Button
                key={c}
                type="button"
                variant={reason === c ? "default" : "outline"}
                size="sm"
                onClick={() => setReason(c)}
              >
                {c}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder={notePlaceholder}
            rows={3}
            className="mt-3 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant={commitVariant} size="sm" onClick={commit}>
            {commitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
