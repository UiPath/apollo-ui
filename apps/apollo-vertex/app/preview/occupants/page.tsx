"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isDocsPath, lastDocsPage } from "@/app/_components/last-docs-page";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { Workbench } from "./workbench";
import { parseWorkbenchView, type WorkbenchView } from "./workbench-url-state";

/**
 * Where "Back to docs" goes: the docs page this tab showed last, then the
 * page that linked here, then the Design architecture overview.
 */
function docsPageBefore(): string {
  const remembered = lastDocsPage();
  if (remembered) return remembered;
  try {
    const from = new URL(document.referrer);
    if (from.origin === window.location.origin && isDocsPath(from.pathname))
      return `${from.pathname}${from.hash}`;
  } catch {
    // No referrer.
  }
  return "/guidelines/design-architecture";
}

/*
 * Preview only: the occupant workbench. Any registered occupant, alone in
 * any registered surface's real host, with no template. The whole view is
 * in the URL (see workbench-url-state.ts). Surfaces, and their places on
 * the page map, come from SURFACE_HOSTS, so a newly registered surface
 * shows up here with no changes.
 */
export default function OccupantWorkbenchPage() {
  // Client only, portaled to the body, with nothing that suspends: under the
  // docs layout, a full-screen client page otherwise stays hidden
  // (display: none) after hydration. So the URL is read on mount.
  const [initial, setInitial] = useState<{
    view: WorkbenchView;
    docsHref: string;
  }>();
  useEffect(() => {
    setInitial({
      view: parseWorkbenchView(window.location.search),
      docsHref: docsPageBefore(),
    });
  }, []);
  if (!initial) return null;
  return createPortal(
    <LocaleProvider>
      <Workbench initial={initial.view} docsHref={initial.docsHref} />
    </LocaleProvider>,
    document.body,
  );
}
