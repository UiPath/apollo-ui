"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { Workbench } from "./workbench";
import { parseWorkbenchView, type WorkbenchView } from "./workbench-url-state";

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
  const [initial, setInitial] = useState<WorkbenchView>();
  useEffect(() => {
    setInitial(parseWorkbenchView(window.location.search));
  }, []);
  if (!initial) return null;
  return createPortal(
    <LocaleProvider>
      <Workbench initial={initial} />
    </LocaleProvider>,
    document.body,
  );
}
