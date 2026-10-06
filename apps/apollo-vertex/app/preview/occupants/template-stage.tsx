"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { LocaleReady } from "@/app/_components/locale-ready";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import type { LayoutChoices } from "@/lib/layout";
import { OCCUPANT_REGISTRY } from "@/lib/occupant-registry.generated";
import {
  PreviewShell,
  type PreviewShellVariant,
} from "@/templates/shell/PreviewShell";
import { EditSlots } from "./edit-slots";
import { StageFrame } from "./stage-frame";
import { activeTab, occupantsIn, type SlotContents } from "./workbench-compose";

/** The slots the choices close, as one key. */
const closedSlots = (layout: LayoutChoices) =>
  Object.entries(layout)
    .filter(([, choice]) => choice.open === false)
    .map(([slot]) => slot)
    .join(",");

interface TemplateStageProps {
  host: TemplateHost;
  shell: PreviewShellVariant;
  layout: LayoutChoices;
  /** What each slot holds. */
  contents: SlotContents;
  /** The tab each slot shows, when one was chosen. */
  tabs: Readonly<Record<string, string>>;
  onTab: (slot: string, id: string) => void;
  /** Each slot's panel revision: a new one starts its panel on its tab. */
  revisions: Readonly<Record<string, number>>;
  /** Edit mode: every slot outlined and opened by a click, the page inert. */
  editing: boolean;
  /** The slot selected in Edit mode, and selecting one. */
  selected: string | null;
  onSelect: (slot: string, byKeyboard: boolean) => void;
  /** The inspector's id, which a slot's selection shows. */
  inspectorId: string;
  onStatus: (status: Readonly<Record<string, SlotStatus>>) => void;
  pageWidth: number;
  /** The page's real height: tall enough for the frame to fill the stage. */
  pageHeight: number;
  /** How much the page is shrunk to fit the stage: 1 at its real size. */
  scale: number;
}

/**
 * The template view's stage: the template at the page width, each slot
 * with what it holds, every occupant in its primary sample, ready. The
 * frame takes the
 * scaled size, and the page inside it keeps its real width, so the
 * template's rules and the frame tag see the real page width. The page is
 * the whole window: the template inside the real ApolloShell.
 */
export function TemplateStage({
  host,
  shell,
  layout,
  contents,
  tabs,
  onTab,
  revisions,
  editing,
  selected,
  onSelect,
  inspectorId,
  onStatus,
  pageWidth,
  pageHeight,
  scale,
}: TemplateStageProps) {
  const { t } = useTranslation();
  const { Frame } = host;
  // Every occupant in its primary sample, ready: Sample and State are the
  // surface view's.
  const rendered = Object.fromEntries(
    Object.entries(contents).map(([name, panel]) => [
      name,
      {
        panel,
        defaultTab: tabs[name] ?? activeTab(panel),
        onTabChange: (id: string) => onTab(name, id),
        revision: revisions[name] ?? 0,
        occupants: Object.fromEntries(
          occupantsIn(panel).flatMap((occupant) => {
            const found = OCCUPANT_REGISTRY.find(
              (o) => o.spec.name === occupant,
            );
            if (!found) return [];
            const node = found.render("primary", { state: "ready" });
            return [[occupant, { spec: found.spec, node }]];
          }),
        ),
      },
    ]),
  );
  const size =
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- CSS custom properties aren't in React.CSSProperties
    {
      "--page-width": `${pageWidth}px`,
      "--page-height": `${pageHeight}px`,
      "--zoom": scale,
    } as CSSProperties;
  return (
    <StageFrame
      data-template-name={host.spec.name}
      data-zoom={Math.round(scale * 100)}
      style={size}
      className="h-[calc(var(--page-height)*var(--zoom))] w-[calc(var(--page-width)*var(--zoom))] shrink-0"
      tag={t("workbench_frame_tag_template", {
        template: host.label,
        width: pageWidth,
      })}
    >
      {editing && (
        <EditSlots
          host={host}
          layout={layout}
          contents={contents}
          selected={selected}
          onSelect={onSelect}
          inspectorId={inspectorId}
        />
      )}
      {/* Always scaled, even by 1: a fixed-position part stays in the frame. */}
      <div
        data-slot="workbench-page"
        // In Edit mode the occupants can't be used, and look it.
        inert={editing}
        data-editing={editing}
        className="flex h-(--page-height) w-(--page-width) origin-top-left scale-(--zoom) flex-col data-[editing=true]:opacity-75"
      >
        {/* ApolloShell sizes itself to the window (h-screen); here it fills the page. */}
        <div className="h-full [&_.h-screen]:h-full [&_.min-h-svh]:min-h-0">
          <PreviewShell variant={shell} basePath="/preview/occupants">
            <LocaleReady>
              <Frame
                // A fresh template when a slot's open state changes: its
                // slots start as chosen. Placement and which
                // slots it has apply live.
                key={closedSlots(layout)}
                contents={rendered}
                choices={layout}
                onStatus={onStatus}
              />
            </LocaleReady>
          </PreviewShell>
        </div>
      </div>
    </StageFrame>
  );
}
