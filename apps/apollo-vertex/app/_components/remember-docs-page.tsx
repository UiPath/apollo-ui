"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { rememberDocsPage } from "./last-docs-page";

/** Records each docs page as it's shown, for the workbench's "Back to docs". */
export function RememberDocsPage() {
  const pathname = usePathname();
  useEffect(() => {
    rememberDocsPage(pathname);
  }, [pathname]);
  return null;
}
