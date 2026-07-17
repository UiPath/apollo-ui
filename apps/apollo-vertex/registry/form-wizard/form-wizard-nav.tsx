"use client";

import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormWizardContext } from "./form-wizard";

type FormWizardButtonProps = Omit<
  ComponentProps<typeof Button>,
  "type" | "disabled" | "onClick"
>;

function FormWizardBackButton({
  children,
  variant = "outline",
  ...props
}: FormWizardButtonProps) {
  const { isFirst, back } = useFormWizardContext();
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant={variant}
      onClick={back}
      disabled={isFirst}
      {...props}
    >
      {children ?? t("wizard_back")}
    </Button>
  );
}

function FormWizardNextButton({ children, ...props }: FormWizardButtonProps) {
  const { form, isLast } = useFormWizardContext();
  const { t } = useTranslation();

  // type="submit" submits the enclosing step FormGroup, which advances on pass.
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting} {...props}>
          {children ?? (isLast ? t("wizard_submit") : t("wizard_next"))}
        </Button>
      )}
    </form.Subscribe>
  );
}

type FormWizardNavProps = ComponentProps<"div">;

function FormWizardNav({ className, ...props }: FormWizardNavProps) {
  return (
    <div
      data-slot="form-wizard-nav"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    >
      <FormWizardBackButton />
      <FormWizardNextButton />
    </div>
  );
}

export { FormWizardBackButton, FormWizardNav, FormWizardNextButton };
export type { FormWizardButtonProps, FormWizardNavProps };
