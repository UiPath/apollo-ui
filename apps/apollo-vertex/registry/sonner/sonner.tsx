"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Shared icon alignment: top-align icons with the first line of toast text
const iconAlign = "[&>[data-icon]]:!items-start [&>[data-icon]>svg]:!mt-0.5";

// Apollo status styles for Sonner toasts.
// Light: inverted card surface (info) or status-tinted background; matching icon color.
// Dark: inverted secondary surface (info) or status-tinted color-mix with popover.
export const apolloToastClassNames: NonNullable<
  NonNullable<ToasterProps["toastOptions"]>["classNames"]
> = {
  info: `!border-info !bg-card-foreground dark:!bg-card-foreground [&>[data-icon]>svg]:!text-primary-foreground [&_[data-title]]:!text-primary-foreground [&_[data-description]]:!text-primary-foreground [&_[data-close-button]]:!text-primary-foreground ${iconAlign}`,
  success: `!border-success !bg-[color-mix(in_srgb,var(--success)_25%,var(--card)_75%)] dark:!bg-[color-mix(in_srgb,var(--success)_25%,var(--popover)_75%)] [&>[data-icon]>svg]:!text-[oklch(0.166_0.0283_203.34)] dark:[&>[data-icon]>svg]:!text-foreground [&_[data-title]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-title]]:!text-foreground [&_[data-description]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-description]]:!text-foreground [&_[data-close-button]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-close-button]]:!text-foreground ${iconAlign}`,
  warning: `!border-warning !bg-[color-mix(in_srgb,var(--warning)_60%,var(--card)_40%)] dark:!bg-[color-mix(in_srgb,var(--warning)_60%,var(--popover)_40%)] [&>[data-icon]>svg]:!text-[oklch(0.166_0.0283_203.34)] dark:[&>[data-icon]>svg]:!text-foreground [&_[data-title]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-title]]:!text-foreground [&_[data-description]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-description]]:!text-foreground [&_[data-close-button]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-close-button]]:!text-foreground ${iconAlign}`,
  error: `!border-destructive !bg-[color-mix(in_srgb,var(--destructive)_50%,var(--card)_50%)] dark:!bg-[color-mix(in_srgb,var(--destructive)_50%,var(--popover)_50%)] [&>[data-icon]>svg]:!text-[oklch(0.166_0.0283_203.34)] dark:[&>[data-icon]>svg]:!text-foreground [&_[data-title]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-title]]:!text-foreground [&_[data-description]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-description]]:!text-foreground [&_[data-close-button]]:!text-[oklch(0.166_0.0283_203.34)] dark:[&_[data-close-button]]:!text-foreground ${iconAlign}`,
  closeButton:
    '!left-auto !right-2 !top-2 !transform-none !border-none !bg-transparent !rounded-sm',
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={5000}
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: apolloToastClassNames }}
      {...props}
    />
  );
};

export { Toaster };
