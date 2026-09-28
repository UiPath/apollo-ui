import { ListOrdered, Sparkles } from "lucide-react";
import type { SurfacePadding } from "@/lib/composition";
import type { DetailPageSlotName } from "./detail-page.template";

/** Slots whose surface takes an occupant padding. The rail does not. */
export type PaddedSlotName = Exclude<DetailPageSlotName, "start-rail">;

export const PADDED_SLOTS: readonly PaddedSlotName[] = [
  "header",
  "start-panel",
  "main",
  "end-panel",
];

export type SlotPaddings = Record<PaddedSlotName, SurfacePadding>;

/** Placeholder occupants for the start panel, in switcher order. */
export const START_OCCUPANTS = [
  { name: "queue", label: "Queue", icon: ListOrdered },
  { name: "assistant", label: "Assistant", icon: Sparkles },
] as const;

export type StartOccupantName = (typeof START_OCCUPANTS)[number]["name"];
