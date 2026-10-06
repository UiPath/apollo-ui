"use client";

import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import type { LayoutChoices } from "@/lib/layout";
import { specFor } from "@/lib/occupant-lookup";
import { SlotContentsSection } from "./slot-contents";
import { SlotLayoutSection } from "./slot-layout-section";
import type { ContentsChange, SlotContents } from "./workbench-compose";
import { hasLayout, leftOut } from "./workbench-layout";
import type { Renames } from "./workbench-renames";

/** The inspector's heading: focus lands here when a slot is chosen by keyboard. */
const heading = (text: string) => (
  <h2
    data-slot="workbench-inspector-heading"
    tabIndex={-1}
    className="text-base font-semibold outline-none"
  >
    {text}
  </h2>
);

interface InspectorProps {
  id: string;
  host: TemplateHost;
  /** The slot selected on the stage, if any. */
  selected: string | null;
  /** An occupant clicked in the list that isn't on the page, if any. */
  hint: string | null;
  layout: LayoutChoices;
  onLayout: (layout: LayoutChoices) => void;
  status: Readonly<Record<string, SlotStatus>> | null;
  contents: SlotContents;
  onContents: ContentsChange;
  /** Preview-only renames, and changing them. */
  renames: Renames;
  onRenames: (renames: Renames) => void;
}

/**
 * The template view's right-hand column: the one place to edit a slot.
 * It shows the selected slot's contents, its tabs and stacks, the picker,
 * and its labels, then its layout, only what the slot declares. With no
 * slot selected it says so; with an occupant clicked in the list that
 * isn't on the page, it says how to put it there.
 */
export function Inspector({
  id,
  host,
  selected,
  hint,
  layout,
  onLayout,
  status,
  contents,
  onContents,
  renames,
  onRenames,
}: InspectorProps) {
  const { t } = useTranslation();
  const body = () => {
    if (hint)
      return (
        <>
          {heading(specFor(hint)?.label ?? hint)}
          <p
            data-slot="workbench-inspector-hint"
            className="text-muted-foreground"
          >
            {t("workbench_inspector_off_page")}
          </p>
        </>
      );
    if (!selected)
      return (
        <p
          data-slot="workbench-inspector-empty"
          className="text-muted-foreground"
        >
          {t("workbench_inspector_empty")}
        </p>
      );
    const slotName = host.slotLabels[selected] ?? selected;
    const out = leftOut(layout, selected);
    const layoutProps = { host, slot: selected, layout, onLayout, status };
    return (
      <>
        {heading(slotName)}
        <section
          aria-label={t("workbench_compose")}
          className="flex flex-col gap-3"
        >
          <h3 className="text-xs font-medium text-muted-foreground uppercase">
            {t("workbench_compose")}
          </h3>
          {out ? (
            <>
              <p className="text-sm" data-slot="workbench-slot-left-out">
                {t("workbench_slot_include_first", {
                  slot: slotName.toLowerCase(),
                })}
              </p>
              <SlotLayoutSection {...layoutProps} parts={["present"]} />
            </>
          ) : (
            <SlotContentsSection
              // A fresh section per slot: its picker and labels start closed.
              key={selected}
              host={host}
              slot={selected}
              contents={contents}
              onContents={onContents}
              renames={renames}
              onRenames={onRenames}
            />
          )}
        </section>
        {hasLayout(host.spec, selected) && !out && (
          <section
            aria-label={t("workbench_layout")}
            className="flex flex-col gap-3 border-t border-border pt-3"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase">
              {t("workbench_layout")}
            </h3>
            <SlotLayoutSection {...layoutProps} />
          </section>
        )}
      </>
    );
  };
  return (
    <aside
      id={id}
      aria-label={t("workbench_inspector")}
      // The column around it opens and closes it; focus lands here.
      tabIndex={-1}
      data-slot="workbench-inspector"
      {...(selected && { "data-inspector-slot": selected })}
      className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-s border-border p-4 text-sm outline-none"
    >
      {body()}
    </aside>
  );
}
