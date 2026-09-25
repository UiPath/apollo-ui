import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from '@/components/ui/button';
// The connector logos from `@uipath/apollo-ui-icons`, imported as URLs from
// source, as the logos story does.
import outlookLogo from '../../../../../apollo-ui-icons/src/svg/third-party/microsoft-outlook.svg?url';
import slackLogo from '../../../../../apollo-ui-icons/src/svg/third-party/slack.svg?url';
import { ConnectionPicker } from './connection-picker';
import type { Connection } from './types';

/**
 * Outlook connections across two folders, one of each health. Every row
 * shares one connector, as they do in a real field: an Outlook activity only
 * offers Outlook connections.
 */
const CONNECTIONS: Connection[] = [
  {
    id: 'conn-ops',
    name: 'Outlook Ops',
    account: 'ops@contoso.com',
    status: 'broken',
    statusReason: 'Token expired. Sign in again to restore access to the mailbox.',
    logo: outlookLogo,
  },
  { id: 'conn-work', name: 'Outlook Work', account: 'jane.doe@contoso.com', logo: outlookLogo },
  {
    id: 'conn-finance',
    name: 'Outlook Finance',
    account: 'finance@contoso.com',
    status: 'warning',
    statusReason: 'Missing scopes: Mail.Send. Re-authenticate with the correct permissions.',
    logo: outlookLogo,
  },
  {
    id: 'conn-shared',
    name: 'Outlook Shared',
    account: 'shared-inbox@contoso.com',
    folder: 'Shared/Finance',
    logo: outlookLogo,
  },
  {
    id: 'conn-archive',
    name: 'Outlook Archive',
    account: 'archive@contoso.com',
    folder: 'Shared/Finance',
    logo: outlookLogo,
  },
];

const SLACK_CONNECTIONS: Connection[] = [
  {
    id: 'slack-eng',
    name: 'Slack Engineering',
    account: 'eng-bot@contoso.slack.com',
    logo: slackLogo,
  },
  {
    id: 'slack-support',
    name: 'Slack Support',
    account: 'support@contoso.slack.com',
    logo: slackLogo,
  },
  {
    id: 'slack-legacy',
    name: 'Slack Legacy',
    account: 'legacy@contoso.slack.com',
    status: 'broken',
    statusReason: 'App uninstalled. Reinstall the UiPath app in the workspace.',
    logo: slackLogo,
  },
];

const meta = {
  title: 'Components/Core/Connection Picker',
  component: ConnectionPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A field and popover for choosing the connection an activity runs with.

Built on \`ResourcePicker\`, which supplies the search, the folders, the
keyboard model and the footer. What is added is what only a connection has:
a health that shows on the field and on every row, actions to repair and edit
it, and a message under the field when the chosen connection needs attention.

## Health

A connection is \`connected\`, \`warning\` (usable but degraded, such as
missing scopes) or \`broken\`. Rows show it as a second line. The field shows
it as its leading dot and, when it is not healthy, in its border and in a
message underneath. Broken rows sort to the end of their folder: they stay
choosable and repairable, but a list should not open on dead ends.

## Naming

Rows and the field show the account, falling back to the connection name.
A node bound to the wrong account is the mistake worth catching, and a name
such as "Outlook Work" says which connector, not which account. The name
stays searchable, as does anything passed in \`keywords\`.

## Actions

* \`onFix\` adds Fix to broken rows, and to the message under the field for
  either unhealthy state.
* \`onEdit\` adds an edit control to every row, revealed under the cursor.
* \`onAddConnection\` adds a footer link. With no connections at all, the
  field itself starts a new one instead of opening an empty list.
* \`onRefreshSchema\` adds a menu to the field while a connection is chosen.
  Return a promise to show progress until it settles.

Row actions are pointer shortcuts. A listbox option is atomic to assistive
technology, so Fix is always also offered under the field once the broken
connection is chosen.

## Consumer guidance

* Pass \`error\` for validation, such as a required connection. It takes the
  place of the health message while it is set.
* Product routes stay out of the component: \`footerTrailing\` is the slot for
  a link to the page where connections are managed.
        `,
      },
    },
  },
  args: {
    connections: CONNECTIONS,
    onSelect: () => {},
  },
  argTypes: {
    connections: { description: 'Connections, in the order they are listed within a folder.' },
    value: { description: 'Id of the chosen connection, or an empty string.' },
    onSelect: { description: 'Called with the connection that was chosen.' },
    onFix: { description: 'Repairs a connection. Offered on broken rows and under the field.' },
    onEdit: { description: 'Edits a connection. Offered on every row.' },
    onAddConnection: { description: 'Starts a new connection.' },
    onRefreshSchema: { description: "Re-reads the chosen connection's schema." },
    error: { description: 'A validation message. Puts the field in its error state.' },
  },
} satisfies Meta<typeof ConnectionPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A field wired to local state, with every action logged rather than routed. */
function PickerDemo({
  initialValue = '',
  connections = CONNECTIONS,
  withActions = true,
  ...props
}: Partial<React.ComponentProps<typeof ConnectionPicker>> & {
  initialValue?: string;
  withActions?: boolean;
}) {
  const [value, setValue] = React.useState(initialValue);
  const log = (action: string) => (connection?: Connection) =>
    console.info(action, connection?.id ?? '');
  return (
    <div className="w-96">
      <ConnectionPicker
        connections={connections}
        value={value}
        onSelect={(connection) => setValue(connection.id)}
        onClear={() => setValue('')}
        {...(withActions && {
          onFix: log('fix'),
          onEdit: log('edit'),
          onAddConnection: () => log('add')(),
          onRefreshSchema: () => new Promise<void>((resolve) => setTimeout(resolve, 900)),
          footerTrailing: (
            <Button variant="link" size="sm" className="-mr-3">
              Open connections
            </Button>
          ),
        })}
        {...props}
      />
    </div>
  );
}

/** Every health and every action. Open it to see broken rows sorted last. */
export const Default: Story = {
  render: () => <PickerDemo />,
};

/** A healthy connection, with the field menu that refreshes its schema. */
export const WithValue: Story = {
  render: () => <PickerDemo initialValue="conn-work" />,
};

/** A broken connection: the field turns to its error state and offers Fix. */
export const Broken: Story = {
  render: () => <PickerDemo initialValue="conn-ops" />,
};

/** Missing scopes: usable, so the field warns rather than errs. */
export const MissingScopes: Story = {
  render: () => <PickerDemo initialValue="conn-finance" />,
};

/** Another connector. The logo is the only thing that changes. */
export const Slack: Story = {
  render: () => <PickerDemo connections={SLACK_CONNECTIONS} initialValue="slack-eng" />,
};

/** A required field left empty. */
export const Required: Story = {
  render: () => <PickerDemo error="Connection is required." />,
};

/** With nothing to pick, the field starts a new connection. */
export const NoConnections: Story = {
  render: () => <PickerDemo connections={[]} />,
};

/** Without handlers, the picker is only a choice: no row actions and no footer. */
export const SelectOnly: Story = {
  render: () => <PickerDemo withActions={false} initialValue="conn-work" />,
};

export const Disabled: Story = {
  render: () => <PickerDemo initialValue="conn-work" disabled />,
};
