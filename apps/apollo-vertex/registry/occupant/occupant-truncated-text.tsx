import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OccupantTruncatedTextProps {
  children: string;
  className?: string;
}

/**
 * One line of text that truncates, with the full text in a tooltip on hover.
 * The tooltip opens only while the text is cut off. Screen readers get the
 * full text either way: truncation is only visual.
 */
function OccupantTruncatedText({
  children,
  className,
}: OccupantTruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        const node = ref.current;
        setOpen(next && node !== null && node.scrollWidth > node.clientWidth);
      }}
    >
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("block min-w-0 truncate", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

export { OccupantTruncatedText };
export type { OccupantTruncatedTextProps };
