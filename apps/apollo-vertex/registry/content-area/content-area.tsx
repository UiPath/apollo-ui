import { cva } from "class-variance-authority";
import type * as React from "react";

import type { SurfacePadding } from "@/lib/composition";
import { cn } from "@/lib/utils";

const contentAreaVariants = cva(
  "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto",
  {
    variants: {
      padding: {
        padded: "p-(--surface-inset)",
        flush: "p-0",
      },
    },
    defaultVariants: {
      padding: "padded",
    },
  },
);

interface ContentAreaProps extends React.ComponentProps<"div"> {
  /** Set from the occupant's spec. Defaults to "padded". */
  padding?: SurfacePadding;
}

function ContentArea({
  padding = "padded",
  className,
  ...props
}: ContentAreaProps) {
  return (
    <div
      data-surface="content-area"
      data-padding={padding}
      className={cn(contentAreaVariants({ padding }), className)}
      {...props}
    />
  );
}

export { ContentArea, contentAreaVariants };
export type { ContentAreaProps };
