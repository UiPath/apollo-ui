import { DoDont, GuideTable, Note, Section, SubSection, WritingPage } from '../writing-ui';

export function TerminologyPage() {
  return (
    <WritingPage
      title="Terminology"
      intro="Use these words the same way everywhere, so people learn them once."
    >
      <Section title="Action verbs at a glance">
        <GuideTable
          columns={['Use', 'For', 'Not']}
          rows={[
            ['Build', 'Agents, automations, and apps', 'Create'],
            ['Create', "New objects that didn't exist before", 'Add new, New'],
            ['Add', 'Putting an existing object into a list, group, or container', 'Add new'],
            ['Remove', 'Taking something out without deleting it', 'Delete'],
            ['Delete', 'Permanent removal', 'Remove'],
            ['Run', 'A robot performing an automation (verb only)', 'Execute, or Run as a noun'],
            ['Select', 'Picking between two or more items', 'Choose'],
            ['Clear', 'Undoing a selection', 'Deselect'],
            ['Try again', 'Repeating an action that failed', 'Retry'],
          ]}
        />
      </Section>

      <Section title="Verbs">
        <SubSection title="Add">
          <p>
            Use for adding an existing object to an existing list, group, view, or other container.
            The opposite is Remove. If the object isn't obvious from context, add a noun: "Add
            user." If the object is new, use Create.
          </p>
          <DoDont doItems={['Add user']} dontItems={['Add new user', 'New user']} />
        </SubSection>
        <SubSection title="Build">
          <p>Use for agents, automations, and apps. For other objects, use Create.</p>
        </SubSection>
        <SubSection title="Create">
          <p>
            Use for making a new object that didn't exist before. "Create project" sets up a new
            workspace; "Create user" adds a new point of access. Follow the verb with a noun, and
            leave out "new": "Create template." The opposite is Delete.
          </p>
          <p>
            Use "Create new" or "Build new" only when the button opens a menu of object types. In
            that case, "new" stands in for the object.
          </p>
          <DoDont
            doItems={['Create template', 'Build automation']}
            dontItems={['Create new template', 'Create automation']}
          />
        </SubSection>
        <SubSection title="Execute">
          <p>Don't use "execute" for automations or jobs. Use Run.</p>
        </SubSection>
        <SubSection title="Run">
          <p>
            Use only as a verb, for a robot performing a series of automated tasks. A person can
            trigger an automation to be run by a robot. Never use "run" as a noun; use Job.
          </p>
          <DoDont
            doItems={['Run automation', 'The job completed']}
            dontItems={['View run', 'The run completed']}
          />
        </SubSection>
        <SubSection title="Select">
          <p>
            Use Select, not Choose, when people pick between two or more items. Use Clear instead of
            Deselect.
          </p>
        </SubSection>
        <SubSection title="Try again">
          <p>
            Use on buttons and prompts when an action failed and needs to be repeated. Make sure the
            reason is clear, and say how to fix it if you can: "Connection lost. Check your internet
            connection and try again."
          </p>
          <DoDont doItems={['Try again']} dontItems={['Retry']} />
          <Note>
            For screen readers, use <code>aria-label="Try again"</code>.
          </Note>
        </SubSection>
      </Section>

      <Section title="Labels and states">
        <SubSection title="Last updated">
          <p>
            Use "Last updated" as the label for column headings and similar fields. Show relative
            time for updates in the last 24 hours, then the date and time.
          </p>
          <DoDont
            doItems={['Updated 5 minutes ago', 'Updated May 30, 2025 at 4:12 PM']}
            dontItems={['Updated recently', 'Last modified', 'Date of change']}
          />
        </SubSection>
        <SubSection title="New">
          <p>
            An adjective for the state of a record, such as one that was recently created or
            released. It also appears in menus next to Open, Close, and Save. Don't use New as a
            verb, or in place of Add or Create.
          </p>
        </SubSection>
        <SubSection title="Settings">
          <p>
            A configurable part of the application that controls how it behaves or looks, such as
            theme or notification settings. Use "Settings" as the link text for pages where service
            admins manage application settings. If the page only manages user access, use "Manage
            access."
          </p>
        </SubSection>
        <SubSection title="Options">
          <p>
            A specific choice within a setting: Dark or Light theme, On or Off for notifications,
            System default or Custom.
          </p>
        </SubSection>
      </Section>

      <Section title="Platform concepts">
        <GuideTable
          columns={['Term', 'Meaning']}
          rows={[
            [
              'Activity',
              'A specific action a robot performs within an automation, such as reading a file, writing to a database, or sending an email. Often included in prebuilt packages, or custom-built by an RPA developer.',
            ],
            [
              'Automation',
              'Using a robot to perform the steps of a business process with minimal human involvement.',
            ],
            [
              'Idea',
              'A concept or plan for automating a task. The start of the automation lifecycle, where someone spots work that could be automated.',
            ],
            [
              'Job',
              'A single performance of an automation by a robot. When a robot is triggered to run an automation, it creates a job.',
            ],
            [
              'Package',
              'A deployable version of a project, containing workflows, agents, and dependencies. Used to deploy automations to production.',
            ],
            [
              'Process',
              'A sequence of repeatable tasks that achieves a specific outcome. People can model and automate their processes with UiPath.',
            ],
            [
              'Project',
              'A workspace in UiPath Automation Cloud that organizes automation workflows, assets, and related resources.',
            ],
            [
              'Trigger',
              'An event or condition that starts an automation: a schedule, an event such as an incoming email, or a person selecting a button.',
            ],
            [
              'Workflow',
              'A structured sequence of steps, built on the platform, that coordinates work across people, robots, and AI agents.',
            ],
          ]}
        />
        <SubSection title="Process versus automation">
          <p>
            A process is the blueprint: the steps needed to reach a goal. Automation is the
            technology that carries out some or all of those steps. Onboarding a new employee is a
            process with steps like collecting documents, verifying credentials, setting up
            accounts, and training. Each step can be done by hand or automated. Automation alone
            doesn't decide what needs to happen; it carries out what the process defines.
          </p>
        </SubSection>
      </Section>
    </WritingPage>
  );
}
