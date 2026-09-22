import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleHelp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FullWorkbenchComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { withCanvasProviders } from '../../../../packages/apollo-react/src/canvas/storybook-utils';
import {
  CodeBlock,
  Divider,
  ExampleCard,
  GuidanceItem,
  GuidanceList,
  GuidancePage,
  InfoCallout,
  InlineCode,
  PatternCard,
  SectionDescription,
  SectionTitle,
} from './guidance-primitives';

const meta = {
  title: 'Apollo Wind/Forms/Field Help Guidance',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function HelpTrigger({ fieldName }: { fieldName: string }) {
  return (
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={`Help for ${fieldName}`}
        className="inline-flex size-5 cursor-help items-center justify-center rounded-sm text-muted-foreground ring-offset-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <CircleHelp aria-hidden="true" className="size-3.5" />
      </button>
    </TooltipTrigger>
  );
}

function InlineDescriptionExample() {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="workspace-slug">Workspace URL</Label>
      <Input
        id="workspace-slug"
        aria-describedby="workspace-slug-description"
        placeholder="team-name"
      />
      <p id="workspace-slug-description" className="mt-1 text-xs leading-4 text-muted-foreground">
        Use lowercase letters, numbers, and hyphens. You cannot change this later.
      </p>
    </div>
  );
}

function TooltipHelpExample({ idSuffix }: { idSuffix: string }) {
  const inputId = `retention-period-${idSuffix}`;
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid gap-1.5">
        <div className="flex items-center gap-1">
          <Label htmlFor={inputId}>Retention period</Label>
          <Tooltip>
            <HelpTrigger fieldName="retention period" />
            <TooltipContent side="top" className="max-w-64">
              How long completed jobs remain available before they are permanently deleted.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input id={inputId} inputMode="numeric" placeholder="30 days" />
      </div>
    </TooltipProvider>
  );
}

function FieldHelpGuidancePage({ globalTheme }: { globalTheme: string }) {
  return (
    <GuidancePage
      globalTheme={globalTheme}
      title="Field Help Guidance"
      intro="Help people understand what a field expects and why the information is needed. Choose inline descriptions or tooltip help according to how important that information is to completing the task. For what to show when a value is wrong, see the Field Validation Guidance page."
    >
      <Divider />

      <section>
        <SectionTitle>Choose the right pattern</SectionTitle>
        <SectionDescription>
          If someone needs the information to complete the field correctly, keep it visible. Reserve
          tooltip help for optional context.
        </SectionDescription>

        <div className="grid gap-5 md:grid-cols-2">
          <PatternCard
            eyebrow="Persistent"
            title="Inline description"
            description="Use for requirements, constraints, consequences, or unfamiliar terms that are important to completing the field."
          >
            <InlineDescriptionExample />
          </PatternCard>
          <PatternCard
            eyebrow="On demand"
            title="Tooltip help"
            description="Use for supplementary context that most people can complete the field without."
          >
            <TooltipHelpExample idSuffix="pattern-card" />
          </PatternCard>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Inline descriptions</SectionTitle>
        <SectionDescription>
          Place persistent guidance below the field control so it remains available while someone
          enters or reviews a value.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>Explain the required format or constraints for a valid value.</GuidanceItem>
          <GuidanceItem>Describe consequences that may affect someone’s decision.</GuidanceItem>
          <GuidanceItem>Clarify unfamiliar terminology needed by most people.</GuidanceItem>
          <GuidanceItem>
            Connect the description to the control with <InlineCode>aria-describedby</InlineCode>.
          </GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <InfoCallout>
            Do not put validation errors, required instructions, or critical consequences only in a
            tooltip. Essential information must remain visible.
          </InfoCallout>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Tooltip triggers</SectionTitle>
        <SectionDescription>
          Place a dedicated help icon immediately after the field label. The icon is the tooltip
          trigger, not the label or field control.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <ExampleCard
            kind="do"
            note="Use a visible, focusable help button beside the label as the explicit target."
          >
            <TooltipHelpExample idSuffix="do-example" />
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t make the input, select, label, or entire field an invisible hover target."
          >
            <div className="grid gap-1.5">
              <Label htmlFor="whole-control-example">Retention period</Label>
              <div className="rounded-md border border-dashed border-destructive/60 p-1">
                <Input id="whole-control-example" placeholder="30 days" />
              </div>
            </div>
          </ExampleCard>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Accessibility and interaction</SectionTitle>
        <SectionDescription>
          Tooltip help must not depend on pointer hover. Everyone needs an equivalent, explicit way
          to discover and open it.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Render the trigger as a button with an accessible name such as “Help for retention
            period.”
          </GuidanceItem>
          <GuidanceItem>Open the tooltip on both pointer hover and keyboard focus.</GuidanceItem>
          <GuidanceItem>
            Close it when hover or focus leaves, and allow <InlineCode>Escape</InlineCode> to close
            it.
          </GuidanceItem>
          <GuidanceItem>Support activation on touch devices that do not have hover.</GuidanceItem>
          <GuidanceItem>Keep the help trigger available when the field is disabled.</GuidanceItem>
          <GuidanceItem>
            Hide the decorative question-mark glyph from assistive technology.
          </GuidanceItem>
        </GuidanceList>
      </section>

      <Divider />

      <section>
        <SectionTitle>Recommendation</SectionTitle>
        <SectionDescription>
          Treat help as a field-level pattern rather than an Input feature. The same guidance
          applies to inputs, selects, text areas, checkboxes, radio groups, and other controls.
        </SectionDescription>
        <div className="space-y-4">
          <InfoCallout>
            Prefer a composed <InlineCode>FieldLabel</InlineCode> that renders the native label and
            a sibling help trigger. Avoid placing an interactive tooltip button inside a native{' '}
            <InlineCode>&lt;label&gt;</InlineCode>, where it can create conflicting activation
            behavior.
          </InfoCallout>
          <CodeBlock>{`<FieldLabel
  htmlFor="retention"
  helpText="How long completed jobs remain available."
>
  Retention period
</FieldLabel>`}</CodeBlock>
          <p className="text-sm leading-6 text-muted-foreground">
            Keep persistent descriptions separate as a <InlineCode>FieldDescription</InlineCode> or
            equivalent. This proposed API is a direction for review, not an implemented component.
            Confirm terminology, icon, placement, touch behavior, and component ownership with
            design before engineering implementation.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Before adding help copy for a new field, check the Field Type Guidance page to confirm
            the type is supported and see which control it renders through.
          </p>
        </div>
      </section>
    </GuidancePage>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => (
    <FieldHelpGuidancePage globalTheme={globals.theme || 'future-dark'} />
  ),
};

export const Example: Story = {
  name: 'Example',
  decorators: [withCanvasProviders({ fullscreen: false })],
  render: () => <FullWorkbenchComposition rightPanelVariant="field-help" />,
};
