import { useElementSize } from "@mantine/hooks";
import { type RefCallback, useState } from "react";
import {
  type DetailPageConfig,
  type DetailPagePanels,
  enabledPanels,
  type PanelClosedBy,
  type PanelIntent,
  type PanelSide,
  resolvePanels,
} from "./detail-page.template";

const SIDES: readonly PanelSide[] = ["start", "end"];

interface IntentState extends PanelIntent {
  /** The panels setting the intent was last reconciled against. */
  panels: DetailPagePanels;
}

export interface DetailPageState {
  config: DetailPageConfig;
  /** What is actually open after the main-width rule. */
  open: Record<PanelSide, boolean>;
  /** Why each closed panel is closed. Null when open or disabled. */
  closedBy: Record<PanelSide, PanelClosedBy | null>;
  setPanelOpen: (side: PanelSide, open: boolean) => void;
  /** Attach to the template root so the main-width rule can measure it. */
  ref: RefCallback<HTMLDivElement | null>;
}

/** Newly enabled panels take their defaultOpen; disabled panels close. */
function reconcile(state: IntentState, config: DetailPageConfig): IntentState {
  const enabled = enabledPanels(config.panels);
  const wasEnabled = enabledPanels(state.panels);
  const wanted = { ...state.wanted };
  let openOrder = [...state.openOrder];
  let { lastOpened } = state;

  for (const side of SIDES) {
    if (enabled[side] && !wasEnabled[side] && config[side].defaultOpen) {
      wanted[side] = true;
      openOrder.push(side);
    }
    if (!enabled[side]) {
      wanted[side] = false;
      openOrder = openOrder.filter((s) => s !== side);
      if (lastOpened === side) lastOpened = null;
    }
  }
  return { wanted, openOrder, lastOpened, panels: config.panels };
}

function initialState(config: DetailPageConfig): IntentState {
  return reconcile(
    {
      wanted: { start: false, end: false },
      openOrder: [],
      lastOpened: null,
      panels: "none",
    },
    config,
  );
}

/**
 * Owns a Detail page's panel state. Pass the result to
 * `<DetailPage state={...} />`.
 *
 * It stores only the user's intent. What is actually open is derived from
 * that intent and the measured width on every render, using the main-width
 * rule in detail-page.template.ts. So resizing needs no state updates, and
 * panels the rule closed come back on their own when there is room.
 */
export function useDetailPage(config: DetailPageConfig): DetailPageState {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const [state, setState] = useState(() => initialState(config));

  // Adjust intent while rendering when the enabled panels change.
  let intent = state;
  if (state.panels !== config.panels) {
    intent = reconcile(state, config);
    setState(intent);
  }

  const enabled = enabledPanels(config.panels);
  const resolved = resolvePanels(intent, width);
  const closedBy = {
    start: enabled.start ? resolved.closedBy.start : null,
    end: enabled.end ? resolved.closedBy.end : null,
  };

  const setPanelOpen = (side: PanelSide, open: boolean) =>
    setState((prev) => {
      if (!enabledPanels(prev.panels)[side]) return prev;
      const others = prev.openOrder.filter((s) => s !== side);
      if (open) {
        // An explicit open always moves the panel to newest and protects it,
        // even if it was already wanted but closed by the rule.
        return {
          ...prev,
          wanted: { ...prev.wanted, [side]: true },
          openOrder: [...others, side],
          lastOpened: side,
        };
      }
      return {
        ...prev,
        wanted: { ...prev.wanted, [side]: false },
        openOrder: others,
        lastOpened: prev.lastOpened === side ? null : prev.lastOpened,
      };
    });

  return { config, open: resolved.open, closedBy, setPanelOpen, ref };
}
