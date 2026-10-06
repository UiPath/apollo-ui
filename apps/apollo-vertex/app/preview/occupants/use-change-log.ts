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
const CHANGE_TOAST = "workbench-change";

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
      toast(t("workbench_change_undone", { change: message }), {
        id: CHANGE_TOAST,
        toasterId: WORKBENCH_TOASTER,
      });
    };
    toast(message, {
      id: CHANGE_TOAST,
      toasterId: WORKBENCH_TOASTER,
      action: {
        label: t("workbench_change_undo"),
        onClick: () => undo(before),
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
