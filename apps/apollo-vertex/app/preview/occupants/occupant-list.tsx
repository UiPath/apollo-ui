"use client";

import { type DraggableSyntheticListeners, useDraggable } from "@dnd-kit/core";
import { ArrowLeft, GripVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { OCCUPANT_SPECS } from "@/lib/occupants.generated";
import { cn } from "@/lib/utils";
import type { DragData } from "./workbench-drag";
import { claimedSurfacesText } from "./workbench-model";

interface OccupantListProps {
  id: string;
  open: boolean;
  selected: string;
  onSelect: (name: string) => void;
  /** Where "Back to docs" goes. */
  docsHref: string;
  /** Edit mode: rows drag onto the page, but not those on it already. */
  editing?: boolean;
  /** The occupants on the page, the focused one included. */
  onPage?: ReadonlySet<string>;
}

interface RowProps {
  name: string;
  label: string;
  surfaces: string;
  selected: boolean;
  onSelect: () => void;
  /** Whether it can be dragged onto the page. */
  draggable: boolean;
  /** Whether it's marked as on the page. */
  placed: boolean;
}

/** Of a draggable's listeners, the pointer's: the row starts a drag by pointer only. */
const pointerOnly = (listeners: DraggableSyntheticListeners) =>
  Object.fromEntries(
    Object.entries(listeners ?? {}).filter(
      ([event]) => event === "onPointerDown",
    ),
  );

/**
 * One occupant in the list. In Edit mode, one not on the page drags from
 * anywhere on its row past a small threshold, so a click still selects
 * it, and from its handle by keyboard.
 */
function Row({
  name,
  label,
  surfaces,
  selected,
  onSelect,
  draggable,
  placed,
}: RowProps) {
  const { t } = useTranslation();
  const data: DragData = { occupant: name };
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } =
    useDraggable({ id: `occupant:${name}`, data, disabled: !draggable });
  return (
    <li
      ref={setNodeRef}
      className="flex items-center gap-1"
      data-dragging={isDragging}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        {...(draggable && pointerOnly(listeners))}
        className={cn(
          "min-w-0 flex-1 rounded-md px-3 py-2 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          selected && "bg-accent text-accent-foreground",
          isDragging && "opacity-50",
        )}
      >
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{surfaces}</span>
        {placed && (
          <span
            data-slot="workbench-on-page"
            className="mt-0.5 block text-xs font-medium text-primary"
          >
            {t("workbench_on_page")}
          </span>
        )}
      </button>
      {draggable && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          data-slot="workbench-drag-handle"
          {...attributes}
          {...listeners}
          aria-label={t("workbench_drag_handle", { occupant: label })}
          className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      )}
    </li>
  );
}

/** Every registered occupant, searchable, with the surfaces it fits. */
export function OccupantList({
  id,
  open,
  selected,
  onSelect,
  docsHref,
  editing = false,
  onPage,
}: OccupantListProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const listed = OCCUPANT_SPECS.filter(({ spec }) =>
    spec.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <aside
      id={id}
      aria-label={t("workbench_occupants")}
      hidden={!open}
      className="flex w-66 shrink-0 flex-col border-e border-border"
    >
      <div className="flex flex-col gap-3 p-4">
        <Link
          href={docsHref}
          data-slot="workbench-back"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t("workbench_back_to_docs")}
        </Link>
        <div>
          <h1 className="text-base font-semibold">{t("workbench_title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("workbench_subtitle")}
          </p>
        </div>
        <Input
          type="search"
          aria-label={t("workbench_search")}
          placeholder={t("workbench_search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2">
        {listed.map(({ spec }) => {
          const placed = editing && (onPage?.has(spec.name) ?? false);
          return (
            <Row
              key={spec.name}
              name={spec.name}
              label={spec.label}
              surfaces={claimedSurfacesText(spec, t("workbench_fits_none"))}
              selected={spec.name === selected}
              onSelect={() => onSelect(spec.name)}
              draggable={editing && !placed}
              placed={placed}
            />
          );
        })}
        {listed.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            {t("workbench_no_matches")}
          </li>
        )}
      </ul>
      <div className="border-t border-border p-4">
        <Link
          href="/guidelines/design-architecture/creating-occupants"
          className="text-sm text-primary underline underline-offset-2"
        >
          {t("workbench_creating_occupants")}
        </Link>
      </div>
    </aside>
  );
}
