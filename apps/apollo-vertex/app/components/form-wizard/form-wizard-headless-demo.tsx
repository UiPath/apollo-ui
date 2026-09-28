"use client";

import { formOptions } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { FieldGroup } from "@/components/ui/field";
import { withForm } from "@/components/ui/form";
import {
  FormWizard,
  FormWizardNav,
  FormWizardStep,
  FormWizardSteps,
  useFormWizard,
  useFormWizardContext,
  type WizardStepDef,
} from "@/components/ui/form-wizard";
import { cn } from "@/lib/utils";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const accountSchema = z.object({
  fullName: z.string().min(2, "Enter your name."),
  email: z.email("Enter a valid email."),
});
const planSchema = z.object({
  tier: z.string().min(1),
});
const reviewSchema = z.object({
  acceptTerms: z.boolean().refine((value) => value, {
    message: "Accept the terms to continue.",
  }),
});

const wizardSchema = z.object({
  account: accountSchema,
  plan: planSchema,
  review: reviewSchema,
});

type WizardValues = z.infer<typeof wizardSchema>;

const defaultValues = {
  account: { fullName: "", email: "" },
  plan: { tier: "free" },
  review: { acceptTerms: false },
};

const wizardOpts = formOptions({ defaultValues });

const tierOptions = [
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
];

const steps: WizardStepDef<WizardValues>[] = [
  { id: "account", title: "Account" },
  { id: "plan", title: "Plan" },
  { id: "review", title: "Review" },
];

// A custom nav rendered entirely by the consumer via the render-prop escape hatch.
function CustomNav() {
  return (
    <FormWizardNav>
      {({ back, isFirst, isLast, form }) => (
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={isFirst}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline disabled:opacity-40"
          >
            Go back
          </button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-50"
              >
                {isLast ? "Create account" : "Continue"}
              </button>
            )}
          </form.Subscribe>
        </div>
      )}
    </FormWizardNav>
  );
}

const AccountStep = withForm({
  ...wizardOpts,
  render: function Render({ form }) {
    const { next } = useFormWizardContext();
    return (
      <form.FormGroup
        name="account"
        validators={{ onDynamic: accountSchema }}
        onGroupSubmit={() => next()}
      >
        {(group) => (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void group.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField name="account.fullName">
                {(field) => (
                  <field.TextField
                    label="Full name"
                    placeholder="Ada Lovelace"
                  />
                )}
              </form.AppField>
              <form.AppField name="account.email">
                {(field) => (
                  <field.TextField
                    type="email"
                    label="Email"
                    placeholder="ada@example.com"
                  />
                )}
              </form.AppField>
              <CustomNav />
            </FieldGroup>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

const PlanStep = withForm({
  ...wizardOpts,
  render: function Render({ form }) {
    const { next } = useFormWizardContext();
    return (
      <form.FormGroup
        name="plan"
        validators={{ onDynamic: planSchema }}
        onGroupSubmit={() => next()}
      >
        {(group) => (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void group.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField name="plan.tier">
                {(field) => (
                  <field.RadioGroupField label="Plan" options={tierOptions} />
                )}
              </form.AppField>
              <CustomNav />
            </FieldGroup>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

const ReviewStep = withForm({
  ...wizardOpts,
  render: function Render({ form }) {
    const { next } = useFormWizardContext();
    return (
      <form.FormGroup
        name="review"
        validators={{ onDynamic: reviewSchema }}
        onGroupSubmit={() => next()}
      >
        {(group) => (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void group.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField name="review.acceptTerms">
                {(field) => (
                  <field.CheckboxField label="I accept the terms and conditions" />
                )}
              </form.AppField>
              <CustomNav />
            </FieldGroup>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

export function FormWizardHeadlessDemo() {
  const [submitted, setSubmitted] = useState<WizardValues | null>(null);

  const wizard = useFormWizard<WizardValues>({
    formOptions: wizardOpts,
    schema: wizardSchema,
    steps,
    onSubmit: (values) => setSubmitted(values),
  });

  return (
    <LocaleProvider>
      <FormWizard wizard={wizard}>
        {/* Custom progress rail built from the FormWizardSteps render prop. */}
        <FormWizardSteps>
          {({ steps: visibleSteps, stepIndex, goToStep }) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {visibleSteps.map((step, index) => {
                  const done = index < stepIndex;
                  const active = index === stepIndex;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      disabled={!done}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-colors",
                        active && "font-semibold text-foreground",
                        done && "text-foreground hover:opacity-80",
                        !active && !done && "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border text-xs",
                          active &&
                            "border-foreground bg-foreground text-background",
                          done &&
                            "border-foreground bg-foreground text-background",
                          !active && !done && "border-muted-foreground/40",
                        )}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      {step.title}
                    </button>
                  );
                })}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${wizard.progress}%` }}
                />
              </div>
            </div>
          )}
        </FormWizardSteps>

        <FormWizardStep stepId="account">
          <AccountStep form={wizard.form} />
        </FormWizardStep>
        <FormWizardStep stepId="plan">
          <PlanStep form={wizard.form} />
        </FormWizardStep>
        <FormWizardStep stepId="review">
          <ReviewStep form={wizard.form} />
        </FormWizardStep>
      </FormWizard>

      {submitted ? (
        <pre className="mt-6 overflow-x-auto rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : null}
    </LocaleProvider>
  );
}
