"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const VISIBILITIES = [
  { value: "public", label: "Public — anyone with the link" },
  { value: "internal", label: "Internal — your organization" },
  { value: "private", label: "Private — invitation only" },
] as const;

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
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  return (
    <div className="relative z-10">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitle>Workspace settings</PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <Form {...form}>
        <form
          onSubmit={(e) =>
            void form.handleSubmit((data) => form.reset(data))(e)
          }
          className="px-4 sm:px-6 lg:px-8 pb-8 grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-4"
        >
          <div className="col-span-4 sm:col-span-8 lg:col-span-7">
            <Section
              title="Profile"
              description="Identifies the workspace across the platform and in invitations."
            >
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="workspaceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormDescription>
                        Shown to invited members on the workspace landing page.
                      </FormDescription>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormDescription>
                        Used to recommend starter templates and connectors.
                      </FormDescription>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDUSTRIES.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </FieldGroup>
            </Section>

            <Section
              title="Notifications"
              description="Control how members are alerted about workspace activity."
            >
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="emailFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email frequency</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="gap-3"
                        >
                          {EMAIL_FREQUENCIES.map(({ value, label }) => (
                            <div
                              key={value}
                              className="flex items-center gap-2"
                            >
                              <RadioGroupItem
                                value={value}
                                id={`freq-${value}`}
                              />
                              <Label
                                htmlFor={`freq-${value}`}
                                className="font-normal"
                              >
                                {label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emailDigest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-3">
                      <div className="space-y-1">
                        <FormLabel>
                          Include unread mentions in the digest
                        </FormLabel>
                        <FormDescription>
                          Adds a section listing direct mentions you have not
                          read.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="browserPush"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-3">
                      <div className="space-y-1">
                        <FormLabel>Browser push notifications</FormLabel>
                        <FormDescription>
                          Show desktop notifications when this tab is in the
                          background.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </FieldGroup>
            </Section>

            <Section
              title="Regional"
              description="Defaults applied to dates, times, and translatable strings."
            >
              <FieldGroup>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGES.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONES.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date format</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DATE_FORMATS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </FieldGroup>
            </Section>

            <Section
              title="Privacy & security"
              description="Who can find this workspace and how they sign in."
            >
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace visibility</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="gap-3"
                        >
                          {VISIBILITIES.map(({ value, label }) => (
                            <div
                              key={value}
                              className="flex items-center gap-2"
                            >
                              <RadioGroupItem
                                value={value}
                                id={`vis-${value}`}
                              />
                              <Label
                                htmlFor={`vis-${value}`}
                                className="font-normal"
                              >
                                {label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="require2fa"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-3">
                      <div className="space-y-1">
                        <FormLabel>Require two-factor authentication</FormLabel>
                        <FormDescription>
                          Members without 2FA will be prompted to enroll on next
                          sign-in.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
              <Button type="submit" disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
