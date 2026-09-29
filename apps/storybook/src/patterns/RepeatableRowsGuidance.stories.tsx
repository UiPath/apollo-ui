import type { Meta, StoryObj } from '@storybook/react-vite';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField, FormFieldHeader, FormFieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FullWorkbenchComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { withCanvasProviders } from '../../../../packages/apollo-react/src/canvas/storybook-utils';
import {
  Divider,
  ExampleCard,
  GuidanceItem,
  GuidanceList,
  GuidancePage,
  InfoCallout,
  InlineCode,
  PatternCard,
  SectionDescription,
  SectionTitle,
} from './guidance-primitives';
import {
  AddRowButton,
  ConditionEditor,
  type ConditionEditorProps,
  type ConditionGroup,
  condition,
  EmptyRows,
  group,
  KeyValueList,
  newId,
  RepeatableCard,
  RowDeleteButton,
  RowDragHandle,
  uniqueName,
  useRowFocus,
} from './repeatable-row-primitives';
import {
  EntityFilterPanel,
  FormRulesPanel,
  HttpRequestPanel,
  RuleList,
} from './repeatable-rows-panels';

const meta = {
  title: 'Apollo Wind/Forms/Guidance Repeatable Rows',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Layout examples ─────────────────────────────────────────────────────────

/** Local state around ConditionEditor, so each example on the page is independent. */
function Conditions({
  initial,
  ...props
}: Omit<ConditionEditorProps, 'value' | 'onChange'> & {
  initial: () => ConditionGroup;
}) {
  const [value, setValue] = useState(initial);
  return <ConditionEditor value={value} onChange={setValue} {...props} />;
}

function ConditionListExample({ layout = 'inline' }: { layout?: 'inline' | 'stacked' }) {
  return (
    <Conditions
      label="Conditions"
      layout={layout}
      maxDepth={0}
      matchMode={false}
      emptyText="No conditions. The rule runs on its events alone."
      initial={() =>
        group('all', [
          condition({ field: 'accountId', operator: 'equals', value: '1' }),
          condition(),
        ])
      }
    />
  );
}

function ConditionGroupExample({ showSummary = true }: { showSummary?: boolean }) {
  return (
    <Conditions
      label="Conditions"
      showSummary={showSummary}
      initial={() =>
        group('any', [
          condition({ field: 'accountId', operator: 'equals', value: '1' }),
          group('all', [condition({ field: 'createdBy', operator: 'equals', value: 'admin' })]),
        ])
      }
    />
  );
}

function RuleExample() {
  return (
    <RuleList
      initialRules={[
        {
          outcome: 'show',
          conditions: group('all', [
            condition({ field: 'amount', operator: 'greaterThan', value: '1000' }),
          ]),
        },
      ]}
    />
  );
}

function RepeatableCardExample() {
  const [columns, setColumns] = useState(() => [{ id: newId('column'), name: 'CompanyName' }]);
  const focus = useRowFocus();
  const move = (from: number, to: number) =>
    setColumns((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div ref={focus.listRef} className="flex flex-col gap-3">
        {columns.map((column, position) => (
          <RepeatableCard
            key={column.id}
            leading={
              <RowDragHandle
                label={`Reorder column ${position + 1}`}
                onMoveUp={position > 0 ? () => move(position, position - 1) : undefined}
                onMoveDown={
                  position < columns.length - 1 ? () => move(position, position + 1) : undefined
                }
              />
            }
            title={
              <FormField>
                <FormFieldLabel htmlFor={`${column.id}-name`}>Column name</FormFieldLabel>
                <Input
                  id={`${column.id}-name`}
                  data-row-first=""
                  value={column.name}
                  onChange={(event) =>
                    setColumns((current) =>
                      current.map((item) =>
                        item.id === column.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                />
              </FormField>
            }
            deleteLabel={`Remove column ${position + 1}`}
            onDelete={() => {
              focus.afterDelete(position);
              setColumns((current) => current.filter((item) => item.id !== column.id));
            }}
          >
            <FormField>
              <FormFieldLabel htmlFor={`${column.id}-description`} required>
                Description
              </FormFieldLabel>
              <Textarea
                id={`${column.id}-description`}
                required
                rows={2}
                placeholder="Describe what this column should contain"
              />
            </FormField>
          </RepeatableCard>
        ))}
        {columns.length === 0 && <EmptyRows>No output columns.</EmptyRows>}
      </div>
      <div>
        <AddRowButton
          ref={focus.addRef}
          onClick={() => {
            focus.afterAdd();
            setColumns((current) => [
              ...current,
              {
                id: newId('column'),
                name: uniqueName(
                  'OutputColumn',
                  current.map((item) => item.name)
                ),
              },
            ]);
          }}
        >
          Add column
        </AddRowButton>
      </div>
    </div>
  );
}

function KeyValueExample() {
  return (
    <KeyValueList
      title="Headers"
      itemName="header"
      limit={20}
      initialPairs={[
        { key: 'Authorization', value: 'Bearer {{token}}' },
        { key: 'Accept', value: '' },
      ]}
    />
  );
}

function LabelledExpressionExample() {
  const [outputs, setOutputs] = useState(() => [
    { id: newId('output'), name: 'total', value: '$vars.subtotal + $vars.tax' },
  ]);
  const focus = useRowFocus();

  return (
    <div className="flex flex-col gap-3">
      <div ref={focus.listRef} className="flex flex-col gap-3">
        {outputs.map((output, position) => (
          <FormField key={output.id} data-row="">
            <FormFieldHeader
              label={output.name}
              htmlFor={output.id}
              badge={<span className="font-mono text-xs text-muted-foreground">number</span>}
              actions={
                <RowDeleteButton
                  label={`Remove output variable ${position + 1}`}
                  onClick={() => {
                    focus.afterDelete(position);
                    setOutputs((current) => current.filter((item) => item.id !== output.id));
                  }}
                />
              }
            />
            <Input
              id={output.id}
              data-row-first=""
              className="font-mono"
              defaultValue={output.value}
              placeholder="$vars.subtotal * 1.2"
            />
          </FormField>
        ))}
        {outputs.length === 0 && <EmptyRows>No output variables.</EmptyRows>}
      </div>
      <div>
        <AddRowButton
          ref={focus.addRef}
          onClick={() => {
            focus.afterAdd();
            setOutputs((current) => [
              ...current,
              {
                id: newId('output'),
                name: uniqueName(
                  'output',
                  current.map((item) => item.name)
                ),
                value: '',
              },
            ]);
          }}
        >
          Add output variable
        </AddRowButton>
      </div>
    </div>
  );
}

function ValueTypesExample() {
  return (
    <Conditions
      label="Value types"
      layout="inline"
      maxDepth={0}
      matchMode={false}
      showSummary
      initial={() =>
        group('all', [
          condition({ field: 'createdBy', operator: 'contains', value: 'admin' }),
          condition({
            field: 'amount',
            operator: 'greaterThan',
            value: '$vars.invoiceTotal',
            mode: 'expression',
          }),
          condition({
            field: 'createTime',
            operator: 'after',
            value: new Date(2026, 0, 1).toISOString(),
          }),
          condition({ field: 'status', operator: 'isOneOf', values: ['active', 'onHold'] }),
          condition({ field: 'createdBy', operator: 'isEmpty' }),
        ])
      }
    />
  );
}

// ── Do / Don't examples ─────────────────────────────────────────────────────

// Don't examples are pictures of the wrong pattern, so they are `inert`: not focusable or clickable.
function PerRowConnectorsExample() {
  const connectors = ['Where', 'And', 'Or', 'Or'];
  return (
    <div inert className="flex flex-col gap-2">
      {connectors.map((connector, position) => (
        <div key={connector + position} className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs font-semibold uppercase text-primary">
            {connector}
          </span>
          <div className="flex-1">
            <Input
              aria-label={`Condition ${position + 1}`}
              defaultValue={`Condition ${'ABCD'[position]}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderOnlyExample() {
  return (
    <div inert className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Input aria-label="Name" defaultValue="Authorization" />
        <Input aria-label="Value" defaultValue="Bearer {{token}}" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input aria-label="Name" placeholder="Name" />
        <Input aria-label="Value" placeholder="Value" />
      </div>
    </div>
  );
}

function RedTrashColumnExample() {
  return (
    <div inert className="flex flex-col gap-2">
      {[1, 2, 3].map((position) => (
        <div key={position} className="flex items-center gap-2">
          <div className="flex-1">
            <Input aria-label={`Row ${position}`} defaultValue={`Row ${position}`} />
          </div>
          <RowDeleteButton
            label={`Remove row ${position}`}
            className="text-error hover:text-error"
          />
        </div>
      ))}
    </div>
  );
}

function CloseIconDeleteExample() {
  return (
    <div inert className="flex items-center gap-2">
      <div className="flex-1">
        <Input aria-label="Condition" defaultValue="Amount equals 1000" />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        icon
        aria-label="Remove condition"
        className="text-muted-foreground"
      >
        <X />
      </Button>
    </div>
  );
}

function WrappedDeleteExample() {
  return (
    <div inert className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Input aria-label="Field" defaultValue="CreateTime" />
        <Input aria-label="Operator" defaultValue="Equals" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input aria-label="Value" placeholder="Enter a value" />
        </div>
        <RowDeleteButton label="Remove condition" />
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

function RepeatableRowsGuidancePage({ globalTheme }: { globalTheme: string }) {
  return (
    <GuidancePage
      globalTheme={globalTheme}
      title="Repeatable Rows Guidance"
      intro="Conditions, rules, headers, output columns, and branches are all lists that people add to and remove from. Use the same layouts, the same delete action, and the same add action for all of them, so a person who learns one list already knows the rest."
      maxWidth="max-w-4xl"
    >
      <Divider />

      <section>
        <SectionTitle>Choose the right layout</SectionTitle>
        <SectionDescription>
          Pick the layout by what one item contains. Use a row when an item is a few short controls,
          and a card when it has a name plus fields below it.
        </SectionDescription>
        <div className="grid gap-5">
          <PatternCard
            eyebrow="Row"
            title="Condition list"
            description="Field, operator, value, delete, under one row of column labels. Use for a flat list of filters or checks. Delete the last row to see the empty state."
          >
            <ConditionListExample />
          </PatternCard>
          <PatternCard
            eyebrow="Row group"
            title="Condition group"
            description="One All or Any switch per group, with nested groups for mixed logic. Use when people need both AND and OR."
          >
            <ConditionGroupExample />
          </PatternCard>
          <PatternCard
            eyebrow="Row group"
            title="Rule"
            description="An outcome plus the conditions that trigger it. Delete removes the whole rule and sits in the rule header."
          >
            <RuleExample />
          </PatternCard>
          <PatternCard
            eyebrow="Card"
            title="Repeatable card"
            description="A name with fields below it. Use for output columns, variable updates, and response branches. Output column order matters here, so the card has a reorder handle."
          >
            <RepeatableCardExample />
          </PatternCard>
          <PatternCard
            eyebrow="Row"
            title="Key-value pairs"
            description="Two inputs per row under Name and Value column labels, with a visible limit. Use for headers, query parameters, and metadata."
          >
            <KeyValueExample />
          </PatternCard>
          <PatternCard
            eyebrow="Labelled field"
            title="Labelled expression"
            description="A single labelled value. Delete sits at the end of the label row, after any header actions such as Insert."
          >
            <LabelledExpressionExample />
          </PatternCard>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Combining conditions</SectionTitle>
        <SectionDescription>
          Each group has one switch that decides how its conditions combine. All (AND) means every
          condition must be true. Any (OR) means at least one must be true. To mix the two, nest a
          group inside another group.
        </SectionDescription>
        <div className="grid gap-5 md:grid-cols-2">
          <ExampleCard
            kind="do"
            note="One switch per group. The nesting shows the order of evaluation: the top switch joins condition 1 with the nested group as a whole."
          >
            <ConditionGroupExample />
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t let each row pick its own connector. “A and B or C or D” can be read more than one way, and the screen doesn’t say which."
          >
            <PerRowConnectorsExample />
          </ExampleCard>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Values</SectionTitle>
        <SectionDescription>
          The chosen field decides which operators are offered and which control holds the value.
          Every value can also switch between a fixed value and an expression.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Offer only the operators that make sense for the field&apos;s type. Text gets Contains,
            numbers get Greater than, dates get Before and After.
          </GuidanceItem>
          <GuidanceItem>
            Match the value control to the type: a date picker for dates, a select for a fixed set
            of options, and a multi-select for Is one of.
          </GuidanceItem>
          <GuidanceItem>
            Operators that need no value, such as Is empty, hide the value control.
          </GuidanceItem>
          <GuidanceItem>
            For numbers, use a text input with a numeric keyboard, set with{' '}
            <InlineCode>inputMode=&quot;decimal&quot;</InlineCode>, and check the value: “Enter a
            number.” A native number input changes its value on scroll and silently drops invalid
            text.
          </GuidanceItem>
          <GuidanceItem>
            Put the mode menu (<InlineCode>FieldMenu</InlineCode>) in a trailing addon at the end of
            the value. It offers Fixed value, Expression, and Variable. An expression shows the{' '}
            <InlineCode>=</InlineCode> indicator and a monospace font.
          </GuidanceItem>
          <GuidanceItem>
            Keep actions out of the value box, as Field Anatomy Guidance requires: the box holds
            only the control and its mode addons. To use a variable in a row, choose the Variable
            mode, which turns the value into a variable picker. A field with a header, such as a
            branch Condition, puts Insert variable in the header.
          </GuidanceItem>
          <GuidanceItem>
            When the field changes to a different type, reset the operator and clear the value.
          </GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <ValueTypesExample />
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Reading the result</SectionTitle>
        <SectionDescription>
          Nested logic is hard to check by eye. Show a plain-language reading of the conditions
          below the group, and in the header when the group is collapsed.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Join conditions with the group&apos;s word, “and” or “or”, and put nested groups in
            parentheses.
          </GuidanceItem>
          <GuidanceItem>
            Leave out incomplete conditions, since they are ignored when the flow runs.
          </GuidanceItem>
          <GuidanceItem>
            Update it as people edit. Don&apos;t make it a live region: announcing every keystroke
            is noisy.
          </GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <ConditionGroupExample />
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Delete actions</SectionTitle>
        <SectionDescription>
          Delete uses the same treatment as the Quick form field list in the Node Property Panel. It
          stays quiet until someone reaches for it.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Use the <InlineCode>Trash2</InlineCode> icon for delete. Keep <InlineCode>X</InlineCode>{' '}
            for closing panels and clearing a value.
          </GuidanceItem>
          <GuidanceItem>
            Muted at rest, normal text color on hover. Never red at rest or on hover. Red is for the
            Delete item in a menu and for confirmation dialogs.
          </GuidanceItem>
          <GuidanceItem>
            Keep delete visible in repeatable rows. Showing it only on hover hides it from keyboard
            and touch users. Hover reveal is an option for dense lists only.
          </GuidanceItem>
          <GuidanceItem>
            Rows: delete is the last item, in its own fixed column, centered on the controls and not
            on the message below them.
          </GuidanceItem>
          <GuidanceItem>
            Cards and rules: delete is on the right of the header, aligned with the title.
          </GuidanceItem>
          <GuidanceItem>
            Labelled fields: delete is at the end of the label row, after Insert and other header
            actions.
          </GuidanceItem>
          <GuidanceItem>
            Groups: use a <InlineCode>MoreVertical</InlineCode> menu on the group header. If the
            group still has conditions, confirm before deleting.
          </GuidanceItem>
          <GuidanceItem>
            Deleting the last row is allowed. Show an empty state that says what happens with no
            rows.
          </GuidanceItem>
        </GuidanceList>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <ExampleCard
            kind="do"
            note="Muted trash in a fixed column. It reads as available without pulling focus."
          >
            <ConditionListExample layout="stacked" />
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t color every delete red. A list of rows turns into a column of warnings."
          >
            <RedTrashColumnExample />
          </ExampleCard>
          <ExampleCard
            kind="do"
            note="In a narrow panel the value wraps to its own line and delete stays on the first line."
          >
            <Conditions
              label="Narrow panel example"
              container="plain"
              layout="stacked"
              maxDepth={0}
              matchMode={false}
              initial={() => group('all', [condition({ field: 'createTime', operator: 'on' })])}
            />
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t let delete wrap with the value. It stops lining up with the rows above and below."
          >
            <WrappedDeleteExample />
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t use a close icon to delete. People read it as clear or dismiss, not remove."
          >
            <CloseIconDeleteExample />
          </ExampleCard>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Deleting a group</SectionTitle>
        <SectionDescription>
          Deleting a group removes every condition inside it, so it goes through the group menu and
          asks first.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Put Delete group in the group&apos;s <InlineCode>MoreVertical</InlineCode> menu, in the
            error color. The menu item is where red belongs.
          </GuidanceItem>
          <GuidanceItem>
            If the group still has conditions, confirm in a dialog that says how many will go. An
            empty group deletes straight away.
          </GuidanceItem>
          <GuidanceItem>
            If the product has an undo toast, deleting with Undo can replace the dialog. Pick one
            per product, not both.
          </GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <InfoCallout>
            Try it in the Condition group example above: open the nested group&apos;s menu and
            choose Delete group.
          </InfoCallout>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Reordering</SectionTitle>
        <SectionDescription>
          Show a reorder handle only when order changes the result.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Order matters for response branches (the first match wins) and output columns. It
            doesn&apos;t for filter conditions, headers, or query parameters, so those have no
            handle.
          </GuidanceItem>
          <GuidanceItem>
            The handle sits first in the row. Activating it opens Move up and Move down, which is
            the keyboard and touch alternative to dragging.
          </GuidanceItem>
          <GuidanceItem>Disable Move up on the first item and Move down on the last.</GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <InfoCallout>
            Try it on the Repeatable card example above. The handle opens the move menu; drag and
            drop itself is not wired in these examples.
          </InfoCallout>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Adding rows</SectionTitle>
        <SectionDescription>
          The add action is a text button with a plus icon, placed bottom-left, directly under the
          last row.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Name the item: “Add condition”, “Add header”, “Add column”. Avoid a bare “Add”.
          </GuidanceItem>
          <GuidanceItem>
            When a list supports groups, put “Add group” next to “Add condition” rather than behind
            a menu.
          </GuidanceItem>
          <GuidanceItem>
            When a list has a limit, show the count (for example 2 / 20) and disable the add action
            at the limit.
          </GuidanceItem>
          <GuidanceItem>Move focus to the first control of the new row.</GuidanceItem>
          <GuidanceItem>
            A new row starts without an error, even though it is empty. See Validation below.
          </GuidanceItem>
          <GuidanceItem>
            These examples allow one level of nesting: a nested group can&apos;t add a group of its
            own. Confirm the limit with design.
          </GuidanceItem>
        </GuidanceList>
      </section>

      <Divider />

      <section>
        <SectionTitle>Validation</SectionTitle>
        <SectionDescription>
          Follow the Field Validation Guidance page. Repeatable rows add three rules on top of it.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Show a row&apos;s message once focus leaves the row, or on submit. A new, empty row
            shows nothing until then. Choosing from a picker inside the row doesn&apos;t count as
            leaving it.
          </GuidanceItem>
          <GuidanceItem>
            Show one message per row, below the row, and mark only the controls that still need a
            value.
          </GuidanceItem>
          <GuidanceItem>
            Repeat a summary below the group, such as “Some conditions are incomplete and will be
            ignored.” It stays visible when the group is collapsed.
          </GuidanceItem>
        </GuidanceList>
        <div className="mt-6">
          <Conditions
            label="Validation example"
            layout="inline"
            maxDepth={0}
            initial={() =>
              group('all', [
                condition({ field: 'accountId', operator: 'equals', value: '1' }),
                condition({ touched: true }),
              ])
            }
          />
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Visible labels</SectionTitle>
        <SectionDescription>
          Every field keeps a visible label. A placeholder is never the label: it disappears as soon
          as someone types, which fails WCAG 3.3.2 (Labels or Instructions).
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            One-line rows: a row of column labels above the list labels every field in its column.
            Each control is named by its row and its column, such as “Condition 2 Field”.
          </GuidanceItem>
          <GuidanceItem>
            Stacked rows, in narrow panels: each field gets its own small label, a{' '}
            <InlineCode>FormFieldHeader</InlineCode> with the muted variant. Column labels
            can&apos;t reach a value that has dropped to its own line.
          </GuidanceItem>
          <GuidanceItem>
            Cards and rules: label their fields like any other field, such as “Branch name” and
            “Outcome”.
          </GuidanceItem>
          <GuidanceItem>
            Use a placeholder only for an example of a valid value, never for the field&apos;s name.
          </GuidanceItem>
          <GuidanceItem>
            Build labels from the Field Anatomy parts. A standalone field is a{' '}
            <InlineCode>FormField</InlineCode> with a <InlineCode>FormFieldLabel</InlineCode>, or a{' '}
            <InlineCode>FormFieldHeader</InlineCode> when its label row carries a badge or actions.
            Shared column labels are one muted <InlineCode>FormFieldHeader</InlineCode> per column,
            outside any field, and each control names itself with that label through{' '}
            <InlineCode>aria-labelledby</InlineCode>.
          </GuidanceItem>
        </GuidanceList>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <ExampleCard
            kind="do"
            note="Column labels stay visible however many rows there are, and name every field below them."
          >
            <KeyValueExample />
          </ExampleCard>
          <ExampleCard
            kind="dont"
            note="Don’t use the placeholder as the label. Once a value is typed, nothing says what the field is."
          >
            <PlaceholderOnlyExample />
          </ExampleCard>
        </div>
      </section>

      <Divider />

      <section>
        <SectionTitle>Accessibility</SectionTitle>
        <SectionDescription>
          Every action in a row needs a name that says which row it acts on.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Name delete buttons by position and type, such as “Remove condition 2”, not just
            “Delete”.
          </GuidanceItem>
          <GuidanceItem>
            After a delete, move focus to the same position in the list, or to the add action when
            the list is empty.
          </GuidanceItem>
          <GuidanceItem>
            Give reorder handles a keyboard alternative. Here the handle itself opens Move up and
            Move down.
          </GuidanceItem>
          <GuidanceItem>
            Build the match-mode switch on <InlineCode>ToggleGroup</InlineCode> so the selected
            option is announced.
          </GuidanceItem>
          <GuidanceItem>
            Point <InlineCode>aria-describedby</InlineCode> and{' '}
            <InlineCode>aria-errormessage</InlineCode> at the row message, and set{' '}
            <InlineCode>aria-invalid</InlineCode> only on the controls that need a value.
          </GuidanceItem>
          <GuidanceItem>
            Give each row message a unique id. The same list can appear more than once on a page.
          </GuidanceItem>
        </GuidanceList>
      </section>

      <Divider />

      <section>
        <SectionTitle>Moving to shared components</SectionTitle>
        <SectionDescription>
          The examples on this page are built from prototypes that live only in the Storybook app.
          They demonstrate the guidance; they are not components. Don&apos;t import them into
          product code or copy them into other stories, or they will drift from what apollo-wind
          ships.
        </SectionDescription>
        <GuidanceList>
          <GuidanceItem>
            Candidates for apollo-wind: <InlineCode>RowDeleteButton</InlineCode>,{' '}
            <InlineCode>AddRowButton</InlineCode>, <InlineCode>RowDragHandle</InlineCode>,{' '}
            <InlineCode>MatchModeToggle</InlineCode>, the <InlineCode>useRowFocus</InlineCode> hook,
            a key-value list, and <InlineCode>ConditionEditor</InlineCode> with its type-aware{' '}
            <InlineCode>ConditionRow</InlineCode>.
          </GuidanceItem>
          <GuidanceItem>
            Build each one in apollo-wind from the Field Anatomy parts, with tests and its own
            stories, once design confirms the pattern and its name.
          </GuidanceItem>
          <GuidanceItem>
            As each ships, replace the prototype on this page with the real component, so the page
            always documents what is delivered.
          </GuidanceItem>
        </GuidanceList>
      </section>
    </GuidancePage>
  );
}

export const Documentation: Story = {
  name: 'Documentation',
  render: (_args, { globals }) => (
    <RepeatableRowsGuidancePage globalTheme={globals.theme || 'future-dark'} />
  ),
};

export const ExampleEntityFilter: Story = {
  name: 'Example: Entity filter',
  decorators: [withCanvasProviders({ fullscreen: false })],
  render: () => (
    <FullWorkbenchComposition
      renderRightPanel={({ onClose }) => <EntityFilterPanel onClose={onClose} />}
    />
  ),
};

export const ExampleHttpRequest: Story = {
  name: 'Example: HTTP request',
  decorators: [withCanvasProviders({ fullscreen: false })],
  render: () => (
    <FullWorkbenchComposition
      renderRightPanel={({ onClose }) => <HttpRequestPanel onClose={onClose} />}
    />
  ),
};

export const ExampleFormRules: Story = {
  name: 'Example: Form field rules',
  decorators: [withCanvasProviders({ fullscreen: false })],
  render: () => (
    <FullWorkbenchComposition
      renderRightPanel={({ onClose }) => <FormRulesPanel onClose={onClose} />}
    />
  ),
};
