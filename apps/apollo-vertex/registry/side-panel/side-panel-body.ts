import { cva } from "class-variance-authority";

import { SCROLL_FADE_MASK } from "@/hooks/use-scroll-fade";

// The body holds the padding and, when the surface owns scrolling, is the
// scroll container with the fade mask. It is separate from the panel so the
// mask fades the content, never the panel's tint. It is the inner area: an
// inline-size container, and what useSurface() measures. A panel with tabs
// has one body per tab.
export const sidePanelBodyVariants = cva(
  "@container flex min-h-0 flex-1 flex-col outline-none",
  {
    variants: {
      padding: {
        padded: "p-(--surface-inset)",
        flush: "p-0",
      },
      scroll: {
        surface: ["overflow-y-auto", SCROLL_FADE_MASK].join(" "),
        occupant: "overflow-hidden",
      },
    },
    defaultVariants: {
      padding: "padded",
      scroll: "surface",
    },
  },
);

// The body's mask would hide its own focus ring, so its parent draws it.
export const BODY_FOCUS_RING =
  "has-[>[data-slot=side-panel-body]:focus-visible]:ring-2 has-[>[data-slot=side-panel-body]:focus-visible]:ring-inset has-[>[data-slot=side-panel-body]:focus-visible]:ring-ring";
