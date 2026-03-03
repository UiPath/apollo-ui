"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/alert/alert";
import { Button } from "@/registry/button/button";
import { Toaster } from "@/registry/sonner/sonner";

// Accessible foreground colors for light mode only.
// Same hue as the status token but darkened to pass WCAG AA (4.5:1) against --secondary.
// Dark mode uses the standard status tokens (which already pass 4.5:1 on dark backgrounds).
const statusForegroundStyles = `
  :root {
    --info-fg: oklch(0.49 0.12 210);
    --success-fg: oklch(0.46 0.10 152);
    --destructive-fg: oklch(0.50 0.14 18);
  }
`;

// Shared icon alignment classes for sonner
const iconAlign =
  "[&>[data-icon]]:!items-start [&>[data-icon]>svg]:!mt-0.5";

// Override Sonner's close button position: right side, inside the toast
const closeButtonStyles = `
  [data-sonner-toast] [data-close-button] {
    left: unset !important;
    right: 8px !important;
    top: 8px !important;
    transform: none !important;
    border: none !important;
    background: transparent !important;
    border-radius: 4px !important;
  }
`;

// Light: solid secondary bg with status border. Dark: tinted status bg blended with popover.
// srgb interpolation avoids hue shift when mixing with blue-gray popover
const toastClassNames = {
  info: `!border-info !bg-secondary dark:!bg-[color-mix(in_srgb,var(--info)_25%,var(--popover)_75%)] [&>svg]:!text-[var(--info-fg)] dark:[&>svg]:!text-info ${iconAlign} `,
  success: `!border-success !bg-secondary dark:!bg-[color-mix(in_srgb,var(--success)_25%,var(--popover)_75%)] [&>svg]:!text-[var(--success-fg)] dark:[&>svg]:!text-success ${iconAlign} `,
  warning: `!border-warning !bg-secondary dark:!bg-[color-mix(in_srgb,var(--warning)_25%,var(--popover)_75%)] [&>svg]:!text-warning-foreground dark:[&>svg]:!text-warning ${iconAlign} `,
  error: `!border-destructive !bg-secondary dark:!bg-[color-mix(in_srgb,var(--destructive)_25%,var(--popover)_75%)] [&>svg]:!text-[var(--destructive-fg)] dark:[&>svg]:!text-destructive ${iconAlign} `,
};

export function SonnerExamples() {
  return (
    <div className="space-y-3">
      <style>{statusForegroundStyles}</style>
      <style>{closeButtonStyles}</style>
      <Toaster
        position="top-center"
        closeButton
        toastOptions={{ classNames: toastClassNames }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="border-info text-info dark:text-info bg-transparent hover:bg-info/15"
          onClick={() =>
            toast.info("Background sync complete", {
              description: "All data is up to date.",
            })
          }
        >
          <InfoIcon className="h-4 w-4" /> Info
        </Button>
        <Button
          variant="outline"
          className="border-success text-success dark:text-success bg-transparent hover:bg-success/10"
          onClick={() =>
            toast.success("Changes saved", {
              description: "Your updates have been applied.",
            })
          }
        >
          <CircleCheckIcon className="h-4 w-4" /> Success
        </Button>
        <Button
          variant="outline"
          className="border-warning text-warning-foreground dark:text-warning bg-transparent hover:bg-warning/15"
          onClick={() =>
            toast.warning("Storage almost full", {
              description: "Consider removing unused files.",
            })
          }
        >
          <TriangleAlertIcon className="h-4 w-4" /> Warning
        </Button>
        <Button
          variant="outline"
          className="border-destructive text-destructive dark:text-destructive bg-transparent hover:bg-destructive/10"
          onClick={() =>
            toast.error("Upload failed", {
              description: "Please check your connection and retry.",
            })
          }
        >
          <OctagonXIcon className="h-4 w-4" /> Error
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click each button to trigger a toast at the top-center of the screen. Toasts auto-dismiss after 5 seconds.
      </p>
    </div>
  );
}

export function AlertExamples() {
  return (
    <div className="space-y-3">
      <style>{statusForegroundStyles}</style>
      <Alert className="border-transparent bg-info/15 dark:bg-info/25 text-[var(--info-fg)] dark:text-white [&>svg]:text-[var(--info-fg)] dark:[&>svg]:text-white">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>New version available</AlertTitle>
        <AlertDescription className="text-[var(--info-fg)] dark:text-white/80">
          A new version of the platform is ready. Review the changelog for details.
        </AlertDescription>
      </Alert>

      <Alert className="border-transparent bg-success/10 dark:bg-success/25 text-[var(--success-fg)] dark:text-white [&>svg]:text-[var(--success-fg)] dark:[&>svg]:text-white">
        <CircleCheckIcon className="h-4 w-4" />
        <AlertTitle>Changes saved</AlertTitle>
        <AlertDescription className="text-[var(--success-fg)] dark:text-white/80">
          Your configuration has been updated successfully.
        </AlertDescription>
      </Alert>

      <Alert className="border-transparent bg-warning/15 dark:bg-warning/25 text-warning-foreground dark:text-white [&>svg]:text-warning-foreground dark:[&>svg]:text-warning">
        <TriangleAlertIcon className="h-4 w-4" />
        <AlertTitle>API rate limit approaching</AlertTitle>
        <AlertDescription className="text-warning-foreground dark:text-white/80">
          You have used 90% of your monthly API quota. Consider upgrading your plan.
        </AlertDescription>
      </Alert>

      <Alert className="border-transparent bg-destructive/10 dark:bg-destructive/25 text-[var(--destructive-fg)] dark:text-white [&>svg]:text-[var(--destructive-fg)] dark:[&>svg]:text-white">
        <OctagonXIcon className="h-4 w-4" />
        <AlertTitle>Connection failed</AlertTitle>
        <AlertDescription className="text-[var(--destructive-fg)] dark:text-white/80">
          Unable to reach the server. Check your network connection and try again.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function DismissibleAlert({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative">
      <Alert className={className}>{children}</Alert>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AlertOutlineExamples() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="space-y-3" key={resetKey}>
      <DismissibleAlert className="border-info bg-transparent [&>svg]:text-info">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>New version available</AlertTitle>
        <AlertDescription>
          A new version of the platform is ready. Review the changelog for details.
        </AlertDescription>
      </DismissibleAlert>

      <DismissibleAlert className="border-success bg-transparent [&>svg]:text-success">
        <CircleCheckIcon className="h-4 w-4" />
        <AlertTitle>Changes saved</AlertTitle>
        <AlertDescription>
          Your configuration has been updated successfully.
        </AlertDescription>
      </DismissibleAlert>

      <DismissibleAlert className="border-warning bg-transparent [&>svg]:text-warning-foreground dark:[&>svg]:text-warning">
        <TriangleAlertIcon className="h-4 w-4" />
        <AlertTitle>API rate limit approaching</AlertTitle>
        <AlertDescription>
          You have used 90% of your monthly API quota. Consider upgrading your plan.
        </AlertDescription>
      </DismissibleAlert>

      <DismissibleAlert className="border-destructive bg-transparent [&>svg]:text-destructive">
        <OctagonXIcon className="h-4 w-4" />
        <AlertTitle>Connection failed</AlertTitle>
        <AlertDescription>
          Unable to reach the server. Check your network connection and try again.
        </AlertDescription>
      </DismissibleAlert>

      <button
        type="button"
        onClick={() => setResetKey((k) => k + 1)}
        className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
      >
        Reset dismissed alerts
      </button>
    </div>
  );
}

const alertDefaultBgStyles = `
  :root:not(.dark) .alert-default-bg [data-slot="alert"] {
    background-color: var(--secondary) !important;
  }
`;

// Override Alert's [&>svg]:text-current which twMerge doesn't reliably resolve
const alertDefaultIconStyles = `
  .alert-default-bg [data-slot="alert"].alert-icon-info > svg { color: var(--info-fg) }
  .alert-default-bg [data-slot="alert"].alert-icon-success > svg { color: var(--success-fg) }
  .alert-default-bg [data-slot="alert"].alert-icon-warning > svg { color: var(--warning-foreground) }
  .alert-default-bg [data-slot="alert"].alert-icon-destructive > svg { color: var(--destructive-fg) }

  .dark .alert-default-bg [data-slot="alert"].alert-icon-info > svg { color: var(--info) }
  .dark .alert-default-bg [data-slot="alert"].alert-icon-success > svg { color: var(--success) }
  .dark .alert-default-bg [data-slot="alert"].alert-icon-warning > svg { color: var(--warning) }
  .dark .alert-default-bg [data-slot="alert"].alert-icon-destructive > svg { color: var(--destructive) }
`;

export function AlertDefaultExamples() {
  return (
    <div className="alert-default-bg space-y-3">
      <style>{statusForegroundStyles}</style>
      <style>{alertDefaultBgStyles}</style>
      <style>{alertDefaultIconStyles}</style>
      <Alert className="alert-icon-info">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="text-[var(--info-fg)] dark:text-info">New version available</AlertTitle>
        <AlertDescription>
          A new version of the platform is ready. Review the changelog for details.
        </AlertDescription>
      </Alert>

      <Alert className="alert-icon-success">
        <CircleCheckIcon className="h-4 w-4" />
        <AlertTitle className="text-[var(--success-fg)] dark:text-success">Changes saved</AlertTitle>
        <AlertDescription>
          Your configuration has been updated successfully.
        </AlertDescription>
      </Alert>

      <Alert className="alert-icon-warning">
        <TriangleAlertIcon className="h-4 w-4" />
        <AlertTitle className="text-warning-foreground dark:text-warning">API rate limit approaching</AlertTitle>
        <AlertDescription>
          You have used 90% of your monthly API quota. Consider upgrading your plan.
        </AlertDescription>
      </Alert>

      <Alert className="alert-icon-destructive">
        <OctagonXIcon className="h-4 w-4" />
        <AlertTitle className="text-[var(--destructive-fg)] dark:text-destructive">Connection failed</AlertTitle>
        <AlertDescription>
          Unable to reach the server. Check your network connection and try again.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function LayoutDiagram() {
  return (
    <div className="relative w-full border rounded-lg overflow-hidden bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted-foreground/30" />
          <span className="text-xs font-medium text-muted-foreground">App Header</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="rounded border border-dashed border-destructive bg-transparent px-2 py-0.5">
            <span className="text-[10px] font-medium text-destructive">Reserved: Primary CTAs</span>
          </div>
        </div>
      </div>

      {/* Sonner position indicator */}
      <div className="flex justify-center py-2">
        <div className="rounded-md border border-info bg-transparent px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-medium text-info">Sonner position: top-center</span>
        </div>
      </div>

      {/* Body area */}
      <div className="relative px-4 pb-4 pt-2">
        {/* System banner example */}
        <div className="mb-3 w-full rounded border border-warning bg-transparent px-3 py-1.5">
          <span className="text-[10px] font-medium text-warning-foreground dark:text-warning">
            System banner (full-width, below header) — for alerts with no UI anchor
          </span>
        </div>

        {/* Content area with inline alert */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted-foreground/15" />
            <div className="h-3 w-1/2 rounded bg-muted-foreground/15" />
            <div className="rounded border border-info bg-transparent px-3 py-1.5 mt-2">
              <span className="text-[10px] font-medium text-info">
                Inline Alert — anchored near relevant content
              </span>
            </div>
            <div className="h-3 w-2/3 rounded bg-muted-foreground/15" />
            <div className="h-3 w-1/3 rounded bg-muted-foreground/15" />
          </div>
        </div>

        {/* Chat reserved area */}
        <div className="absolute bottom-3 right-3">
          <div className="rounded border border-dashed border-destructive bg-transparent px-2 py-1">
            <span className="text-[10px] font-medium text-destructive">Reserved: Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
