import {
  DoDont,
  GuidelineLink,
  GuideTable,
  Note,
  RuleList,
  Section,
  SubSection,
  WritingPage,
} from '../writing-ui';

export function LocalizationPage() {
  return (
    <WritingPage
      title="Localization"
      intro="UiPath products ship in many languages. These rules keep strings translatable once they leave English, and they matter as much to the engineers wiring up strings as to the people writing them."
    >
      <Section title="Plan for longer text">
        <RuleList
          rules={[
            'Expect translated text to grow by 20–30%, and much more for short labels. A 1-word English button can double in German or Finnish.',
            'Let labels wrap instead of truncating them. Never truncate headings, buttons, navigation, or error messages.',
            "Don't size buttons, badges, or tabs to fit the English text exactly.",
          ]}
        />
      </Section>

      <Section
        title="Keep sentences whole"
        intro="Word order changes between languages, so a sentence built from separate pieces can't be translated correctly."
      >
        <RuleList
          rules={[
            'Write each message as one complete string, with placeholders for the parts that change.',
            "Don't join strings in code to build a sentence, or reuse half of one message in another.",
            "Don't split a sentence around a link or bold word. Keep it in a single message with markup inside.",
          ]}
        />
        <DoDont
          doItems={['"{name} was added to {project}" as one message']}
          dontItems={['"was added to" + project, joined in code', '"Delete" + " " + objectName']}
        />
      </Section>

      <Section title="Placeholders and variables">
        <RuleList
          rules={[
            'Give each placeholder a descriptive name, such as {fileName}, not {0}.',
            'Add a translator note that says what the placeholder holds and where the text appears.',
            'Avoid sentences whose grammar depends on the value, like gender or case endings. Rephrase so the variable stands on its own: "Owner: {name}."',
            "Don't put a placeholder at the very start of a sentence if the value could be lowercase.",
          ]}
        />
        <Note>
          In apollo-react, messages use Lingui. A translator note is the <code>comment</code> field
          on a message descriptor.
        </Note>
      </Section>

      <Section
        title="Plurals"
        intro="Languages have different numbers of plural forms. English has 2; Arabic has 6."
      >
        <RuleList
          rules={[
            "Use your i18n library's plural support (Lingui's plural, or ICU message syntax) instead of an if statement on the count.",
            'Write every form the message needs, including zero when the copy changes.',
            'Never write "(s)" to cover both forms.',
          ]}
        />
        <DoDont
          doItems={['1 item', '3 items', 'No items']}
          dontItems={['3 item(s)', '1 items', '0 item']}
        />
      </Section>

      <Section title="Dates, times, and numbers">
        <RuleList
          rules={[
            'Format dates, times, numbers, and currency with locale-aware tools (Intl in JavaScript), not by hand.',
            "Don't hard-code separators. 1,000.5 in English is 1.000,5 in German.",
            "Show times in the viewer's time zone and name the zone when it matters.",
          ]}
        />
        <p>
          English formats are on the <GuidelineLink story="Date and Time" /> page.
        </p>
      </Section>

      <Section title="Words and layout">
        <SubSection title="Wording">
          <RuleList
            rules={[
              'Write literal, plain English: no idioms, slang, or cultural references.',
              'Use one word per concept, everywhere.',
              'Avoid abbreviations. Translators may not know what they stand for.',
              "Don't rely on capitalization, puns, or rhymes for meaning. They don't survive translation.",
            ]}
          />
          <p>
            More on this in{' '}
            <GuidelineLink story="Principles">writing for translation</GuidelineLink>.
          </p>
        </SubSection>
        <SubSection title="Layout and direction">
          <RuleList
            rules={[
              'Layouts mirror in right-to-left languages, so avoid directional words such as "the button on the right." Name the element instead.',
              "Don't put text inside images. It can't be translated or read by screen readers.",
            ]}
          />
        </SubSection>
      </Section>

      <Section title="Give translators context">
        <GuideTable
          columns={['String', 'Without context', 'With a translator note']}
          rows={[
            ['Run', 'Verb or noun?', 'Button that starts the automation now'],
            ['Open', 'An action or a status?', 'Status badge for a job that has not finished'],
            ['{count} jobs', 'What is counted?', 'Number of jobs that ran today, shown in a card'],
          ]}
        />
      </Section>
    </WritingPage>
  );
}
