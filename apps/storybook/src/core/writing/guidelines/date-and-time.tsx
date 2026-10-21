import {
  DoDont,
  GuideTable,
  Note,
  PatternLink,
  RuleList,
  Section,
  SubSection,
  WritingPage,
} from '../writing-ui';

export function DateAndTimePage() {
  return (
    <WritingPage
      title="Dates and times"
      intro="How to format dates, times, and durations, and when to use relative or absolute time. Product UI always uses numerals, even at the start of a sentence."
    >
      <Section title="Dates">
        <p>Use American English date formats when writing in English.</p>
        <RuleList
          rules={['Dec 12', 'December 12', 'December 12, 2023', 'Monday, December 12, 2023']}
        />
        <RuleList
          rules={[
            <>
              Standard format: <code>ddd, MMM D, YYYY</code>. No leading zero on the day. You can
              leave out the year for dates in the current year.
            </>,
            'Use the full date in cards and wherever the design allows.',
            'Leave room for the longest translations of month and day names. August in Turkish, "Ağustos," is 7 characters.',
          ]}
        />
      </Section>

      <Section title="Times">
        <p>
          Write times as <code>H:MM AM/PM time zone</code>, with a space before AM or PM and no
          periods.
        </p>
        <SubSection title="12-hour clock">
          <RuleList
            rules={[
              'No leading zero on the hour; always a leading zero on minutes.',
              'Seconds are optional, with a leading zero.',
              'AM and PM in capitals, after a space.',
              'Time zone is optional, written as UTC+ or UTC- followed by hours and minutes.',
            ]}
          />
        </SubSection>
        <SubSection title="24-hour clock">
          <p>Use a leading zero on both the hour and the minutes.</p>
        </SubSection>
        <p>
          You can drop the minutes on the hour. Noon and midnight can be "Noon" and "Midnight," or
          "12 PM" and "12 AM."
        </p>
        <DoDont doItems={['4:12 PM', '4 PM', '16:05']} dontItems={['04:12 p.m.', '4:12PM']} />
      </Section>

      <Section
        title="Durations"
        intro='A duration is the time between two moments. Call it "duration," not "execution time" or "throughput time."'
      >
        <GuideTable
          columns={['Type', 'Format', 'Example']}
          rows={[
            ['Exact', 'A number with a unit letter, up to three units', '2h 15m 30s'],
            ['Rounded', 'Up to two decimal places, with the exact value in a tooltip', '2.25 hrs'],
          ]}
        />
        <RuleList
          rules={[
            'Show up to three units in a row, starting with the largest, and include zeros in between: 1h 00m 30s, not 1h 30s.',
            'Never mix hours, minutes, and seconds with years, weeks, and days in the same value.',
            'When rounding, keep the same unit throughout (minutes stay minutes).',
          ]}
        />
      </Section>

      <Section title="Relative or absolute time">
        <GuideTable
          columns={['', 'Absolute', 'Relative']}
          rows={[
            ['Looks like', 'Dec 12, 12:33 PM', '3 days ago'],
            [
              'Use when',
              'People need to look back at content, find something specific, or target a period',
              'Recency matters more than precision, or content changes often',
            ],
            [
              'Good for',
              'Error logs, audit trails, records',
              'Activity feeds, comments, recent updates',
            ],
          ]}
        />
        <RuleList
          rules={[
            'Whenever you show relative time, show the absolute date and time on hover.',
            "Don't use relative time when people need to tell close events apart. In error logs, absolute times make back-to-back events clear.",
            'If content changes often but also keeps an archive people refer back to, combine both.',
          ]}
        />
        <SubSection title="Last updated">
          <p>
            Use relative time for updates in the last 24 hours, then switch to absolute time. Label
            the column or field "Last updated."
          </p>
          <DoDont
            doItems={[
              'Updated just now',
              'Updated 5 minutes ago',
              'Updated 1 hour ago',
              'Updated May 30, 2025',
              'Updated May 30, 2025 at 4:12 PM',
            ]}
            dontItems={['Updated recently', 'Last modified', 'Date of change']}
          />
        </SubSection>
      </Section>

      <Section title="In components">
        <GuideTable
          columns={['Component', 'Guidance']}
          rows={[
            [
              'Tables',
              'Align dates to the left and use one format across the table. For absolute time, show seconds and time zone when needed. For relative time, show the absolute time in a tooltip.',
            ],
            [
              'Date pickers',
              'Spell out the day of the week and the month. For typed input, show the expected format as hint text.',
            ],
            ['Cards', 'Use relative or absolute time depending on context.'],
            [
              'Stored timestamps',
              "Store in UTC (ISO 8601) and convert to the viewer's time zone for display.",
            ],
          ]}
        />
        <Note>
          For table-specific examples, see the <PatternLink story="Table and Status" /> and{' '}
          <PatternLink story="Date, Time, and Duration" /> patterns.
        </Note>
      </Section>
    </WritingPage>
  );
}
