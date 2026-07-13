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
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const accountSchema = z.object({
  fullName: z.string().min(2, "wizard_demo_error_name"),
  email: z.email("wizard_demo_error_email"),
});
const planSchema = z.object({
  tier: z.string().min(1),
  seats: z.string().min(1, "wizard_demo_error_seats"),
});
const billingSchema = z.object({
  poNumber: z.string().min(1, "wizard_demo_error_po"),
});
const reviewSchema = z.object({
  acceptTerms: z.boolean().refine((value) => value, {
    message: "wizard_demo_error_terms",
  }),
});

const wizardSchema = z.object({
  account: accountSchema,
  plan: planSchema,
  billing: billingSchema,
  review: reviewSchema,
});

type WizardValues = z.infer<typeof wizardSchema>;

const defaultValues = {
  account: { fullName: "", email: "" },
  plan: { tier: "free", seats: "1" },
  billing: { poNumber: "" },
  review: { acceptTerms: false },
};

const wizardOpts = formOptions({ defaultValues });

const tierOptions = [
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
  { label: "Enterprise", value: "enterprise" },
];

const steps: WizardStepDef<WizardValues>[] = [
  { id: "account", title: "Account" },
  { id: "plan", title: "Plan" },
  {
    id: "billing",
    title: "Billing",
    description: "Enterprise only",
    condition: (values) => values.plan.tier === "enterprise",
  },
  { id: "review", title: "Review" },
];

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
              <FormWizardNav />
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
              <form.AppField name="plan.seats">
                {(field) => <field.TextField label="Seats" type="number" />}
              </form.AppField>
              <FormWizardNav />
            </FieldGroup>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

const BillingStep = withForm({
  ...wizardOpts,
  render: function Render({ form }) {
    const { next } = useFormWizardContext();
    return (
      <form.FormGroup
        name="billing"
        validators={{ onDynamic: billingSchema }}
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
              <form.AppField name="billing.poNumber">
                {(field) => (
                  <field.TextField
                    label="Purchase order number"
                    placeholder="PO-000000"
                  />
                )}
              </form.AppField>
              <FormWizardNav />
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
              <FormWizardNav />
            </FieldGroup>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

export function FormWizardDemo() {
  const [submitted, setSubmitted] = useState<WizardValues | null>(null);

  const wizard = useFormWizard<WizardValues>({
    formOptions: wizardOpts,
    schema: wizardSchema,
    steps,
    persist: { key: "form-wizard-demo" },
    onSubmit: (values) => setSubmitted(values),
  });

  return (
    <LocaleProvider>
      <FormWizard wizard={wizard}>
        <FormWizardSteps />
        <FormWizardStep stepId="account">
          <AccountStep form={wizard.form} />
        </FormWizardStep>
        <FormWizardStep stepId="plan">
          <PlanStep form={wizard.form} />
        </FormWizardStep>
        <FormWizardStep stepId="billing">
          <BillingStep form={wizard.form} />
        </FormWizardStep>
        <FormWizardStep stepId="review">
          <ReviewStep form={wizard.form} />
        </FormWizardStep>
      </FormWizard>

      {submitted ? (
        <pre className="bg-muted text-muted-foreground mt-6 overflow-x-auto rounded-lg p-4 text-sm">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : null}
    </LocaleProvider>
  );
}
