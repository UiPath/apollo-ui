import { useState } from "react";
import type { ContentsChange } from "./workbench-compose";
import type { WorkbenchView } from "./workbench-url-state";

/**
 * Takes the composer's changes, from a slot's popover or a drop: the
 * contents, and the tab it made or added to, which shows. Its slot's
 * revision goes up, so the panel starts again on that tab (see
 * SlotContent.revision).
 */
export function useCompose(
  view: WorkbenchView,
  update: (patch: Partial<WorkbenchView>) => void,
): { compose: ContentsChange; revisions: Readonly<Record<string, number>> } {
  const [revisions, setRevisions] = useState<Readonly<Record<string, number>>>(
    {},
  );
  const compose: ContentsChange = (contents, show) => {
    update({
      contents,
      ...(show && { tabs: { ...view.tabs, [show.slot]: show.tab } }),
    });
    if (show)
      setRevisions((before) => ({
        ...before,
        [show.slot]: (before[show.slot] ?? 0) + 1,
      }));
  };
  return { compose, revisions };
}
