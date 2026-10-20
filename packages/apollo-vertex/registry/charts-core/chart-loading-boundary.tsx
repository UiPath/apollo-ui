import type { ReactNode } from "react";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ErrorBoundaryWithFallback } from "./error-boundary";

interface ChartLoadingBoundaryProps<TConfiguration, TDataModel> {
  configuration: TConfiguration;
  dataModel: TDataModel;
  children: ReactNode;
}

export function ChartLoadingBoundary<TConfiguration, TDataModel>({
  configuration,
  dataModel,
  children,
}: ChartLoadingBoundaryProps<TConfiguration, TDataModel>) {
  return (
    <ErrorBoundaryWithFallback
      resetKeys={[JSON.stringify(configuration), JSON.stringify(dataModel)]}
    >
      <Suspense
        fallback={
          <div className="flex h-full min-h-[200px] w-full items-center justify-center">
            <Spinner className="size-8" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundaryWithFallback>
  );
}
