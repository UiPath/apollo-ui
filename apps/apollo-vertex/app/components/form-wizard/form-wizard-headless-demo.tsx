"use client";

import { formOptions } from "@tanstack/react-form";
import { type ReactNode, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { withForm } from "@/components/ui/form";
import {
  FormWizard,
  FormWizardStep,
  useFormWizard,
  useFormWizardContext,
  type WizardStepDef,
} from "@/components/ui/form-wizard";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const workspaceSchema = z.object({
  name: z.string().min(2, "Enter a workspace name."),
  region: z.string().min(1, "Select a region."),
});
const inviteSchema = z.object({ emails: z.string() });

const schema = z.object({ workspace: workspaceSchema, invite: inviteSchema });
type Values = z.infer<typeof schema>;

const defaultValues = {
  workspace: { name: "", region: "" },
  invite: { emails: "" },
};
const opts = formOptions({ defaultValues });

const regionOptions = [
  { label: "Europe", value: "eu" },
  { label: "United States", value: "us" },
  { label: "Asia Pacific", value: "apac" },
];

const steps: WizardStepDef<Values>[] = [
  { id: "workspace", title: "Workspace" },
  { id: "invite", title: "Invite" },
];

function CustomHeader() {
  const { stepIndex, stepCount, currentStep, progress } =
    useFormWizardContext();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{currentStep?.title}</span>
        <span className="text-muted-foreground">
          Step {stepIndex + 1} of {stepCount}
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function StepChrome({ children }: { children: ReactNode }) {
  const { isFirst, isLast, back } = useFormWizardContext();
  return (
    <FieldGroup>
      {children}
      <div className="flex justify-end gap-2">
        {isFirst ? null : (
          <Button type="button" variant="ghost" onClick={back}>
            Back
          </Button>
        )}
        <Button type="submit">
          {isLast ? "Create workspace" : "Continue"}
        </Button>
      </div>
    </FieldGroup>
  );
}

const WorkspaceStep = withForm({
  ...opts,
  render: function Render({ form }) {
    const { next } = useFormWizardContext();
    return (
      <form.FormGroup
        name="workspace"
        validators={{ onDynamic: workspaceSchema }}
        onGroupSubmit={() => next()}
      >
        {(group) => (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void group.handleSubmit();
            }}
          >
            <StepChrome>
              <form.AppField name="workspace.name">
                {(field) => (
                  <field.TextField
                    label="Workspace name"
                    placeholder="Acme Inc."
                  />
                )}
              </form.AppField>
              <form.AppField name="workspace.region">
                {(field) => (
                  <field.SelectField
                    label="Region"
                    placeholder="Select a region"
                    options={regionOptions}
                  />
                )}
              </form.AppField>
            </StepChrome>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

const InviteStep = withForm({
  ...opts,
  render: function Render({ form }) {
    const { next } = useFormWizardContext();
    return (
      <form.FormGroup
        name="invite"
        validators={{ onDynamic: inviteSchema }}
        onGroupSubmit={() => next()}
      >
        {(group) => (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void group.handleSubmit();
            }}
          >
            <StepChrome>
              <form.AppField name="invite.emails">
                {(field) => (
                  <field.TextField
                    label="Invite teammates"
                    placeholder="name@example.com"
                    description="Optional. You can do this later."
                  />
                )}
              </form.AppField>
            </StepChrome>
          </form>
        )}
      </form.FormGroup>
    );
  },
});

export function FormWizardHeadlessDemo() {
  const [submitted, setSubmitted] = useState<Values | null>(null);

  const wizard = useFormWizard<Values>({
    formOptions: opts,
    schema,
    steps,
    onSubmit: (values) => setSubmitted(values),
  });

  return (
    <LocaleProvider>
      <FormWizard wizard={wizard} className="gap-6">
        <CustomHeader />
        <FormWizardStep stepId="workspace">
          <WorkspaceStep form={wizard.form} />
        </FormWizardStep>
        <FormWizardStep stepId="invite">
          <InviteStep form={wizard.form} />
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
