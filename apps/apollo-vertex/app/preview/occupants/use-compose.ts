import { useState } from "react";
import type { ContentsChange } from "./workbench-compose";
import type { WorkbenchView } from "./workbench-url-state";

/**
 * Takes the composer's changes, from a slot's popover or a drop: the
 * contents, the tab it made or added to, which shows, and a left-out
 * slot it includes, all as one change. Its slot's
 * revision goes up, so the panel starts again on that tab (see
 * SlotContent.revision).
 */
export function useCompose(
  view: WorkbenchView,
  update: (patch: Partial<WorkbenchView>) => void,
): {
  compose: ContentsChange;
  /** Includes a slot the page left out, as a change of its own. */
  include: (slot: string) => void;
  revisions: Readonly<Record<string, number>>;
} {
  const [revisions, setRevisions] = useState<Readonly<Record<string, number>>>(
    {},
  );
  const compose: ContentsChange = (contents, show, include) => {
    update({
      contents,
      ...(show && { tabs: { ...view.tabs, [show.slot]: show.tab } }),
      ...(include && {
        layout: {
          ...view.layout,
          [include]: { ...view.layout[include], present: true },
        },
      }),
    });
    if (show)
      setRevisions((before) => ({
        ...before,
        [show.slot]: (before[show.slot] ?? 0) + 1,
      }));
  };
  const include = (slot: string) =>
    update({
      layout: {
        ...view.layout,
        [slot]: { ...view.layout[slot], present: true },
      },
    });
  return { compose, include, revisions };
}
