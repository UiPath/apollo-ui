import { useEffect, useRef, useState } from "react";
import { occupantsIn, type SlotContents } from "./workbench-compose";

/*
 * The template view's inspector: whether it's open, the slot selected on
 * the stage, and an occupant clicked in the list that isn't on the page.
 * Escape deselects, and focus goes back to the slot.
 */

/** A slot's button on the stage, in Edit mode: its own, or its ghost's. */
const slotButton = (slot: string) =>
  document.querySelector<HTMLElement>(
    `[data-edit-slot="${slot}"], [data-ghost-slot="${slot}"]`,
  );

export function useInspector(initiallyOpen: boolean) {
  const [open, setOpen] = useState(initiallyOpen);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  // Set by a keyboard selection, read once the inspector shows the slot.
  const focusInspector = useRef(false);

  useEffect(() => {
    if (!focusInspector.current) return;
    focusInspector.current = false;
    document
      .querySelector<HTMLElement>("[data-slot=workbench-inspector-heading]")
      ?.focus();
  });

  // Escape deselects the slot, wherever focus is, and focus goes to it.
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      // A drag, a menu, or a tooltip takes its own Escape first.
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setSelected(null);
      slotButton(selected)?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  return {
    open,
    selected,
    hint,
    /** Opens or closes the inspector, from the header's panel toggle. */
    toggle: () => setOpen((now) => !now),
    /** Edit opens the inspector; Preview closes it, and drops the selection. */
    setEditing: (editing: boolean) => {
      setOpen(editing);
      if (!editing) setSelected(null);
    },
    /** Selects a slot and shows it; by keyboard, focus moves into the inspector. */
    select: (slot: string, byKeyboard = false) => {
      setSelected(slot);
      setHint(null);
      setOpen(true);
      focusInspector.current = byKeyboard;
    },
    /**
     * An occupant clicked in the list: on the page, its slot is selected;
     * off it, the inspector says how to put it there.
     */
    fromList: (occupant: string, contents: SlotContents) => {
      const slot = Object.entries(contents).find(([, panel]) =>
        occupantsIn(panel).includes(occupant),
      )?.[0];
      setSelected(slot ?? null);
      setHint(slot ? null : occupant);
      setOpen(true);
    },
  };
}
