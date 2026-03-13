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
// Light: solid secondary background with status-colored border and accessible icon.
// Dark: status-tinted background blended with popover; standard status token for icon.
// sRGB interpolation avoids hue shift when mixing with blue-gray popover.
export const apolloToastClassNames: NonNullable<
  NonNullable<ToasterProps["toastOptions"]>["classNames"]
> = {
  info: `!border-info !bg-secondary dark:!bg-[color-mix(in_srgb,var(--info)_25%,var(--popover)_75%)] [&>svg]:!text-[var(--info-fg)] dark:[&>svg]:!text-info ${iconAlign}`,
  success: `!border-success !bg-secondary dark:!bg-[color-mix(in_srgb,var(--success)_25%,var(--popover)_75%)] [&>svg]:!text-[var(--success-fg)] dark:[&>svg]:!text-success ${iconAlign}`,
  warning: `!border-warning !bg-secondary dark:!bg-[color-mix(in_srgb,var(--warning)_25%,var(--popover)_75%)] [&>svg]:!text-warning-foreground dark:[&>svg]:!text-warning ${iconAlign}`,
  error: `!border-destructive !bg-secondary dark:!bg-[color-mix(in_srgb,var(--destructive)_25%,var(--popover)_75%)] [&>svg]:!text-[var(--destructive-fg)] dark:[&>svg]:!text-destructive ${iconAlign}`,
  closeButton:
    "!left-auto !right-2 !top-2 !transform-none !border-none !bg-transparent !rounded-sm",
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
