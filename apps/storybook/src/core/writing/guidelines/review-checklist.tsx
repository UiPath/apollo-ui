import { GuidelineLink, GuideTable, RuleList, Section, WritingPage } from '../writing-ui';

export function ReviewChecklistPage() {
  return (
    <WritingPage
      title="Review checklist"
      intro="Run through this list before you ship UI copy, or when reviewing someone else's."
    >
      <Section title="Checklist">
        <GuideTable
          columns={['Check', 'What to look for', 'Details']}
          rows={[
            [
              'Capitalization',
              'Sentence case throughout. Only proper nouns and branded products are capitalized.',
              <GuidelineLink key="c" story="Style and Grammar" />,
            ],
            [
              'Language',
              'Common contractions, numbers as numerals, no unnecessary abbreviations.',
              <GuidelineLink key="l" story="Style and Grammar" />,
            ],
            [
              'Punctuation',
              'Oxford commas, periods only after full sentences, no exclamation points except in greetings.',
              <GuidelineLink key="p" story="Style and Grammar" />,
            ],
            [
              'Buttons and links',
              'Buttons are 2–4 words. No "Learn more" or "Click here." Link text describes the destination.',
              <GuidelineLink key="b" story="Components" />,
            ],
            [
              'Empty states',
              'A clear headline, helpful guidance, and a fitting call to action.',
              <GuidelineLink key="e" story="Components" />,
            ],
            [
              'Emphasis',
              'One kind at a time. Underlines only for links. Bold only for interactive elements.',
              <GuidelineLink key="em" story="Style and Grammar" />,
            ],
            [
              'Icons',
              'Used sparingly, with text labels. Not in buttons, except spinners and chevrons. Accessible.',
              <GuidelineLink key="i" story="Style and Grammar" />,
            ],
            [
              'Inclusive writing',
              'Gender-neutral language, no assumptions about people, person-first where it fits, and no "simple" or "easy" for tasks.',
              <GuidelineLink key="in" story="Principles" />,
            ],
            [
              'Localization',
              'No idioms or compound nouns, consistent terms, short sentences, clear pronouns, no cultural references.',
              <GuidelineLink key="lo" story="Principles" />,
            ],
            [
              'Terminology',
              'Run, Build, Create, Add, Select, and other platform terms used correctly.',
              <GuidelineLink key="t" story="Terminology" />,
            ],
          ]}
        />
      </Section>

      <Section title="Tips">
        <RuleList
          rules={[
            'Apply the rules the same way everywhere.',
            'When in doubt, pick the simpler option.',
            'Clarity for the reader matters more than following a rule to the letter.',
            'Check the terminology list for platform-specific words.',
            'Stay conversational while staying clear.',
          ]}
        />
      </Section>
    </WritingPage>
  );
}
