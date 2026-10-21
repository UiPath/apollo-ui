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

export function AccessibilityPage() {
  return (
    <WritingPage
      title="Accessibility"
      intro="Many people use UiPath products with screen readers, magnifiers, voice control, or a keyboard. Copy that works for them is clearer for everyone."
    >
      <WritingTabs>
        <WritingTab label="Basics">
          <Section title="Write so anyone can follow">
            <RuleList
              rules={[
                'Use plain language and short sentences. Aim for a grade 6 reading level.',
                'Use "select" instead of "click" or "tap." It works for every input method.',
                'Don\'t rely on color, shape, size, or position alone: not "the red items" or "the button on the right." Name the thing.',
                'Avoid ALL CAPS for text. Some screen readers spell it out letter by letter.',
                "Don't use emojis in UI. Screen readers read their full names aloud.",
              ]}
            />
          </Section>
        </WritingTab>
        <WritingTab label="Names and alt text">
          <Section
            title="Icon buttons and accessible names"
            intro="Every control needs a name a screen reader can announce. Icon-only buttons need one written for them."
          >
            <RuleList
              rules={[
                'Give every icon-only button an aria-label that names the action.',
                'Match the aria-label to the tooltip, so sighted and screen reader users hear the same word.',
                'Name the action, not the icon: "Delete," not "Trash can."',
                'Add the object when several similar buttons are on screen: "Delete automation," "Edit Invoice intake."',
              ]}
            />
            <DoDont
              doItems={['aria-label="Copy"', 'aria-label="Delete automation"']}
              dontItems={['aria-label="Button"', 'aria-label="Trash icon"', 'No label at all']}
            />
          </Section>

          <Section title="Alt text for images">
            <RuleList
              rules={[
                'Describe what the image means in context, in a short phrase or sentence.',
                'Leave out "Image of" or "Picture of." Screen readers already say it is an image.',
                'Give decorative images an empty alt (alt=""), so they are skipped.',
                'For charts, summarize the key takeaway, and offer the data in a table or text nearby.',
              ]}
            />
            <DoDont
              doItems={['Jobs completed per day, rising from 40 to 120 this week']}
              dontItems={['Image of a chart', 'chart.png']}
            />
          </Section>

          <Section title="Links and buttons out of context">
            <p>
              Screen reader users often jump between links or buttons, hearing each one without the
              text around it. Every link and button should make sense on its own.
            </p>
            <DoDont
              doItems={['Review retention policy', 'Download job logs']}
              dontItems={['Learn more', 'Click here', 'Download']}
            />
            <p>
              More on this in the{' '}
              <GuidelineLink story="Components">component guidelines</GuidelineLink>.
            </p>
          </Section>
        </WritingTab>
        <WritingTab label="Forms and status">
          <Section title="Forms and errors">
            <RuleList
              rules={[
                'Always use a visible label. Placeholder text disappears and is not reliably announced.',
                'Mark required fields in the label text or with an indicator that has an accessible name, not by color alone.',
                'Connect helper text and errors to their field (aria-describedby), so they are read with it.',
                'Say how to fix the error, not only that something is wrong: "Enter a date after today."',
                'When a form has several errors, summarize them at the top and link to each field.',
              ]}
            />
          </Section>

          <Section
            title="Status announcements"
            intro="Changes that happen without a page load, such as saving, filtering, or new results, are invisible to screen reader users unless the page announces them."
          >
            <RuleList
              rules={[
                'Announce the result of an action in a short phrase: "Changes saved," "12 results."',
                'Use polite announcements for most updates, and assertive ones only for errors that block the task.',
                "Keep announcements short, and don't repeat text that is already being read.",
                'Announce when a long operation starts and when it finishes, not every step in between.',
              ]}
            />
            <Note>
              Apollo Wind's LiveRegion component announces status messages. Spinners and Thinking
              indicators take a label for the same reason.
            </Note>
          </Section>
        </WritingTab>
        <WritingTab label="Structure">
          <Section title="Structure">
            <SubSection title="Headings and page titles">
              <RuleList
                rules={[
                  'Give every page a unique, descriptive title. It is the first thing a screen reader announces.',
                  'Use headings in order (h1, then h2, then h3) to describe the page structure. Many people navigate by heading.',
                ]}
              />
            </SubSection>
            <SubSection title="Time limits">
              <p>
                If a session or action can time out, warn people before it happens and offer a way
                to extend it: "Your session ends in 2 minutes. Stay signed in."
              </p>
            </SubSection>
          </Section>
        </WritingTab>
        <WritingTab label="Quick reference">
          <Section title="Quick reference">
            <GuideTable
              columns={['Element', 'What it needs']}
              rows={[
                ['Icon button', 'aria-label naming the action, matching its tooltip'],
                ['Image', 'Alt text describing its meaning, or alt="" if decorative'],
                ['Form field', 'Visible label, linked helper text and error'],
                ['Spinner or skeleton', 'A label for what is loading'],
                ['Status change', 'A short live region announcement'],
                ['Link or button', 'Text that makes sense on its own'],
              ]}
            />
          </Section>
        </WritingTab>
      </WritingTabs>
    </WritingPage>
  );
}
