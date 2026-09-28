"use client";

import type { ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useAppForm } from "@/components/ui/form";
import {
  PageHeader,
  PageHeaderNav,
  PageHeaderTitle,
} from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";

const EMAIL_FREQUENCIES = [
  { value: "realtime", label: "Realtime — every event" },
  { value: "daily", label: "Daily digest — once each morning" },
  { value: "weekly", label: "Weekly summary — Mondays" },
];

const VISIBILITIES = [
  { value: "public", label: "Public — anyone with the link" },
  { value: "internal", label: "Internal — your organization" },
  { value: "private", label: "Private — invitation only" },
];

const INDUSTRIES = [
  { value: "healthcare", label: "Healthcare" },
  { value: "financial-services", label: "Financial services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "public-sector", label: "Public sector" },
];

const LANGUAGES = [
  { value: "en-US", label: "English (United States)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" },
  { value: "ja-JP", label: "日本語" },
];

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "(GMT−08:00) Pacific Time" },
  { value: "America/New_York", label: "(GMT−05:00) Eastern Time" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
];

const DATE_FORMATS = [
  { value: "short", label: "4/24/26" },
  { value: "medium", label: "Apr 24, 2026" },
  { value: "long", label: "April 24, 2026" },
];

const settingsSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required"),
  description: z.string(),
  industry: z.string(),
  emailFrequency: z.enum(["realtime", "daily", "weekly"]),
  emailDigest: z.boolean(),
  browserPush: z.boolean(),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  visibility: z.enum(["public", "internal", "private"]),
  require2fa: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const DEFAULT_VALUES: SettingsValues = {
  workspaceName: "Acme Health",
  description: "Clinical operations workspace for the Acme Health network.",
  industry: "healthcare",
  emailFrequency: "daily",
  emailDigest: true,
  browserPush: false,
  language: "en-US",
  timezone: "America/New_York",
  dateFormat: "medium",
  visibility: "internal",
  require2fa: true,
};

interface SectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mb-8 space-y-6">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

export function WorkspaceSettings() {
  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: settingsSchema },
    onSubmit: ({ value, formApi }) => formApi.reset(value),
  });

  return (
    <div className="relative z-10">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitle>Workspace settings</PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="px-4 sm:px-6 lg:px-8 pb-8 grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-4"
      >
        <form.AppForm>
          <div className="col-span-4 sm:col-span-8 lg:col-span-7">
            <Section
              title="Profile"
              description="Identifies the workspace across the platform and in invitations."
            >
              <FieldGroup>
                <form.AppField name="workspaceName">
                  {(field) => <field.TextField label="Workspace name" />}
                </form.AppField>
                <form.AppField name="description">
                  {(field) => (
                    <field.TextareaField
                      label="Description"
                      description="Shown to invited members on the workspace landing page."
                      rows={3}
                    />
                  )}
                </form.AppField>
                <form.AppField name="industry">
                  {(field) => (
                    <field.SelectField
                      label="Industry"
                      description="Used to recommend starter templates and connectors."
                      placeholder="Select an industry"
                      options={INDUSTRIES}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </Section>

            <Section
              title="Notifications"
              description="Control how members are alerted about workspace activity."
            >
              <FieldGroup>
                <form.AppField name="emailFrequency">
                  {(field) => (
                    <field.RadioGroupField
                      label="Email frequency"
                      options={EMAIL_FREQUENCIES}
                    />
                  )}
                </form.AppField>
                <form.Field name="emailDigest">
                  {(field) => (
                    <Field orientation="horizontal" className="justify-between">
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Include unread mentions in the digest
                        </FieldLabel>
                        <FieldDescription>
                          Adds a section listing direct mentions you have not
                          read.
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                        onBlur={field.handleBlur}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="browserPush">
                  {(field) => (
                    <Field orientation="horizontal" className="justify-between">
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Browser push notifications
                        </FieldLabel>
                        <FieldDescription>
                          Show desktop notifications when this tab is in the
                          background.
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                        onBlur={field.handleBlur}
                      />
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            </Section>

            <Section
              title="Regional"
              description="Defaults applied to dates, times, and translatable strings."
            >
              <FieldGroup>
                <div className="grid sm:grid-cols-2 gap-4">
                  <form.AppField name="language">
                    {(field) => (
                      <field.SelectField label="Language" options={LANGUAGES} />
                    )}
                  </form.AppField>
                  <form.AppField name="timezone">
                    {(field) => (
                      <field.SelectField label="Timezone" options={TIMEZONES} />
                    )}
                  </form.AppField>
                </div>
                <form.AppField name="dateFormat">
                  {(field) => (
                    <field.SelectField
                      label="Date format"
                      options={DATE_FORMATS}
                      className="max-w-xs"
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </Section>

            <Section
              title="Privacy & security"
              description="Who can find this workspace and how they sign in."
            >
              <FieldGroup>
                <form.AppField name="visibility">
                  {(field) => (
                    <field.RadioGroupField
                      label="Workspace visibility"
                      options={VISIBILITIES}
                    />
                  )}
                </form.AppField>
                <form.Field name="require2fa">
                  {(field) => (
                    <Field orientation="horizontal" className="justify-between">
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>
                          Require two-factor authentication
                        </FieldLabel>
                        <FieldDescription>
                          Members without 2FA will be prompted to enroll on next
                          sign-in.
                        </FieldDescription>
                      </FieldContent>
                      <Switch
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                        onBlur={field.handleBlur}
                      />
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            </Section>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset(DEFAULT_VALUES)}
              >
                Reset to defaults
              </Button>
              <form.Subscribe selector={(state) => state.isDirty}>
                {(isDirty) => (
                  <Button type="submit" disabled={!isDirty}>
                    Save changes
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </form.AppForm>
      </form>
    </div>
  );
}
