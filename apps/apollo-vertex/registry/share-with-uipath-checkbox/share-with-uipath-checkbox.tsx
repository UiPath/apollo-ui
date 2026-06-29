"use client";

import { useId } from "react";

import { Checkbox } from "@/registry/checkbox/checkbox";
import { Label } from "@/registry/label/label";
import { cn } from "@/lib/utils";

type ShareWithUiPathCheckboxProps = {
  /** Controlled checked state of the opt-in. */
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /**
   * The opt-in copy. Required so consumers plug in their own translated,
   * legal-approved string (e.g. "Share feedback data with UiPath to help
   * troubleshoot and improve the product").
   */
  label: string;
  disabled?: boolean;
  /** Extra classes for the wrapper — typically spacing (e.g. `mb-3`). */
  className?: string;
  /** Label text size. `sm` => `text-xs`, `default` => `text-sm`. */
  size?: "default" | "sm";
};

function ShareWithUiPathCheckbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  size = "default",
}: ShareWithUiPathCheckboxProps) {
  // Self-generated id keeps the label association unique even when several
  // instances mount on the same page.
  const id = useId();

  return (
    <div
      data-slot="share-with-uipath-checkbox"
      className={cn("flex items-center gap-2", className)}
    >
      <Checkbox
        id={id}
        checked={checked}
        // Radix yields `boolean | "indeterminate"`; collapse to a plain boolean
        // so consumers never have to.
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label
        htmlFor={id}
        className={cn("font-normal", size === "sm" ? "text-xs" : "text-sm")}
      >
        {label}
      </Label>
    </div>
  );
}

export { ShareWithUiPathCheckbox };
export type { ShareWithUiPathCheckboxProps };
