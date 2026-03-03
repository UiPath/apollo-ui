"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/alert/alert";
import { Badge } from "@/registry/badge/badge";
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

const missingDocs = [
  "W-9 Form",
  "Proof of Address",
  "Bank Statement",
  "Tax Return (2025)",
  "Employment Verification",
  "Government-Issued ID",
  "Utility Bill",
];

export function CollapsibleAlertExample() {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    if (!firstChild) return;
    const singleRow = firstChild.offsetHeight + 6;
    setRowHeight(singleRow);
    setOverflows(el.scrollHeight > singleRow);
  }, []);

  return (
    <Alert className="border-warning bg-transparent [&>svg]:text-warning-foreground dark:[&>svg]:text-warning">
      <TriangleAlertIcon className="h-4 w-4" />
      <AlertTitle className="line-clamp-none">
        {missingDocs.length} required documents missing
      </AlertTitle>
      <AlertDescription className="col-start-2">
        <p>Upload these documents before completing quality check.</p>
        {/* Hidden measurement container to detect overflow */}
        <div ref={measureRef} className="flex flex-wrap gap-1.5 mt-2" style={{ position: "absolute", visibility: "hidden", left: 0, right: 0 }}>
          {missingDocs.map((doc) => (
            <Badge key={doc} variant="secondary" status="warning">
              {doc}
            </Badge>
          ))}
        </div>
        <div
          style={!expanded && overflows && rowHeight ? { maxHeight: rowHeight, overflow: "hidden" } : {}}
          className="flex flex-wrap gap-1.5 mt-2"
        >
          {missingDocs.map((doc) => (
            <Badge key={doc} variant="secondary" status="warning">
              {doc}
            </Badge>
          ))}
        </div>
        {overflows && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 text-xs font-medium text-[oklch(0.60_0.125_210)] hover:underline transition-colors"
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function ActionAlertExample() {
  return (
    <Alert className="border-info bg-transparent [&>svg]:text-info">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>12 documents unclassified</AlertTitle>
      <AlertDescription>
        <p>Some documents could not be automatically classified.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-1.5"
        >
          Filter unclassified
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function CompositeAlertExamples() {
  return (
    <div className="space-y-3">
      <CollapsibleAlertExample />
      <ActionAlertExample />
    </div>
  );
}
