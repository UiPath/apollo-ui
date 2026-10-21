import type { ReactNode } from 'react';
import {
  CopyExample,
  DoDont,
  GuideTable,
  PatternLink,
  RuleList,
  Section,
  SubSection,
  WritingPage,
  WritingTab,
  WritingTabs,
} from '../writing-ui';

function SeePattern({ story }: { story: string }) {
  return (
    <p>
      More detail: <PatternLink story={story} /> pattern.
    </p>
  );
}

function Component({
  title,
  pattern,
  children,
}: {
  title: string;
  pattern?: string;
  children: ReactNode;
}) {
  return (
    <SubSection title={title}>
      {children}
      {pattern && <SeePattern story={pattern} />}
    </SubSection>
  );
}

export function ComponentsPage() {
  return (
    <WritingPage
      title="Writing for components"
      intro="Quick guidance for the copy in each Apollo component. The content patterns go deeper, with examples for common cases."
    >
      <WritingTabs>
        <WritingTab label="Dialogs and panels">
          <Section title="Dialogs and panels">
            <Component title="Modal" pattern="Destructive Modal">
              <p>Modals interrupt the flow, so keep them focused and actionable.</p>
              <RuleList
                rules={[
                  'Title: direct and descriptive.',
                  'Body: concise. Break longer text into short paragraphs or bullets, and include only what people need to act.',
                  'Buttons: primary on the right, secondary (if needed) to its left.',
                ]}
              />
              <CopyExample
                caption="Delete confirmation"
                fields={[
                  ['Title', 'Delete this automation?'],
                  [
                    'Body',
                    "This will permanently delete the automation and all associated logs. You can't undo this action.",
                  ],
                  ['Buttons', 'Cancel, Delete'],
                ]}
              />
            </Component>
            <Component title="Drawer" pattern="Drawer">
              <p>Drawers hold extra content that doesn't need a full change of context.</p>
              <RuleList
                rules={[
                  'Header: state the purpose of the panel, such as "Edit project settings."',
                  'Sections: use labeled groups so people can skim.',
                  'Body: rely on form labels and helper text, and skip repeated instructions.',
                  'Buttons: one primary action, usually Save or Apply, plus Cancel or Discard when needed.',
                ]}
              />
            </Component>
          </Section>
        </WritingTab>
        <WritingTab label="Errors">
          <Section
            title="Error messages"
            intro="Errors should guide people to a fix without blame or friction."
          >
            <SubSection title="Tone">
              <RuleList
                rules={[
                  'Stay neutral and calm.',
                  'Avoid blame, such as "You forgot..." or "You must..."',
                  'Avoid drama, such as "Oops!" or "Something went terribly wrong!"',
                  'Use contractions sparingly.',
                ]}
              />
            </SubSection>
            <SubSection title="Structure">
              <ol>
                <li>
                  <strong>What happened.</strong> Describe the issue in terms people understand.
                </li>
                <li>
                  <strong>Why it matters</strong> (optional). Add context only if it helps them fix
                  it.
                </li>
                <li>
                  <strong>What to do next.</strong> Give a clear recovery action.
                </li>
              </ol>
              <DoDont
                doItems={[
                  "We couldn't save your changes.",
                  'Check your connection and try again.',
                  "You don't have permission to edit.",
                  'Try again in a few seconds.',
                ]}
                dontItems={[
                  'Oops! Something went wrong.',
                  'Uh-oh! We hit a snag.',
                  "You can't do this.",
                  'Please try again later (code: 4592).',
                  'You did something wrong. Try again.',
                ]}
              />
            </SubSection>
            <SubSection title='"We" and "you"'>
              <p>
                Use <strong>"we"</strong> when the system is the actor, especially when something
                fails. The product takes responsibility instead of implying the person caused the
                problem. Use <strong>"you"</strong> or <strong>"your"</strong> for things that
                belong to the person or that they made, but avoid "you" as the subject of an error.
              </p>
              <GuideTable
                columns={['Situation', 'Use', 'Example']}
                rows={[
                  ['The system failed to finish an action', 'we', "We couldn't save your changes."],
                  [
                    "Referring to the person's content",
                    'your',
                    'Your changes have been committed.',
                  ],
                  [
                    'Describing what the person did, positively',
                    'you',
                    'You built a new automation.',
                  ],
                ]}
              />
              <DoDont
                doItems={["We couldn't save your changes.", "We weren't able to find that page."]}
                dontItems={[
                  "Your changes couldn't be saved. (Passive, hides who failed.)",
                  'You caused an error. (Accusatory.)',
                ]}
              />
            </SubSection>
            <SubSection title="When not to show an error">
              <RuleList
                rules={[
                  "Don't show errors for known or expected states, like a search with no results.",
                  'Show errors inline when you can, next to the field instead of at the top of the page.',
                  "Don't repeat the same error in several places, such as a notification, a modal, and a tooltip.",
                ]}
              />
            </SubSection>
            <SeePattern story="Error Message" />
          </Section>
        </WritingTab>
        <WritingTab label="Search and filters">
          <Section title="Search and filters">
            <Component title="Search field" pattern="Search and Filter">
              <p>
                Use a specific placeholder that says what can be searched. Don't rely on the
                placeholder for essential instructions; add a label and helper text as needed.
              </p>
              <DoDont
                doItems={['Search by name or keyword', 'Search projects or automations']}
                dontItems={['Search...']}
              />
            </Component>
            <Component title="Filter labels">
              <p>Use nouns, not verbs, and keep each label unique.</p>
            </Component>
            <Component title="Clearing filters">
              <DoDont
                doItems={['Clear all filters', 'Reset filters']}
                dontItems={['Cancel', 'X']}
              />
              <p>
                When filters return nothing, explain why: "No results match your filters. Try
                adjusting or clearing your filters."
              </p>
            </Component>
          </Section>
        </WritingTab>
        <WritingTab label="Navigation">
          <Section title="Structure and navigation">
            <Component title="Page headings" pattern="Tabs and Navigation">
              <p>
                Use nouns that describe what the section is, not actions that tell people what to
                do. Noun headings scan better and are easier to reuse. Modal titles are the
                exception: they can start with a verb.
              </p>
              <DoDont
                doItems={['Process overview', 'Configuration details', 'Output parameters']}
                dontItems={['Learn about processes', 'Configure the settings', 'View output']}
              />
            </Component>
            <Component title="Tabs" pattern="Tabs and Navigation">
              <RuleList
                rules={[
                  'Order tabs by relevance. The first tab should be the most logical starting view.',
                  'Keep tabs with related content next to each other.',
                  'Make each label a clear, short description of the content.',
                ]}
              />
            </Component>
            <Component title="Accordions" pattern="Accordion and Disclosure">
              <p>Use clear, neutral triggers.</p>
              <DoDont
                doItems={['Show advanced settings', 'View details', 'Expand task history']}
                dontItems={['Sneak peek', 'Unlock more']}
              />
            </Component>
            <Component title="Lists">
              <p>Start each list item with a capital letter, and keep items consistent.</p>
            </Component>
          </Section>
        </WritingTab>
        <WritingTab label="Actions and inputs">
          <Section title="Actions">
            <Component title="Button" pattern="Button and CTA">
              <RuleList
                rules={[
                  'Use a clear verb, plus a noun when it helps. Keep it to 2–4 words.',
                  'Avoid "Click here" or "Go to...". Name the action, such as "Manage in..."',
                ]}
              />
            </Component>
            <Component title="Link" pattern="Link">
              <RuleList
                rules={[
                  'Make every link unique and descriptive. Avoid "Learn more" and "Click here."',
                  'Leave the word "link" out. Screen readers already announce it.',
                  'Use the same text for links to the same destination on different pages.',
                ]}
              />
            </Component>
          </Section>

          <Section title="Inputs and selection">
            <Component title="Text input" pattern="Form Field">
              <RuleList
                rules={[
                  'Put the label above the field, with no punctuation. Never use a placeholder instead of a label.',
                  'Use placeholder text only as an extra hint or example, such as "Search automations by keyword." Leave off the period, and keep essential information out of it.',
                  'Use helper text below the field for examples, syntax, character counts, or completion info. Two sentences at most.',
                ]}
              />
            </Component>
            <Component title="Checkbox">
              <p>Keep labels short and descriptive.</p>
            </Component>
            <Component title="Dropdown" pattern="Toggle and Selection">
              <RuleList
                rules={[
                  'Make the purpose of the dropdown obvious from its label.',
                  "Keep option names short and unique, and don't start two options with the same word. It's confusing when scanning or using a screen reader.",
                ]}
              />
            </Component>
            <Component title="Toggle switch" pattern="Toggle and Selection">
              <RuleList
                rules={[
                  'Always give the switch a label or clear surrounding context.',
                  "Say exactly what it turns on or off, and don't phrase the label as a question.",
                  "Don't change the label when the state changes.",
                  'Put extra context in text outside the label.',
                ]}
              />
            </Component>
            <Component title="People picker">
              <p>Add helper text when specific input requirements matter for finishing the task.</p>
            </Component>
          </Section>
        </WritingTab>
        <WritingTab label="Status">
          <Section title="Status and feedback">
            <Component title="Badge" pattern="Table and Status">
              <p>One or two words, with no wrapping.</p>
            </Component>
            <Component title="Tooltip" pattern="Tooltip">
              <RuleList
                rules={[
                  'Use sparingly, for short, nonessential, plain-text context. Never for critical information, errors, long text, images, or interactive content.',
                  'Keep it to about 2 lines. Icon button tooltips: one or two words.',
                  "Don't repeat the copy of the element it belongs to.",
                  'Good uses: showing truncated content in full, or light inline guidance. Put essential information in helper text.',
                ]}
              />
            </Component>
            <Component title="Page loader">
              <p>Use a short, clear label that says what is loading, without jargon.</p>
            </Component>
            <Component title="Empty states" pattern="Empty State">
              <RuleList
                rules={[
                  'A clear headline',
                  'Helpful, actionable guidance',
                  'A fitting call to action',
                ]}
              />
            </Component>
          </Section>
        </WritingTab>
      </WritingTabs>
    </WritingPage>
  );
}
