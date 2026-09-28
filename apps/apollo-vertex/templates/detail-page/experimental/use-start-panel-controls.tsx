"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OccupantSpec } from "@/lib/composition";
import type { DetailPageState } from "../use-detail-page";
import { PageRail } from "./page-rail";
import { OccupantLabel, PanelToggle } from "./start-panel-parts";

/**
 * Experimental: start panel controls, options B ("in-panel") and C
 * ("rail"), compared side by side. One is kept and the other deleted
 * before the PR. See StartPanelControls in detail-page.template.ts.
 */

export interface StartOccupant {
  spec: OccupantSpec;
  icon: LucideIcon;
}

interface StartPanelControlsOptions {
  state: DetailPageState;
  occupants: readonly StartOccupant[];
  activeName: string;
  onActiveChange: (name: string) => void;
}

export interface StartPanelControls {
  /** Id for the start SidePanel, referenced by aria-controls. */
  panelId: string;
  active: StartOccupant;
  /** Option B only: the expand toggle and divider, while closed. */
  headerLeading: ReactNode;
  /** Whether back stays in the page header. False when the rail holds it. */
  headerHasBack: boolean;
  panelToolbar: ReactNode;
  /** Option C only. */
  rail: ReactNode;
}

/**
 * Builds the start panel controls for the configured option. Every toggle
 * click goes through setPanelOpen, so it counts as the user's most recent
 * action under the main-width rule. When a toggle moves between the panel
 * and the header, focus follows it to its new spot.
 */
export function useStartPanelControls({
  state,
  occupants,
  activeName,
  onActiveChange,
}: StartPanelControlsOptions): StartPanelControls {
  const baseId = useId();
  const panelId = `${baseId}-start-panel`;
  const headerToggleId = `${baseId}-header-toggle`;
  const panelToggleId = `${baseId}-panel-toggle`;
  const railItemId = (name: string) => `${baseId}-rail-${name}`;

  // Focus lands after the render that shows the target, since a closed
  // panel is display: none until then.
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    const target = document.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (target && target.getClientRects().length > 0) {
      target.focus();
      pendingFocus.current = null;
    }
  });

  const isOpen = state.open.start;
  const mode = state.config.startControls ?? "in-panel";
  const active =
    occupants.find((o) => o.spec.name === activeName) ?? occupants[0];
  if (!active) throw new Error("useStartPanelControls needs an occupant");

  const openPanel = (focusId?: string) => {
    state.setPanelOpen("start", true);
    if (focusId) pendingFocus.current = focusId;
  };
  const closePanel = (focusId?: string) => {
    state.setPanelOpen("start", false);
    if (focusId) pendingFocus.current = focusId;
  };
  const selectOccupant = (name: string) => {
    onActiveChange(name);
    openPanel();
  };

  if (mode === "rail") {
    return {
      panelId,
      active,
      headerLeading: null,
      headerHasBack: false,
      panelToolbar: (
        <>
          <OccupantLabel label={active.spec.label} />
          <span className="ms-auto">
            <PanelToggle
              id={panelToggleId}
              expanded={isOpen}
              controls={panelId}
              // The rail stays, so focus returns to the icon that opened it.
              onClick={() => closePanel(railItemId(active.spec.name))}
            />
          </span>
        </>
      ),
      rail: (
        <PageRail
          top={
            <Button variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft />
            </Button>
          }
        >
          {occupants.map((occupant) => {
            const Icon = occupant.icon;
            const pressed = isOpen && occupant === active;
            return (
              <Button
                key={occupant.spec.name}
                id={railItemId(occupant.spec.name)}
                variant="ghost"
                size="icon"
                aria-label={occupant.spec.label}
                aria-pressed={pressed}
                aria-controls={panelId}
                className="aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                onClick={() =>
                  pressed ? closePanel() : selectOccupant(occupant.spec.name)
                }
              >
                <Icon />
              </Button>
            );
          })}
        </PageRail>
      ),
    };
  }

  return {
    panelId,
    active,
    headerLeading: isOpen ? null : (
      <>
        <PanelToggle
          id={headerToggleId}
          expanded={false}
          controls={panelId}
          onClick={() => openPanel(panelToggleId)}
        />
        <Separator orientation="vertical" />
      </>
    ),
    headerHasBack: true,
    panelToolbar: (
      <>
        {occupants.length > 1 ? (
          <ToggleGroup
            type="single"
            size="sm"
            value={active.spec.name}
            aria-label="Start panel content"
            onValueChange={(name) => {
              if (occupants.some((o) => o.spec.name === name)) {
                selectOccupant(name);
              }
            }}
          >
            {occupants.map((occupant) => {
              const Icon = occupant.icon;
              return (
                <ToggleGroupItem
                  key={occupant.spec.name}
                  value={occupant.spec.name}
                  aria-label={occupant.spec.label}
                >
                  <Icon />
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        ) : (
          <OccupantLabel label={active.spec.label} />
        )}
        <span className="ms-auto">
          <PanelToggle
            id={panelToggleId}
            expanded={isOpen}
            controls={panelId}
            onClick={() => closePanel(headerToggleId)}
          />
        </span>
      </>
    ),
    rail: null,
  };
}
