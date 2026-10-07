import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  type ChangeCopy,
  type Composition,
  compositionOf,
  describeChange,
  resetComposition,
} from "./workbench-change";
import {
  normalizeView,
  templateFor,
  type WorkbenchView,
} from "./workbench-url-state";

/** The workbench's own toaster, so its toasts never mix with a page's. */
export const WORKBENCH_TOASTER = "workbench";
/** One toast at a time: a new change replaces the last, and only it can be undone. */
export const CHANGE_TOAST = "workbench-change";
/** How long a change's toast stays, unless it's hovered or its Undo has focus. */
export const SHOWN_MS = 6000;

/** What the change toast says now, so it can be held while Undo has focus. */
let shown = "";

/**
 * Holds the change toast while its Undo has focus, and lets it go again
 * with its full time once focus leaves. Sonner pauses for the pointer, not
 * for focus.
 */
export function holdChangeToast(hold: boolean) {
  if (!shown) return;
  toast(shown, {
    id: CHANGE_TOAST,
    toasterId: WORKBENCH_TOASTER,
    duration: hold ? Number.POSITIVE_INFINITY : SHOWN_MS,
  });
}

/**
 * Makes a change to what the template view holds or how it's laid out,
 * and says what it did in a toast, with an Undo that puts back what that
 * change touched (contents, layout, tabs) and nothing else.
 */
export function useChangeLog(
  view: WorkbenchView,
  setView: (next: (current: WorkbenchView) => WorkbenchView) => void,
) {
  const { t } = useTranslation();
  const host = templateFor(view.template);
  const change = (patch: Partial<WorkbenchView>, copy?: ChangeCopy) => {
    const before = compositionOf(view);
    const after = normalizeView({ ...view, ...patch });
    setView((current) => normalizeView({ ...current, ...patch }));
    const said =
      copy ??
      (host ? describeChange(host, view, after, (key) => t(key)) : null);
    if (!said) return;
    const message = t(said.key, said.values);
    const undo = (back: Composition) => {
      setView((current) => normalizeView({ ...current, ...back }));
      // Updating the toast keeps its fields: drop the Undo, it's done.
      shown = t("workbench_change_undone", { change: message });
      toast(shown, {
        id: CHANGE_TOAST,
        toasterId: WORKBENCH_TOASTER,
        action: null,
        duration: SHOWN_MS,
      });
    };
    shown = message;
    toast(message, {
      id: CHANGE_TOAST,
      toasterId: WORKBENCH_TOASTER,
      duration: SHOWN_MS,
      action: {
        label: t("workbench_change_undo"),
        onClick: (event) => {
          // The Undone toast takes this one's place. Sonner would also
          // dismiss it, and that dismissal, by the shared id, could take
          // the next change's toast with it.
          event.preventDefault();
          undo(before);
        },
      },
    });
  };
  // Edit mode's Reset layout: every slot back to the template's defaults.
  const reset = () =>
    change(resetComposition(), {
      key: "workbench_change_reset",
      values: {},
    });
  return { change, reset };
}
