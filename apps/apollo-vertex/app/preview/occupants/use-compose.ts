import { useState } from "react";
import type { ChangeCopy } from "./workbench-change";
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
  update: (patch: Partial<WorkbenchView>, copy?: ChangeCopy) => void,
): {
  compose: ContentsChange;
  revisions: Readonly<Record<string, number>>;
} {
  const [revisions, setRevisions] = useState<Readonly<Record<string, number>>>(
    {},
  );
  const compose: ContentsChange = (contents, show, include, renames, copy) => {
    update(
      {
        contents,
        ...(renames && { renames }),
        ...(show && { tabs: { ...view.tabs, [show.slot]: show.tab } }),
        ...(include && {
          layout: {
            ...view.layout,
            [include]: { ...view.layout[include], present: true },
          },
        }),
      },
      copy,
    );
    if (show)
      setRevisions((before) => ({
        ...before,
        [show.slot]: (before[show.slot] ?? 0) + 1,
      }));
  };
  return { compose, revisions };
}
