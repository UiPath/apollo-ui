import type * as React from "react";

import { cn } from "@/lib/utils";

type ContentAreaProps = React.ComponentProps<"div">;

function ContentArea({ className, ...props }: ContentAreaProps) {
  return (
    <div
      data-surface="content-area"
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}

export { ContentArea };
export type { ContentAreaProps };
