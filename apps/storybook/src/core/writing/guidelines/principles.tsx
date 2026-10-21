import {
  DoDont,
  GuidelineLink,
  GuideTable,
  RuleList,
  Section,
  SubSection,
  WritingPage,
} from '../writing-ui';

export function PrinciplesPage() {
  return (
    <WritingPage
      title="Writing principles"
      intro="The ideas behind every piece of UiPath UI copy. Start here, then use the style rules and content patterns for the details."
    >
      <Section title="Core principles">
        <GuideTable
          columns={['Principle', 'What it means']}
          rows={[
            ['Simple', 'Use plain, accessible language. Aim for a grade 6 reading level.'],
            ['Consistent', 'Apply the same rules everywhere, across every product.'],
            ['User-centric', 'Focus on helping people reach their goals.'],
            ['Conversational', 'Keep a friendly, natural tone.'],
            ['Accessible', 'Use language that people around the world understand.'],
          ]}
        />
      </Section>

      <Section title="Voice and tone">
        <RuleList
          rules={[
            'Sound natural and conversational by default.',
            'For task-focused screens, be straightforward, like a helpful collaborator.',
            'Avoid dense text. Readability comes first.',
            'Avoid jargon unless the audience is clearly expert.',
            'Write only what people need. Shorter is usually better.',
          ]}
        />
      </Section>

      <Section
        title="Inclusive writing"
        intro="Write for everyone who uses the product, whatever their background, identity, or experience."
      >
        <SubSection title="Be aware">
          <p>
            Think about how your words may land with different audiences. Avoid assumptions about
            ability, background, identity, or experience.
          </p>
        </SubSection>
        <SubSection title="Connect and empathize">
          <p>
            Write as if you were talking to a real person. Use "you" to address the reader, and
            focus on what they can do, not what they can't.
          </p>
        </SubSection>
        <SubSection title="Don't assume or judge">
          <p>
            Avoid language that implies a default or a norm. Don't make assumptions about gender,
            relationship status, age, or technical skill.
          </p>
          <DoDont dontItems={['Normal user', 'Advanced user']} />
        </SubSection>
        <SubSection title="Use gender-neutral language">
          <p>
            Use "they" and "them" when gender is unknown or when you mean a generic user. Prefer
            neutral job titles.
          </p>
          <DoDont doItems={['They', 'Chairperson']} dontItems={['He/she', 'Chairman']} />
        </SubSection>
        <SubSection title="Respect ability and skill">
          <p>
            Avoid calling a task "simple" or "easy." What is easy for one person may not be for
            another. Offer help without talking down.
          </p>
        </SubSection>
      </Section>

      <Section
        title="Writing for translation"
        intro="UI copy is translated into many languages, and text can grow by 20–30% in languages like German or Finnish. Clear source copy makes for better translations."
      >
        <RuleList
          rules={[
            'Use literal language. Idioms and colloquialisms translate poorly.',
            'Break up compound nouns, or use prepositions to connect the words.',
            'Use the same word for the same idea every time. Don\'t switch between "save" and "store," or "delete" and "remove," unless they mean different things.',
            'Keep sentences short, with one idea per sentence.',
            'Be explicit about what "it," "this," or "that" refers to.',
            'Avoid cultural references such as holidays, sports, or events that not everyone knows.',
            'Give translators enough context. A single word on its own is hard to translate well.',
            'Prefer single-word verbs to phrasal verbs, except where the phrasal verb is the standard UI term, like "sign in" or "log out."',
          ]}
        />
        <DoDont
          doItems={['Start immediately', 'Select the button', 'Configure', 'Complete the form']}
          dontItems={['Hit the ground running', 'Click it', 'Set up', 'Fill out the form']}
        />
        <p>
          For plurals, placeholders, and other details, see <GuidelineLink story="Localization" />.
        </p>
      </Section>

      <Section
        title="Active and passive voice"
        intro="Use active voice unless it makes the sentence awkward. It is clearer, shorter, and translates more reliably."
      >
        <GuideTable
          columns={['Active', 'Passive']}
          rows={[
            ['You built a new robot.', 'A new robot was built by you.'],
            ['UiPath StudioX committed your changes.', 'Your changes have been committed.'],
          ]}
        />
        <p>
          Passive voice is fine when the result matters more than who did it, or when the actor is
          unknown or irrelevant.
        </p>
        <DoDont
          doItems={['Your changes have been committed.', "We weren't able to find that page."]}
          dontItems={[
            'A new project template was saved for future use by you.',
            'The automation was run by the robot.',
          ]}
        />
      </Section>
    </WritingPage>
  );
}
