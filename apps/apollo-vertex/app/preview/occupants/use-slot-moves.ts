import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { specFor } from "@/lib/occupant-lookup";
import type { MoveResult } from "@/lib/panel-editing";
import type { MoveSteps } from "./content-card";
import {
  applyMove,
  followRenames,
  followTab,
  type MoveItem,
  type MovePlace,
  stepPlace,
  whereIs,
} from "./inspector-move";
import type { ChangeCopy } from "./workbench-change";
import {
  activeTab,
  type ContentsChange,
  REGISTERED,
  type SlotContents,
} from "./workbench-compose";
import { reasonCopy } from "./workbench-layout";
import { firstUnusedLabel } from "./workbench-picker";
import type { Renames } from "./workbench-renames";

interface SlotMovesOptions {
  host: TemplateHost;
  slot: string;
  contents: SlotContents;
  onContents: ContentsChange;
  /** The tab each slot shows, when one was chosen. */
  tabs: Readonly<Record<string, string>>;
  renames: Renames;
  /** A tab's name in words, by index. */
  tabName: (index: number) => string;
}

/**
 * Moving tabs and occupants in a panel slot from the inspector: what a
 * move would do, making it, and the words for its places and refusals.
 * After a move the same tab shows, followed even when its id changes,
 * and a stack's preview-only name goes with it; the change says what
 * moved, with Undo.
 */
export function useSlotMoves({
  host,
  slot,
  contents,
  onContents,
  tabs,
  renames,
  tabName,
}: SlotMovesOptions) {
  const { t } = useTranslation();
  const panel = contents[slot];
  const preview = (item: MoveItem, place: MovePlace): MoveResult =>
    panel
      ? applyMove(panel, item, place, REGISTERED, firstUnusedLabel(panel))
      : { ok: false, refused: "tab-cap" };
  const onMove = (item: MoveItem, place: MovePlace) => {
    const result = preview(item, place);
    if (!panel || !result.ok) return;
    const showing = tabs[slot] ?? activeTab(panel);
    const tab =
      followTab(panel, result.panel, showing) ?? activeTab(result.panel);
    // Said from what was moved: a guess from the result can't tell a tab
    // moved up from the one it passed moving down.
    const where = host.slotLabels[slot] ?? slot;
    // Alone in its tab and moved between tabs, it's the tab that moved.
    const from =
      item.kind === "tab" ? item.index : whereIs(panel, item.name).tab;
    const tabMoved =
      item.kind === "tab" ||
      (place.kind === "new-tab" &&
        (panel.tabs[from]?.occupants.length ?? 0) === 1);
    const copy: ChangeCopy = tabMoved
      ? {
          key: "workbench_change_moved_tab",
          values: { tab: tabName(from), slot: where },
        }
      : {
          key: "workbench_change_moved",
          values: { occupant: occupantLabel(item.name), slot: where },
        };
    onContents(
      { ...contents, [slot]: result.panel },
      { slot, tab },
      null,
      followRenames(slot, panel, result.panel, renames),
      copy,
    );
  };
  const steps = (item: MoveItem): MoveSteps => {
    const step = (by: -1 | 1) => {
      const place = panel ? stepPlace(panel, item, by) : null;
      return place ? () => onMove(item, place) : null;
    };
    return { up: step(-1), down: step(1) };
  };
  const placeName = (place: MovePlace) => {
    if (place.kind === "new-tab") {
      const before = panel?.tabs[place.at];
      return before
        ? t("workbench_move_place_new_tab", { tab: tabName(place.at) })
        : t("workbench_move_place_new_tab_end");
    }
    return t("workbench_move_place_into", {
      tab: tabName(place.tab),
      position: place.at + 1,
    });
  };
  const reason = (result: MoveResult) =>
    result.ok
      ? ""
      : result.refused === "no-label"
        ? t("workbench_move_no_label")
        : t(reasonCopy(host.spec, result.refused));
  return { preview, onMove, steps, placeName, reason };
}

/** An occupant's name, as people know it. */
export const occupantLabel = (occupant: string) =>
  specFor(occupant)?.label ?? occupant;
