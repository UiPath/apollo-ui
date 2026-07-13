"use client";

import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormWizardContext } from "./form-wizard";

type FormWizardNavProps = ComponentProps<"div">;

function FormWizardNav({ className, ...props }: FormWizardNavProps) {
  const { form, isFirst, isLast, back } = useFormWizardContext();
  const { t } = useTranslation();

  return (
    <div
      data-slot="form-wizard-nav"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    >
      <Button type="button" variant="outline" onClick={back} disabled={isFirst}>
        {t("wizard_back")}
      </Button>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isLast ? t("wizard_submit") : t("wizard_next")}
          </Button>
        )}
      </form.Subscribe>
    </div>
  );
}

export { FormWizardNav };
export type { FormWizardNavProps };
