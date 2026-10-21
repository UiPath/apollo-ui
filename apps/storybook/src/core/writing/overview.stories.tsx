import type { Meta, StoryObj } from '@storybook/react-vite';
import { PATTERNS } from './patterns';
import {
  GuidelineLink,
  GuideTable,
  Note,
  PatternLink,
  RuleList,
  Section,
  WritingPage,
} from './writing-ui';

const meta = {
  title: 'Writing/Overview',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const GUIDELINE_TOPICS: [string, string][] = [
  ['Principles', 'Core principles, voice and tone, inclusive writing, and writing for translation'],
  [
    'Style and Grammar',
    'Capitalization, abbreviations, contractions, numbers, emphasis, and punctuation',
  ],
  ['Components', 'Quick copy guidance for each Apollo component'],
  ['Date and Time', 'Date, time, and duration formats, and relative or absolute time'],
  ['Accessibility', 'Accessible names, alt text, form errors, and status announcements'],
  ['Localization', 'Text expansion, whole sentences, placeholders, plurals, and translator notes'],
  ['Terminology', 'Platform verbs and concepts, such as Build, Create, Run, and Job'],
  ['Review Checklist', 'What to check before shipping UI copy'],
];

const PATTERN_GROUPS: [string, string[]][] = [
  [
    'Content and messaging',
    [
      'errorMessage',
      'notification',
      'successConfirmation',
      'emptyState',
      'loadingAndProgress',
      'onboarding',
      'aiAndAgents',
    ],
  ],
  ['Actions and controls', ['buttonAndCta', 'link', 'toggleAndSelection', 'destructiveModal']],
  ['Forms and inputs', ['formField', 'searchAndFilter']],
  ['Layout and navigation', ['tabsAndNavigation', 'drawer', 'accordionAndDisclosure']],
  ['Data display', ['tableAndStatus', 'tooltip', 'dateTimeAndDuration']],
];

function OverviewPage() {
  return (
    <WritingPage
      title="Writing"
      intro="How we write UI copy at UiPath: the labels, buttons, messages, and microcopy that help people get their work done."
    >
      <Section title="Guidelines" intro="The rules that apply to all UI copy. Read these first.">
        <GuideTable
          columns={['Topic', 'Covers']}
          rows={GUIDELINE_TOPICS.map(([story, covers]) => [
            <GuidelineLink key={story} story={story} />,
            covers,
          ])}
        />
      </Section>

      <Section
        title="Content patterns"
        intro="Ready-to-use guidance and examples for specific kinds of UI copy."
      >
        <GuideTable
          columns={['Group', 'Patterns']}
          rows={PATTERN_GROUPS.map(([group, keys]) => [
            group,
            <RuleList
              key={group}
              rules={keys.map((key) => (
                <>
                  <PatternLink story={PATTERNS[key].name} />: {PATTERNS[key].summary}
                </>
              ))}
            />,
          ])}
        />
      </Section>

      <Section title="Which pattern do I need?">
        <GuideTable
          columns={['If you are writing', 'Start with', 'Also check']}
          rows={[
            [
              'Error copy',
              <PatternLink key="1" story="Error Message" />,
              <PatternLink key="1b" story="Notification" />,
            ],
            [
              'Success or warning copy',
              <PatternLink key="2" story="Notification" />,
              <PatternLink key="2b" story="Success Confirmation" />,
            ],
            [
              'Copy for an AI feature or agent',
              <PatternLink key="8" story="AI and Agents" />,
              <PatternLink key="8b" story="Loading and Progress" />,
            ],
            [
              'Icon button labels or alt text',
              <GuidelineLink key="9" story="Accessibility" />,
              <PatternLink key="9b" story="Tooltip" />,
            ],
            [
              'Strings with counts or variables',
              <GuidelineLink key="10" story="Localization" />,
              <PatternLink key="10b" story="Date, Time, and Duration" />,
            ],
            [
              'Search field copy',
              <PatternLink key="3" story="Search and Filter" />,
              <PatternLink key="3b" story="Form Field" />,
            ],
            [
              'An inline validation error',
              <PatternLink key="4" story="Error Message" />,
              <PatternLink key="4b" story="Form Field" />,
            ],
            [
              'Table timestamps or durations',
              <PatternLink key="5" story="Table and Status" />,
              <PatternLink key="5b" story="Date, Time, and Duration" />,
            ],
            [
              'Form inputs in a drawer',
              <PatternLink key="6" story="Drawer" />,
              <PatternLink key="6b" story="Form Field" />,
            ],
            [
              'Buttons in a destructive modal',
              <PatternLink key="7" story="Destructive Modal" />,
              <PatternLink key="7b" story="Button and CTA" />,
            ],
          ]}
        />
      </Section>

      <Note>
        These pages are written for people. Most of the guidance is also packaged as the
        apollo-writing skill in <code>packages/apollo-wind/skills/apollo-writing</code>, for AI
        tools that write or review UI copy. Accessibility, Localization, and the AI and agents,
        loading, onboarding, and success patterns are only in Storybook for now.
      </Note>
    </WritingPage>
  );
}

export const Overview: Story = { render: () => <OverviewPage /> };
