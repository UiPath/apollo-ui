import type { PropsWithChildren } from "react";
import { Spinner } from "@/components/ui/spinner";

interface CenteredSpinnerProps {
  loading: boolean;
}

export const SpinnerWithChildren = ({
  children,
  loading,
}: PropsWithChildren<CenteredSpinnerProps>) => {
  return (
    <div className="relative flex h-full w-full items-center">
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
          <Spinner className="size-10" />
        </div>
      )}
      <div
        className={`flex h-full w-full items-center justify-center ${
          loading ? "pointer-events-none bg-background opacity-30" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
};
