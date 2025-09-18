import { ApCircularProgress, ApIcon } from "@uipath/portal-shell-react";
import { useMemo } from "react";

export function ExecutionStatusIcon({
  status,
  size = 16,
}: {
  status?: "InProgress" | "Cancelled" | "Completed" | "Paused" | "Failed" | "NotExecuted" | "Terminated" | string;
  size?: number;
}) {
  return useMemo(() => {
    switch (status) {
      case "InProgress":
        return <ApCircularProgress size={size} style={{ backgroundColor: "transparent" }} />;
      case "Completed":
        return <ApIcon color="var(--color-success-icon)" name="check_circle" size={`${size}px`} />;
      case "Paused":
        return <ApIcon color="var(--color-warning-icon)" name="pause" size={`${size}px`} />;
      case "Failed":
        return <ApIcon color="var(--color-error-icon)" name="error" size={`${size}px`} />;
      case "Terminated":
        return <ApIcon color="var(--color-error-icon)" name="close" size={`${size}px`} />;
      case "Cancelled":
        return <ApIcon color="var(--color-error-icon)" name="block" size={`${size}px`} />;
      case "NotExecuted":
        return <ApIcon color="var(--color-foreground-de-emp)" name="hourglass_empty" size={`${size}px`} />;
      default:
        return null;
    }
  }, [status, size]);
}
