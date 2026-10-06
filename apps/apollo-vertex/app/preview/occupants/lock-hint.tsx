"use client";

import { Lock } from "lucide-react";
import { type ComponentProps, type MouseEvent, useId } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LockIconProps {
  /** Why it's locked: its tooltip, and its description. */
  reason: string;
  /** The id of the reason's text, for whatever else it describes. */
  id: string;
}

/**
 * A lock, with why as its tooltip and its description. The reason's text
 * is hidden, at `id`, so the thing it locks can be described by it too.
 */
export function LockIcon({ reason, id }: LockIconProps) {
  const { t } = useTranslation();
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            tabIndex={0}
            data-slot="workbench-lock"
            aria-label={t("workbench_contents_locked")}
            aria-describedby={id}
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Lock aria-hidden className="size-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
      <span id={id} className="sr-only">
        {reason}
      </span>
    </>
  );
}

interface LockableButtonProps extends ComponentProps<typeof Button> {
  /** Why it can't be pressed, or null when it can. */
  reason: string | null;
  /** Its tooltip when it isn't locked: an icon button's name. */
  hint?: string;
}

/**
 * A button that a real limit can lock. Locked, it shows a lock, says why
 * in a tooltip and its description, and does nothing, but stays reachable
 * by keyboard so the reason can be read.
 */
export function LockableButton({
  reason,
  hint,
  onClick,
  className,
  children,
  ...props
}: LockableButtonProps) {
  const id = useId();
  const tip = reason ?? hint;
  const button = (
    <Button
      {...props}
      {...(reason && { "aria-disabled": true, "aria-describedby": id })}
      data-locked={reason !== null}
      className={cn(
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        className,
      )}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (!reason) onClick?.(event);
      }}
    >
      {reason ? <Lock aria-hidden /> : null}
      {children}
    </Button>
  );
  return (
    <>
      {tip ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      {reason && (
        <span id={id} className="sr-only">
          {reason}
        </span>
      )}
    </>
  );
}
