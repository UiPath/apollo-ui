"use client";

import { SlidersHorizontal, X } from "lucide-react";
import {
  type CSSProperties,
  createContext,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { SIDE_PANEL_TINT_STRENGTH } from "@/lib/composition";
import { PreviewShell } from "@/templates/shell/PreviewShell";
import { DetailPageExample } from "./DetailPageExample";
import type { PanelSide } from "./detail-page.template";
import { PreviewControlBar } from "./PreviewControlBar";
import {
  DEFAULT_PREVIEW_SETTINGS,
  type PanelSlotName,
  type PreviewSettings,
  parsePreviewSettings,
  serializePreviewSettings,
} from "./preview-url-state";
import { type DetailPageState, useDetailPage } from "./use-detail-page";

interface PreviewContextValue {
  settings: PreviewSettings;
  detailPage: DetailPageState;
  onTabChange: (slot: PanelSlotName, id: string) => void;
}

const PREVIEW_PATH = "/preview/detail-page";

// The page renders inside the shell's router, so settings reach it through
// context.
const PreviewContext = createContext<PreviewContextValue | null>(null);

function PreviewPage() {
  const preview = useContext(PreviewContext);
  if (!preview) return null;
  return (
    <DetailPageExample
      state={preview.detailPage}
      paddings={preview.settings.paddings}
      contents={preview.settings.contents}
      scrolls={preview.settings.scrolls}
      arrangements={preview.settings.arrangements}
      tabs={preview.settings.tabs}
      onTabChange={preview.onTabChange}
    />
  );
}

const CONFIG_CARD_ID = "detail-page-preview-config";

interface DetailPagePreviewProps {
  /**
   * For embedding in a docs page: no Configure card, and the page URL is
   * neither read nor written. It uses the minimal shell, so a docs-width
   * preview has room for main and a panel.
   */
  embedded?: boolean;
}

export function DetailPagePreview({
  embedded = false,
}: DetailPagePreviewProps) {
  // The preview only renders client-side, so the URL is readable up front.
  const [settings, setSettings] = useState<PreviewSettings>(() =>
    embedded
      ? { ...DEFAULT_PREVIEW_SETTINGS, shellVariant: "minimal" }
      : parsePreviewSettings(window.location.search),
  );
  // Not stored in the URL, so shared links open looking like a real page.
  const [isCardOpen, setIsCardOpen] = useState(false);
  // Preview-only tuning of --side-panel-tint. Starts at the token's 60% and
  // is not stored in the URL. Null means use the token as shipped.
  const [tintStrength, setTintStrength] = useState<number | null>(null);
  const tintStyle: CSSProperties &
    Partial<Record<"--side-panel-tint", string>> =
    tintStrength === null
      ? {}
      : {
          "--side-panel-tint": `color-mix(in oklab, var(--sidebar) ${tintStrength}%, transparent)`,
        };
  const detailPage = useDetailPage(settings.config);

  // Resets and Back both replace everything with a given set of settings:
  // the preview's own, the hook's panel intent and chosen width, and the
  // tint override.
  const applySettings = (next: PreviewSettings) => {
    setSettings(next);
    detailPage.restore(next.config);
    setTintStrength(null);
  };

  // Reset to defaults. pushState (not replaceState, as everywhere else) so
  // Back undoes it. Focus returns to the card's first control afterwards.
  const focusAfterReset = useRef(false);
  const resetToDefaults = () => {
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${window.location.hash}`,
    );
    applySettings(DEFAULT_PREVIEW_SETTINGS);
    focusAfterReset.current = true;
  };
  useEffect(() => {
    if (!focusAfterReset.current) return;
    focusAfterReset.current = false;
    // The card's first control is its first toggle group. Focus its
    // checked item, the one Tab would land on after a fresh render. Radix
    // otherwise keeps whichever item was last focused as the Tab stop.
    const firstGroup = document.querySelector<HTMLElement>(
      `#${CONFIG_CARD_ID} [role="group"]`,
    );
    const target =
      firstGroup?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      firstGroup?.querySelector<HTMLElement>('[role="radio"]');
    target?.focus();
  });

  // Back and Forward: read the settings back out of the URL.
  const applyRef = useRef(applySettings);
  useEffect(() => {
    applyRef.current = applySettings;
  });
  useEffect(() => {
    if (embedded) return;
    const onPopState = () =>
      applyRef.current(parsePreviewSettings(window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [embedded]);

  // Keep the URL in step with the settings. replaceState, so tweaking the
  // preview does not fill the back button history.
  // The end width comes from the hook, which holds the user's chosen width.
  const endWidthChosen = detailPage.endWidthChosen;
  useEffect(() => {
    if (embedded) return;
    const query = serializePreviewSettings({
      ...settings,
      config: {
        ...settings.config,
        end: { ...settings.config.end, defaultWidth: endWidthChosen },
      },
    });
    const url = `${window.location.pathname}${query}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [settings, endWidthChosen, embedded]);

  // The tab a panel shows goes in the URL, so a link opens on it.
  const onTabChange = (slot: PanelSlotName, id: string) =>
    setSettings((prev) => ({ ...prev, tabs: { ...prev.tabs, [slot]: id } }));

  // Save the user's choice as the panel's defaultOpen so it lands in the
  // URL. Closes made by the main-width rule never reach here.
  const setPanelOpen = (side: PanelSide, open: boolean) => {
    detailPage.setPanelOpen(side, open);
    setSettings((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [side]: { ...prev.config[side], defaultOpen: open },
      },
    }));
  };

  return (
    <>
      {/* Scopes the tint override to the preview; `contents` adds no box. */}
      <div className="contents" style={tintStyle}>
        <PreviewContext.Provider value={{ settings, detailPage, onTabChange }}>
          <PreviewShell variant={settings.shellVariant} basePath={PREVIEW_PATH}>
            <PreviewPage />
          </PreviewShell>
        </PreviewContext.Provider>
      </div>
      {!embedded && (
        <div className="fixed right-4 bottom-4 z-60 flex flex-col items-end gap-2">
          <div id={CONFIG_CARD_ID} hidden={!isCardOpen}>
            {/*
              The card sits outside the shell, which loads translations, and
              its copy is translated: while they load it suspends here, not
              the whole preview.
            */}
            <Suspense fallback={null}>
              <PreviewControlBar
                settings={settings}
                onChange={setSettings}
                open={detailPage.open}
                closedBy={detailPage.closedBy}
                onOpenChange={setPanelOpen}
                endWidth={detailPage.endWidth}
                endWidthChosen={detailPage.endWidthChosen}
                onResetEndWidth={detailPage.resetEndWidth}
                tintStrength={tintStrength ?? SIDE_PANEL_TINT_STRENGTH}
                onTintStrengthChange={setTintStrength}
                onReset={resetToDefaults}
              />
            </Suspense>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shadow-md"
            aria-expanded={isCardOpen}
            aria-controls={CONFIG_CARD_ID}
            onClick={() => setIsCardOpen((open) => !open)}
          >
            {isCardOpen ? <X /> : <SlidersHorizontal />}
            Configure
          </Button>
        </div>
      )}
    </>
  );
}
