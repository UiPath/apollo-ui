"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  PageHeaderNav,
  PageHeaderTitle,
} from "@/components/ui/page-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_FREQUENCIES = [
  { value: "realtime", label: "Realtime — every event" },
  { value: "daily", label: "Daily digest — once each morning" },
  { value: "weekly", label: "Weekly summary — Mondays" },
] as const;

type EmailFrequency = (typeof EMAIL_FREQUENCIES)[number]["value"];

const isEmailFrequency = (value: string): value is EmailFrequency =>
  EMAIL_FREQUENCIES.some((option) => option.value === value);

const VISIBILITIES = [
  { value: "public", label: "Public — anyone with the link" },
  { value: "internal", label: "Internal — your organization" },
  { value: "private", label: "Private — invitation only" },
] as const;

type Visibility = (typeof VISIBILITIES)[number]["value"];

const isVisibility = (value: string): value is Visibility =>
  VISIBILITIES.some((option) => option.value === value);

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

// Values map to Intl.DateTimeFormat({ dateStyle }) — no date library needed.
const DATE_FORMATS = [
  { value: "short", label: "4/24/26" },
  { value: "medium", label: "Apr 24, 2026" },
  { value: "long", label: "April 24, 2026" },
];

interface SettingsDraft {
  workspaceName: string;
  description: string;
  industry: string;
  emailFrequency: EmailFrequency;
  emailDigest: boolean;
  browserPush: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  visibility: Visibility;
  require2fa: boolean;
}

const INITIAL_DRAFT: SettingsDraft = {
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
  children: React.ReactNode;
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
  const [draft, setDraft] = useState<SettingsDraft>(INITIAL_DRAFT);
  const [saved, setSaved] = useState<SettingsDraft>(INITIAL_DRAFT);

  const hasChanges =
    draft.workspaceName !== saved.workspaceName ||
    draft.description !== saved.description ||
    draft.industry !== saved.industry ||
    draft.emailFrequency !== saved.emailFrequency ||
    draft.emailDigest !== saved.emailDigest ||
    draft.browserPush !== saved.browserPush ||
    draft.language !== saved.language ||
    draft.timezone !== saved.timezone ||
    draft.dateFormat !== saved.dateFormat ||
    draft.visibility !== saved.visibility ||
    draft.require2fa !== saved.require2fa;

  const updateField = <K extends keyof SettingsDraft>(
    key: K,
    value: SettingsDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => setSaved(draft);
  const handleReset = () => {
    setDraft(INITIAL_DRAFT);
    setSaved(INITIAL_DRAFT);
  };

  return (
    <div className="relative z-10">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitle>Workspace settings</PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-8 grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-4">
        <div className="col-span-4 sm:col-span-8 lg:col-span-7">
          <Section
            title="Profile"
            description="Identifies the workspace across the platform and in invitations."
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                <Input
                  id="workspace-name"
                  value={draft.workspaceName}
                  onChange={(e) => updateField("workspaceName", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <FieldDescription>
                  Shown to invited members on the workspace landing page.
                </FieldDescription>
                <Textarea
                  id="description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="industry">Industry</FieldLabel>
                <FieldDescription>
                  Used to recommend starter templates and connectors.
                </FieldDescription>
                <Select
                  value={draft.industry}
                  onValueChange={(value) => updateField("industry", value)}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </Section>

          <Section
            title="Notifications"
            description="Control how members are alerted about workspace activity."
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Email frequency</FieldLabel>
                <RadioGroup
                  value={draft.emailFrequency}
                  onValueChange={(value) => {
                    if (isEmailFrequency(value)) {
                      updateField("emailFrequency", value);
                    }
                  }}
                  className="gap-3"
                >
                  {EMAIL_FREQUENCIES.map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-2">
                      <RadioGroupItem value={value} id={`freq-${value}`} />
                      <Label htmlFor={`freq-${value}`} className="font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="email-digest">
                    Include unread mentions in the digest
                  </FieldLabel>
                  <FieldDescription>
                    Adds a section listing direct mentions you have not read.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="email-digest"
                  checked={draft.emailDigest}
                  onCheckedChange={(checked) =>
                    updateField("emailDigest", checked)
                  }
                />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="browser-push">
                    Browser push notifications
                  </FieldLabel>
                  <FieldDescription>
                    Show desktop notifications when this tab is in the
                    background.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="browser-push"
                  checked={draft.browserPush}
                  onCheckedChange={(checked) =>
                    updateField("browserPush", checked)
                  }
                />
              </Field>
            </FieldGroup>
          </Section>

          <Section
            title="Regional"
            description="Defaults applied to dates, times, and translatable strings."
          >
            <FieldGroup>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="language">Language</FieldLabel>
                  <Select
                    value={draft.language}
                    onValueChange={(value) => updateField("language", value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                  <Select
                    value={draft.timezone}
                    onValueChange={(value) => updateField("timezone", value)}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="date-format">Date format</FieldLabel>
                <Select
                  value={draft.dateFormat}
                  onValueChange={(value) => updateField("dateFormat", value)}
                >
                  <SelectTrigger id="date-format" className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </Section>

          <Section
            title="Privacy & security"
            description="Who can find this workspace and how they sign in."
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Workspace visibility</FieldLabel>
                <RadioGroup
                  value={draft.visibility}
                  onValueChange={(value) => {
                    if (isVisibility(value)) updateField("visibility", value);
                  }}
                  className="gap-3"
                >
                  {VISIBILITIES.map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-2">
                      <RadioGroupItem value={value} id={`vis-${value}`} />
                      <Label htmlFor={`vis-${value}`} className="font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="require-2fa">
                    Require two-factor authentication
                  </FieldLabel>
                  <FieldDescription>
                    Members without 2FA will be prompted to enroll on next
                    sign-in.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="require-2fa"
                  checked={draft.require2fa}
                  onCheckedChange={(checked) =>
                    updateField("require2fa", checked)
                  }
                />
              </Field>
            </FieldGroup>
          </Section>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              Reset to defaults
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
