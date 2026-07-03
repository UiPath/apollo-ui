"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/components/ui/form";

const signUpSchema = z.object({
  fullName: z.string().min(2, "form_demo_error_name_min"),
  email: z.email("form_demo_error_email"),
  role: z.string().min(1, "form_demo_error_role"),
  plan: z.string().min(1, "form_demo_error_plan"),
  bio: z.string().max(160, "form_demo_error_bio_max"),
  notifications: z.boolean(),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "form_demo_error_terms",
  }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

const roleOptions = [
  { label: "Developer", value: "developer" },
  { label: "Designer", value: "designer" },
  { label: "Product manager", value: "pm" },
];

const planOptions = [
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" },
  { label: "Enterprise", value: "enterprise" },
];

export function FormDemo() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState<SignUpValues | null>(null);

  const form = useAppForm({
    defaultValues: {
      fullName: "",
      email: "",
      role: "",
      plan: "free",
      bio: "",
      notifications: true,
      acceptTerms: false,
    },
    validators: { onChange: signUpSchema },
    onSubmit: ({ value }) => {
      setSubmitted(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppForm>
        <FieldGroup>
          <form.FormErrorSummary
            title={t("form_demo_error_summary_title")}
            className="mb-2"
          />

          <form.AppField name="fullName">
            {(field) => (
              <field.TextField label="Full name" placeholder="Ada Lovelace" />
            )}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.TextField
                type="email"
                label="Email"
                placeholder="ada@example.com"
                description="We'll never share your email."
              />
            )}
          </form.AppField>

          <form.AppField name="role">
            {(field) => (
              <field.SelectField
                label="Role"
                placeholder="Select a role"
                options={roleOptions}
              />
            )}
          </form.AppField>

          <form.AppField name="plan">
            {(field) => (
              <field.RadioGroupField label="Plan" options={planOptions} />
            )}
          </form.AppField>

          <form.AppField name="bio">
            {(field) => (
              <field.TextareaField
                label="Bio"
                placeholder="Tell us about yourself"
                description="Maximum 160 characters."
              />
            )}
          </form.AppField>

          <form.AppField name="notifications">
            {(field) => (
              <field.SwitchField
                label="Product updates"
                description="Receive occasional product news."
              />
            )}
          </form.AppField>

          <form.AppField name="acceptTerms">
            {(field) => (
              <field.CheckboxField label="I accept the terms and conditions" />
            )}
          </form.AppField>

          <form.SubmitButton>Create account</form.SubmitButton>
        </FieldGroup>
      </form.AppForm>

      {submitted ? (
        <pre className="bg-muted text-muted-foreground mt-6 overflow-x-auto rounded-lg p-4 text-sm">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : null}
    </form>
  );
}
