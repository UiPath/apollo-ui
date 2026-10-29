import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { Input } from '../input';
import { AddRowButton } from './add-row-button';
import { EmptyRows } from './empty-rows';
import { GroupModeToggle, MATCH_MODES, type MatchMode } from './group-mode-toggle';
import { RowDeleteButton } from './row-delete-button';
import { useRowFocus } from './use-row-focus';

const meta = {
  title: 'Components/Core/Row Groups',
  component: RowDeleteButton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The shared parts of a list people add to and remove from: conditions, rules, headers, branches. See
the Repeatable Rows guidance page for where each one goes.

- **RowDeleteButton** removes one item. Name it for its row, such as "Remove condition 2".
- **AddRowButton** adds an item. Name the item, such as "Add condition".
- **EmptyRows** replaces the items once the last one is removed, and says what happens with none.
- **GroupModeToggle** switches a group's mode, from two or three short options. \`MATCH_MODES\`
  gives a condition group's All (AND) / Any (OR).
- **useRowFocus** moves focus after an add or a delete. Put \`listRef\` on the element whose direct
  children are the items, mark each item \`data-row\`, and mark the control that should take focus
  when it is added \`data-row-first\`. Put \`addRef\` on the add action: it takes focus once the
  last item is deleted. Focus only moves once the list has actually changed, so a host that rejects
  or defers the change keeps focus where it is.
`,
      },
    },
  },
  tags: ['autodocs'],
  args: { label: 'Remove condition 1' },
} satisfies Meta<typeof RowDeleteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

let nextHeader = 3;

/** Add and delete move focus, and removing the last item shows the empty state. */
export const List: Story = {
  render: () => {
    const [headers, setHeaders] = useState([
      { id: 1, name: 'Accept' },
      { id: 2, name: 'Authorization' },
    ]);
    const focus = useRowFocus();
    return (
      <div className="flex w-96 flex-col gap-2">
        <div ref={focus.listRef} className="flex flex-col gap-2">
          {headers.map((header, position) => (
            <div key={header.id} data-row="" className="flex items-center gap-2">
              <Input
                aria-label={`Header ${position + 1} name`}
                data-row-first=""
                defaultValue={header.name}
              />
              <RowDeleteButton
                label={`Remove header ${position + 1}`}
                onClick={() => {
                  focus.afterDelete(position);
                  setHeaders((current) => current.filter((item) => item.id !== header.id));
                }}
              />
            </div>
          ))}
          {headers.length === 0 && <EmptyRows>No headers. The request sends none.</EmptyRows>}
        </div>
        <div>
          <AddRowButton
            ref={focus.addRef}
            onClick={() => {
              focus.afterAdd();
              setHeaders((current) => [...current, { id: nextHeader++, name: '' }]);
            }}
          >
            Add header
          </AddRowButton>
        </div>
      </div>
    );
  },
};

/** Visible by default, revealed on hover for dense lists, and disabled. */
export const DeleteAction: Story = {
  render: (args) => (
    <div className="grid w-80 gap-5">
      <Example label="Default">
        <RowDeleteButton {...args} />
      </Example>
      <Example label="Reveal on hover (hover this row)">
        <div className="group flex items-center justify-between rounded border border-dashed p-1">
          <span className="text-sm">Condition 1</span>
          <RowDeleteButton {...args} revealOnHover />
        </div>
      </Example>
      <Example label="Disabled">
        <RowDeleteButton {...args} disabled />
      </Example>
    </div>
  ),
};

/** A condition group's All / Any, disabled, another kind of group, and translated. */
export const GroupModeSwitch: Story = {
  name: 'Group mode',
  render: () => {
    const [mode, setMode] = useState<MatchMode>('all');
    const [branching, setBranching] = useState<'first' | 'every'>('first');
    return (
      <div className="grid w-80 gap-5">
        <Example label={`Match mode: ${mode}`}>
          <GroupModeToggle
            modes={MATCH_MODES}
            value={mode}
            onValueChange={setMode}
            strings={{ label: 'Match mode' }}
          />
        </Example>
        <Example label="Disabled">
          <GroupModeToggle modes={MATCH_MODES} value="any" disabled />
        </Example>
        <Example label="Response branches">
          <GroupModeToggle
            modes={[
              { value: 'first', label: 'First match' },
              { value: 'every', label: 'Every match' },
            ]}
            value={branching}
            onValueChange={setBranching}
            strings={{ label: 'Branch mode' }}
          />
        </Example>
        <Example label="Translated">
          <GroupModeToggle
            modes={[
              { value: 'all', label: 'Toutes (ET)' },
              { value: 'any', label: 'Au moins une (OU)' },
            ]}
            value={mode}
            onValueChange={setMode}
            strings={{ label: 'Mode de correspondance' }}
          />
        </Example>
      </div>
    );
  },
};
