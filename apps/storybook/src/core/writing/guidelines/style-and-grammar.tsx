import {
  DoDont,
  GuidelineLink,
  GuideTable,
  Note,
  RuleList,
  Section,
  SubSection,
  WritingPage,
  WritingTab,
  WritingTabs,
} from '../writing-ui';

export function StyleAndGrammarPage() {
  return (
    <WritingPage
      title="Style and grammar"
      intro="The mechanics of UiPath UI copy: capitalization, punctuation, numbers, and emphasis."
    >
      <WritingTabs>
        <WritingTab label="Capitalization">
          <Section title="Labels">
            <RuleList
              rules={[
                'Keep labels short, with no punctuation at the end.',
                'Be clear, concise, and specific.',
              ]}
            />
          </Section>

          <Section
            title="Capitalization"
            intro="Use sentence case everywhere: headings, titles, buttons, navigation, and labels. Capitalize only the first word."
          >
            <GuideTable
              columns={['Capitalize', "Don't capitalize"]}
              rows={[
                [
                  'Proper names, branded standalone products, licensed or branded features, and the first word of a sentence',
                  'Feature names (automation template, test case, job monitoring), non-branded subfeatures, and product-specific features',
                ],
              ]}
            />
            <DoDont doItems={['Create test case']} dontItems={['Create Test Case']} />
            <Note>
              Sentence case is easier to read (especially for labels longer than three words), takes
              less space than title case, localizes more easily, and is simpler to apply
              consistently.
            </Note>
          </Section>
        </WritingTab>
        <WritingTab label="Language">
          <Section
            title="Abbreviations and acronyms"
            intro="Use them only when they are common and understood worldwide. When you can, spell things out."
          >
            <RuleList
              rules={[
                'The first time you use one, spell it out with the short form in parentheses: "software as a service (SaaS)."',
                'Well-known terms like FAQ, URL, JSON, and MP3 can stand on their own.',
              ]}
            />
            <GuideTable
              columns={['Type', 'What it is', 'Example']}
              rows={[
                ['Abbreviation', 'A shortened word, with a period', 'addl.'],
                ['Acronym', 'Letters pronounced as a word', 'HIPAA'],
                ['Initialism', 'Letters pronounced one by one', 'FAQ'],
              ]}
            />
          </Section>

          <Section title="Contractions" intro="Common contractions make copy sound natural.">
            <DoDont
              doItems={["Can't, don't, isn't, it's, let's, we're, won't, you'll, you're"]}
              dontItems={["Ain't, y'all, 'twas", 'Do not, cannot (too formal)']}
            />
            <Note>
              In error messages, use contractions sparingly to keep the tone calm and neutral.
            </Note>
          </Section>

          <Section title="Numbers">
            <RuleList
              rules={[
                'Use numerals instead of words: "Select up to 3 items," "Data is stored for 48 hours."',
                'Use numerals for all numbers up to a billion, even at the start of a sentence.',
                'For large numbers, combine numerals and words: "7 million."',
              ]}
            />
            <p>
              For dates and times, see <GuidelineLink story="Date and Time" />.
            </p>
          </Section>
        </WritingTab>
        <WritingTab label="Emphasis">
          <Section title="Emphasis" intro="Use only one kind of emphasis at a time.">
            <GuideTable
              columns={['Kind', 'When to use it']}
              rows={[
                [
                  'Bold',
                  'Only for the names of interactive elements in instructions. Never for locations such as column headers.',
                ],
                ['Italics', 'Extra information, such as helper text or clarifications.'],
                ['Underline', 'Links only. Never for emphasis.'],
                [
                  'Quotation marks',
                  "Single quotes for things people entered in the UI, such as 'Q3 report.xlsx'. Double quotes for quoting external statements. Never for emphasis.",
                ],
                [
                  'Color',
                  'Only for urgency or status, and always paired with another cue such as an icon or bold text. This is the only case where two kinds of emphasis combine.',
                ],
                [
                  'Icons',
                  'Sparingly, to reinforce key actions or statuses. Never use emojis in UI.',
                ],
                [
                  'De-emphasis',
                  'Lighter color, smaller text, or lower contrast for low-priority content.',
                ],
              ]}
            />
          </Section>
        </WritingTab>
        <WritingTab label="Punctuation">
          <Section title="Punctuation">
            <SubSection title="Commas">
              <RuleList
                rules={[
                  'Use the serial (Oxford) comma in lists of three or more.',
                  'Put a comma before "then."',
                  'Use a comma in a full date (December 12, 2023), but not with month and year or month and day only.',
                ]}
              />
            </SubSection>
            <SubSection title="Hyphens and dashes">
              <RuleList
                rules={[
                  'Hyphens (-) join words that modify a noun: "sign-in instructions." Don\'t hyphenate the verb: "sign in."',
                  'En dashes (–) show ranges of time, years, or amounts: "2–4 words."',
                  'Em dashes (—) mark an interruption in a sentence. Use them rarely in UI.',
                ]}
              />
            </SubSection>
            <SubSection title="Ellipses">
              <p>
                Use an ellipsis (...) only for truncated or overflowing text, loading actions, or
                omissions in a quote. Never truncate headings, navigation or button labels, error
                messages, unique identifiers, form labels, or other essential text.
              </p>
            </SubSection>
            <SubSection title="Exclamation points">
              <p>
                Avoid them. In UI they read as shouting. Greetings are the only exception ("Hi,
                Daniel!"), and even then, use at most one per screen and never for negative
                messages.
              </p>
              <DoDont
                doItems={['Hi, Daniel!', 'Project created']}
                dontItems={['Oops!', 'Wow!', 'Project created!!!']}
              />
            </SubSection>
            <SubSection title="Periods">
              <GuideTable
                columns={['Use a period', 'Leave it off']}
                rows={[
                  [
                    'Complete sentences in body text, descriptions, and subtitles. Modals with full sentences. Sentences followed by a link or code. Helper text under form fields.',
                    'Sentence fragments, headings, titles, labels, buttons, banners with fragments, bulleted fragments, placeholder text, navigation items, tooltips (unless they have several sentences), and radio or checkbox labels.',
                  ],
                ]}
              />
            </SubSection>
          </Section>
        </WritingTab>
      </WritingTabs>
    </WritingPage>
  );
}
