"use client";

import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormWizardContext } from "./form-wizard";

interface FormWizardNavRenderApi {
  back: () => void;
  next: () => void;
  isFirst: boolean;
  isLast: boolean;
  form: ReturnType<typeof useFormWizardContext>["form"];
}

interface FormWizardNavProps extends Omit<ComponentProps<"div">, "children"> {
  children?: (api: FormWizardNavRenderApi) => ReactNode;
}

function FormWizardNav({ className, children, ...props }: FormWizardNavProps) {
  const { form, isFirst, isLast, back, next } = useFormWizardContext();
  const { t } = useTranslation();

  if (typeof children === "function") {
    return <>{children({ back, next, isFirst, isLast, form })}</>;
  }

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
export type { FormWizardNavProps, FormWizardNavRenderApi };
