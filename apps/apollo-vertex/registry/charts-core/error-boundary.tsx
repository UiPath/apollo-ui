import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";

function Fallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert">
      <p>{t("chart_render_failed_title")}</p>
      <pre style={{ color: "red" }}>{message}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        {t("try_again")}
      </button>
    </div>
  );
}

interface ErrorBoundaryWithFallbackProps {
  children: ReactNode;
  resetKeys?: string[];
}

export const ErrorBoundaryWithFallback = ({
  children,
  resetKeys,
}: ErrorBoundaryWithFallbackProps) => {
  return (
    <ErrorBoundary FallbackComponent={Fallback} resetKeys={resetKeys}>
      {children}
    </ErrorBoundary>
  );
};
