"use client";

import { useDraggable } from "@dnd-kit/core";
import { Ellipsis, GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXAMPLE_ROLES } from "@/lib/occupant-entry";
import { cn } from "@/lib/utils";
import type { MoveItem } from "./inspector-move";
import { useSample } from "./workbench-samples";

/** Move up and Move down: each a move, or null at that end. */
export interface MoveSteps {
  up: (() => void) | null;
  down: (() => void) | null;
}

/** An id for a dragged item, unique in its slot. */
const dragId = (item: MoveItem) =>
  item.kind === "tab" ? `tab:${item.index}` : `occupant:${item.name}`;

interface MoveHandleProps {
  item: MoveItem;
  /** What it moves, in words: "Move Queue". */
  name: string;
}

/**
 * The grip that drags something: a whole tab from a stack's header, one
 * occupant from its card. By keyboard, Space picks it up.
 */
export function MoveHandle({ item, name }: MoveHandleProps) {
  const { t } = useTranslation();
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: dragId(item),
    data: { item, name },
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      data-slot="workbench-move-handle"
      {...attributes}
      {...listeners}
      aria-label={t("workbench_move_handle", { name })}
      className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <GripVertical aria-hidden className="size-4" />
    </button>
  );
}

interface SampleItemsProps {
  occupant: string;
}

/** Which of an occupant's samples the page shows, as radio items. */
function SampleItems({ occupant }: SampleItemsProps) {
  const { t } = useTranslation();
  const { sample, onSample } = useSample(occupant);
  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {t("workbench_sample")}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={sample}
        onValueChange={(next) => {
          const role = EXAMPLE_ROLES.find((r) => r === next);
          if (role) onSample(role);
        }}
      >
        {EXAMPLE_ROLES.map((role) => (
          <DropdownMenuRadioItem key={role} value={role}>
            {t(`workbench_sample_${role}`)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

interface MoveMenuProps {
  name: string;
  /** Move up and Move down; left out where nothing moves, as in a slot that holds one. */
  steps?: MoveSteps;
  /** The occupant it's for, if one: its sample is chosen here too. */
  occupant?: string;
}

/**
 * An occupant's or a tab's options, in a small menu: Move up and Move
 * down, the keyboard's way to reorder, and an occupant's sample.
 */
export function MoveMenu({ name, steps, occupant }: MoveMenuProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          data-slot="workbench-move-menu"
          aria-label={t("workbench_move_options", { name })}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {steps && (
          <>
            <DropdownMenuItem
              disabled={!steps.up}
              onSelect={() => steps.up?.()}
            >
              {t("workbench_move_up")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!steps.down}
              onSelect={() => steps.down?.()}
            >
              {t("workbench_move_down")}
            </DropdownMenuItem>
          </>
        )}
        {steps && occupant && <DropdownMenuSeparator />}
        {occupant && <SampleItems occupant={occupant} />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ContentCardProps {
  occupant: string;
  /** Its grip: what it drags. None in a slot that holds one. */
  handle?: ReactNode;
  /** Its name, renamable or not. */
  name: ReactNode;
  actions: ReactNode;
  /** In a stack: its tab, so a drop can find its place among the cards. */
  stackTab?: number | null;
  /** Whether it's the one being dragged: it stays, faded, where it was. */
  dragging?: boolean;
}

/**
 * An occupant as a compact card: a subtle fill, the small radius, no
 * border, its grip, its name, then its actions.
 */
export function ContentCard({
  occupant,
  handle,
  name,
  actions,
  stackTab = null,
  dragging = false,
}: ContentCardProps) {
  const { t } = useTranslation();
  const { sample } = useSample(occupant);
  return (
    <div
      data-slot="workbench-contents-card"
      data-row={occupant}
      data-dragging={dragging}
      {...(stackTab !== null && {
        "data-stack-card": "",
        "data-tab-index": stackTab,
      })}
      tabIndex={-1}
      className={cn(
        "flex min-h-8 min-w-0 flex-1 items-center gap-1 rounded-sm bg-muted py-0.5 pe-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring data-[dragging=true]:opacity-40",
        handle ? "ps-0.5" : "ps-2",
      )}
    >
      {handle}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex min-w-0 items-center">{name}</div>
        {/* A sample other than primary, said under the name. */}
        {sample !== "primary" && (
          <span
            data-slot="workbench-contents-sample"
            className="truncate text-xs text-muted-foreground"
          >
            {t("workbench_contents_sample", {
              sample: t(`workbench_sample_${sample}`),
            })}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
    </div>
  );
}
