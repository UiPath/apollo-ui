"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Nextra's docs theme hardcodes `prefetch={false}` on sidebar links
// (nextra-theme-docs sidebar.js), which disables both viewport and hover
// prefetch. We restore hover-on-intent prefetching at the DOM level — see
// Next.js' HoverPrefetchLink pattern in docs/app/guides/prefetching.
export function SidebarHoverPrefetch() {
  const router = useRouter();

  useEffect(() => {
    const prefetched = new Set<string>();

    function handleIntent(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (!target.closest("aside")) return;

      const href = target.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      if (prefetched.has(href)) return;

      prefetched.add(href);
      router.prefetch(href);
    }

    document.addEventListener("mouseover", handleIntent);
    document.addEventListener("focusin", handleIntent);

    return () => {
      document.removeEventListener("mouseover", handleIntent);
      document.removeEventListener("focusin", handleIntent);
    };
  }, [router]);

  return null;
}
