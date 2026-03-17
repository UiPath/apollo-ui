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

import { Alert, AlertDescription, AlertTitle } from "@/registry/alert/alert";
import { Badge } from "@/registry/badge/badge";
import { Button } from "@/registry/button/button";
import { Toaster } from "@/registry/sonner/sonner";

export function SonnerExamples() {
  return (
    <div className="space-y-3">
      <Toaster />
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
        Click each button to trigger a toast at the top-center of the screen.
        Toasts auto-dismiss after 5 seconds.
      </p>
    </div>
  );
}

export function AlertExamples() {
  return (
    <div className="space-y-3">
      <Alert status="default" visual="tinted">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>New version available</AlertTitle>
        <AlertDescription>
          A new version of the platform is ready. Review the changelog for details.
        </AlertDescription>
      </Alert>

      <Alert status="warning" visual="tinted">
        <TriangleAlertIcon className="h-4 w-4" />
        <AlertTitle>API rate limit approaching</AlertTitle>
        <AlertDescription>
          You have used 90% of your monthly API quota. Consider upgrading your
          plan.
        </AlertDescription>
      </Alert>

      <Alert status="error" visual="tinted">
        <OctagonXIcon className="h-4 w-4" />
        <AlertTitle>Connection failed</AlertTitle>
        <AlertDescription>
          Unable to reach the server. Check your network connection and try
          again.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function DismissibleAlert({
  children,
  status,
  visual = "outline",
}: {
  children: ReactNode;
  status: "default" | "warning" | "error";
  visual?: "outline" | "tinted" | "subtle";
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative">
      <Alert status={status} visual={visual}>
        {children}
      </Alert>
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
      <DismissibleAlert status="default">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>New version available</AlertTitle>
        <AlertDescription>
          A new version of the platform is ready. Review the changelog for
          details.
        </AlertDescription>
      </DismissibleAlert>

      <DismissibleAlert status="warning">
        <TriangleAlertIcon className="h-4 w-4" />
        <AlertTitle>API rate limit approaching</AlertTitle>
        <AlertDescription>
          You have used 90% of your monthly API quota. Consider upgrading your
          plan.
        </AlertDescription>
      </DismissibleAlert>

      <DismissibleAlert status="error">
        <OctagonXIcon className="h-4 w-4" />
        <AlertTitle>Connection failed</AlertTitle>
        <AlertDescription>
          Unable to reach the server. Check your network connection and try
          again.
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
    <Alert status="warning" visual="outline">
      <TriangleAlertIcon className="h-4 w-4" />
      <AlertTitle className="line-clamp-none">
        {missingDocs.length} required documents missing
      </AlertTitle>
      <AlertDescription className="col-start-2">
        <p>Upload these documents before completing quality check.</p>
        {/* Hidden measurement container to detect overflow */}
        <div
          ref={measureRef}
          className="flex flex-wrap gap-1.5 mt-2"
          style={{
            position: "absolute",
            visibility: "hidden",
            left: 0,
            right: 0,
          }}
        >
          {missingDocs.map((doc) => (
            <Badge key={doc} variant="secondary" status="warning">
              {doc}
            </Badge>
          ))}
        </div>
        <div
          style={
            !expanded && overflows && rowHeight
              ? { maxHeight: rowHeight, overflow: "hidden" }
              : {}
          }
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
    <Alert status="default" visual="outline">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>12 documents unclassified</AlertTitle>
      <AlertDescription>
        <p>Some documents could not be automatically classified.</p>
        <Button variant="outline" size="sm" className="mt-1.5">
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
