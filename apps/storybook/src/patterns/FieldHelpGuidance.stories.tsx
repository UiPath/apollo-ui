import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField, FormFieldDescription, FormFieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  title: 'Apollo Wind/Forms/Guidance Field Help',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function InlineDescriptionExample() {
  return (
    <FormField>
      <FormFieldLabel htmlFor="workspace-slug">Workspace URL</FormFieldLabel>
      <Input
        id="workspace-slug"
        aria-describedby="workspace-slug-description"
        placeholder="team-name"
      />
      <FormFieldDescription id="workspace-slug-description">
        Use lowercase letters, numbers, and hyphens. You cannot change this later.
      </FormFieldDescription>
    </FormField>
  );
}

function TooltipHelpExample({ idSuffix }: { idSuffix: string }) {
  const inputId = `retention-period-${idSuffix}`;
  return (
    <FormField>
      <FormFieldLabel
        htmlFor={inputId}
        tooltip="How long completed jobs remain available before they are permanently deleted."
        tooltipAriaLabel="Help for retention period"
      >
        Retention period
      </FormFieldLabel>
      <Input id={inputId} inputMode="numeric" placeholder="30 days" />
    </FormField>
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
            <FormField>
              <FormFieldLabel htmlFor="whole-control-example">Retention period</FormFieldLabel>
              <div className="rounded-md border border-dashed border-destructive/60 p-1">
                <Input id="whole-control-example" placeholder="30 days" />
              </div>
            </FormField>
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
          <GuidanceItem>Hide the decorative icon from assistive technology.</GuidanceItem>
        </GuidanceList>
      </section>

      <Divider />

      <section>
        <SectionTitle>The components</SectionTitle>
        <SectionDescription>
          Help is a field-level pattern rather than an Input feature, so it lives in the field
          anatomy and applies the same way to inputs, selects, text areas, checkboxes, radio groups,
          and every other control.
        </SectionDescription>
        <div className="space-y-4">
          <GuidanceList>
            <GuidanceItem>
              <InlineCode>FormFieldLabel</InlineCode> and <InlineCode>FormFieldHeader</InlineCode>{' '}
              take <InlineCode>tooltip</InlineCode>, and render the help button beside the native{' '}
              <InlineCode>&lt;label&gt;</InlineCode>, never inside it, where it would conflict with
              activating the control. Name it with <InlineCode>tooltipAriaLabel</InlineCode>.
            </GuidanceItem>
            <GuidanceItem>
              <InlineCode>FormFieldDescription</InlineCode> renders the persistent text below the
              control. Give it an id and point the control at it with{' '}
              <InlineCode>aria-describedby</InlineCode>.
            </GuidanceItem>
            <GuidanceItem>
              In a MetadataForm, a field&rsquo;s <InlineCode>tooltip</InlineCode> and{' '}
              <InlineCode>description</InlineCode> render both.
            </GuidanceItem>
          </GuidanceList>
          <CodeBlock>{`<FormField>
  <FormFieldLabel
    htmlFor="retention"
    tooltip="How long completed jobs remain available."
    tooltipAriaLabel="Help for retention period"
  >
    Retention period
  </FormFieldLabel>
  <Input id="retention" aria-describedby="retention-description" />
  <FormFieldDescription id="retention-description">
    Jobs older than this are permanently deleted.
  </FormFieldDescription>
</FormField>

// In a MetadataForm schema
{
  name: 'retention',
  type: 'number',
  label: 'Retention period',
  tooltip: 'How long completed jobs remain available.',
  description: 'Jobs older than this are permanently deleted.',
}`}</CodeBlock>
          <p className="text-sm leading-6 text-muted-foreground">
            The rest of the field is on the Field Anatomy Guidance page. Before adding help copy for
            a new field, check the Field Type Guidance page for the field type to use.
          </p>
        </div>
      </section>
    </GuidancePage>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => (
    <TooltipProvider delayDuration={300}>
      <FieldHelpGuidancePage globalTheme={globals.theme || 'future-dark'} />
    </TooltipProvider>
  ),
};

export const Example: Story = {
  name: 'Example',
  decorators: [withCanvasProviders({ fullscreen: false })],
  render: () => <FullWorkbenchComposition rightPanelVariant="field-help" />,
};
