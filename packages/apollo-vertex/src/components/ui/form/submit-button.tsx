"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "./form-context";

type SubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type" | "disabled"
>;

function SubmitButton({ children, ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.canSubmit}>
      {(canSubmit) => (
        <Button type="submit" disabled={!canSubmit} {...props}>
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

export { SubmitButton };
export type { SubmitButtonProps };
