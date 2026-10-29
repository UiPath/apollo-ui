import { Database, Globe, UserCheck } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import {
  type ConditionGroup,
  ConditionsEditor,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import { InsertVariableAction } from '@/components/ui/field-actions';
import { FormField, FormFieldHeader, FormFieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AddRowButton, EmptyRows, useRowFocus } from '@/components/ui/row-groups';
import { createRule, type Rule, type RuleOutcome, RulesEditor } from '@/components/ui/rules-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import { NodePropertyPanel } from '../../../../packages/apollo-react/src/canvas/components/NodePropertyPanel';
import {
  CONDITION_FIELDS,
  KeyValueList,
  newId,
  RepeatableCard,
  RowDragHandle,
  uniqueName,
  type VariableOption,
} from './repeatable-row-primitives';

/**
 * Right-panel examples for the Repeatable Rows guidance page. Each one is plugged into
 * the Flow workbench through `FullWorkbenchComposition`'s `renderRightPanel`, so the
 * layouts are reviewed at real panel width, next to tabs and other fields. Like the
 * primitives they use, these are page prototypes, not components to import.
 */

const TAB_LIST_CLASS =
  'mx-3 h-auto justify-start gap-0.5 rounded-lg bg-transparent p-0.5 text-muted-foreground';
const TAB_TRIGGER_CLASS =
  'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm';

const VARIABLES: VariableOption[] = [
  { label: 'flowTest', value: '$vars.flowTest' },
  { label: 'accountId', value: '$vars.accountId' },
  { label: 'approverEmail', value: '$vars.approverEmail' },
  { label: 'statusCode', value: '$self.output.statusCode' },
];

const VARIABLE_ITEMS: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    type: 'object',
    children: VARIABLES.map((variable) => ({
      id: variable.value,
      label: variable.label,
      value: variable.value,
      type: 'string',
    })),
  },
];

function PanelTabs({ children }: { children: ReactNode }) {
  return (
    <Tabs defaultValue="parameters" className="flex h-full min-h-0 flex-col">
      <TabsList className={TAB_LIST_CLASS}>
        <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
          Parameters
        </TabsTrigger>
        <TabsTrigger value="errors" className={TAB_TRIGGER_CLASS}>
          Error handling
        </TabsTrigger>
        <TabsTrigger value="advanced" className={TAB_TRIGGER_CLASS}>
          Advanced
        </TabsTrigger>
      </TabsList>
      {/* Kept mounted while hidden, so switching tabs doesn't reset the rows people edited. */}
      <TabsContent
        value="parameters"
        forceMount
        className="mt-0 min-h-0 flex-1 overflow-y-auto p-3 pb-6 data-[state=inactive]:hidden"
      >
        <div className="flex flex-col gap-5">{children}</div>
      </TabsContent>
      <TabsContent value="errors" className="mt-0 p-3 text-xs text-muted-foreground">
        Not part of this example.
      </TabsContent>
      <TabsContent value="advanced" className="mt-0 p-3 text-xs text-muted-foreground">
        Not part of this example.
      </TabsContent>
    </Tabs>
  );
}

/** A list's title row: the Field Anatomy header, with an optional count as its badge. */
function SectionLabel({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <FormFieldHeader
      label={children}
      badge={meta ? <span className="text-xs text-muted-foreground">{meta}</span> : undefined}
    />
  );
}

// ── Read entity records: collapsible condition group ────────────────────────

export function EntityFilterPanel({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<ConditionGroup>(() =>
    createConditionGroup('any', [
      createCondition({
        field: 'accountId',
        operator: 'equals',
        value: '$vars.accountId',
        valueMode: 'expression',
      }),
      // Visited and left incomplete, to show the row and group messages.
      createCondition({ id: 'filter-incomplete' }),
      createConditionGroup('all', [
        createCondition({ field: 'createdBy', operator: 'equals', value: 'admin' }),
        createCondition({ field: 'status', operator: 'isOneOf', values: ['active', 'onHold'] }),
      ]),
    ])
  );

  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<Database />}
      nodeLabel="Read entity records"
      nodeCategory="Data Fabric · Repeatable rows"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <PanelTabs>
        <FormField>
          <FormFieldLabel htmlFor="entity-select" required>
            Data Fabric entity
          </FormFieldLabel>
          <Select defaultValue="account">
            <SelectTrigger id="entity-select" aria-required="true">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField>
          <FormFieldLabel id="lookup-mode-label">How to look up the record</FormFieldLabel>
          <RadioGroup
            aria-labelledby="lookup-mode-label"
            defaultValue="multiple"
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="lookup-single" value="single" />
              <Label htmlFor="lookup-single" className="text-xs font-normal">
                Single record
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="lookup-multiple" value="multiple" />
              <Label htmlFor="lookup-multiple" className="text-xs font-normal">
                Multiple records
              </Label>
            </div>
          </RadioGroup>
        </FormField>

        <FormField>
          <SectionLabel>Filter</SectionLabel>
          <ConditionsEditor
            label="Filter"
            container="collapsible"
            fields={CONDITION_FIELDS}
            value={filter}
            onChange={setFilter}
            variables={VARIABLE_ITEMS}
            defaultTouched={['filter-incomplete']}
            showSummary
            strings={{ empty: 'No conditions. Every record is returned.' }}
          />
        </FormField>
      </PanelTabs>
    </NodePropertyPanel>
  );
}

// ── HTTP request: key-value pairs and repeatable cards ─────────────────────

interface Branch {
  id: string;
  name: string;
  condition: string;
}

export function HttpRequestPanel({ onClose }: { onClose: () => void }) {
  const [branches, setBranches] = useState<Branch[]>(() => [
    { id: newId('branch'), name: 'Success', condition: '$self.output.statusCode === 200' },
    { id: newId('branch'), name: 'Not found', condition: '$self.output.statusCode === 404' },
  ]);
  const focus = useRowFocus();
  const branchLimit = 10;
  const move = (from: number, to: number) =>
    setBranches((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<Globe />}
      nodeLabel="HTTP request"
      nodeCategory="Integrations · Repeatable rows"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <PanelTabs>
        {/* Method and URL are two fields, each with its own visible label. */}
        <div className="flex gap-2">
          <FormField className="w-24 shrink-0">
            <FormFieldLabel htmlFor="http-method">Method</FormFieldLabel>
            <Select defaultValue="get">
              <SelectTrigger id="http-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="get">GET</SelectItem>
                <SelectItem value="post">POST</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField className="min-w-0 flex-1">
            <FormFieldLabel htmlFor="http-url" required>
              URL
            </FormFieldLabel>
            <Input id="http-url" required defaultValue="https://api.example.com/accounts" />
          </FormField>
        </div>

        <KeyValueList
          title="Headers"
          itemName="header"
          limit={20}
          initialPairs={[
            { key: 'Authorization', value: 'Bearer {{token}}' },
            { key: 'Accept', value: 'application/json' },
          ]}
        />

        <FormField>
          <SectionLabel meta={`${branches.length} / ${branchLimit} branches`}>
            Response branches
          </SectionLabel>
          <p className="text-xs leading-5 text-muted-foreground">
            Checked in order. The first branch that matches wins.
          </p>
          <div ref={focus.listRef} className="flex flex-col gap-2">
            {branches.map((branch, position) => (
              <RepeatableCard
                key={branch.id}
                leading={
                  <RowDragHandle
                    label={`Reorder branch ${position + 1}`}
                    onMoveUp={position > 0 ? () => move(position, position - 1) : undefined}
                    onMoveDown={
                      position < branches.length - 1
                        ? () => move(position, position + 1)
                        : undefined
                    }
                  />
                }
                title={
                  <FormField>
                    <FormFieldLabel htmlFor={`${branch.id}-name`}>Branch name</FormFieldLabel>
                    <Input
                      id={`${branch.id}-name`}
                      data-row-first=""
                      value={branch.name}
                      onChange={(event) =>
                        setBranches((current) =>
                          current.map((item) =>
                            item.id === branch.id ? { ...item, name: event.target.value } : item
                          )
                        )
                      }
                    />
                  </FormField>
                }
                deleteLabel={`Remove branch ${position + 1}`}
                onDelete={() => {
                  focus.afterDelete(position);
                  setBranches((current) => current.filter((item) => item.id !== branch.id));
                }}
              >
                <FormField>
                  <FormFieldHeader
                    label="Condition"
                    htmlFor={`${branch.id}-condition`}
                    badge={<span className="font-mono text-xs text-muted-foreground">boolean</span>}
                    actions={
                      <InsertVariableAction
                        variables={VARIABLES}
                        strings={{
                          ariaLabel: `Insert variable into branch ${position + 1} condition`,
                        }}
                        onInsert={(inserted) =>
                          setBranches((current) =>
                            current.map((item) =>
                              item.id === branch.id
                                ? { ...item, condition: `${item.condition}${inserted}` }
                                : item
                            )
                          )
                        }
                      />
                    }
                  />
                  <Input
                    id={`${branch.id}-condition`}
                    className="font-mono"
                    value={branch.condition}
                    placeholder="Expression"
                    onChange={(event) =>
                      setBranches((current) =>
                        current.map((item) =>
                          item.id === branch.id ? { ...item, condition: event.target.value } : item
                        )
                      )
                    }
                  />
                </FormField>
              </RepeatableCard>
            ))}
            {branches.length === 0 && (
              <EmptyRows>No branches. The flow continues on any response.</EmptyRows>
            )}
          </div>
          <div>
            <AddRowButton
              ref={focus.addRef}
              disabled={branches.length >= branchLimit}
              onClick={() => {
                focus.afterAdd();
                setBranches((current) => [
                  ...current,
                  {
                    id: newId('branch'),
                    name: uniqueName(
                      'Branch ',
                      current.map((item) => item.name)
                    ),
                    condition: '',
                  },
                ]);
              }}
            >
              Add branch
            </AddRowButton>
          </div>
        </FormField>
      </PanelTabs>
    </NodePropertyPanel>
  );
}

// ── Form field behavior: rules ──────────────────────────────────────────────

const RULE_OUTCOMES: RuleOutcome[] = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
  { value: 'require', label: 'Require' },
];

// A constant, so the editor's rules stay memoised while typing.
const FIELD_RULES_STRINGS = { empty: 'No rules. The field always shows.' };

export function FieldRules({ label, initial }: { label: string; initial: () => Rule[] }) {
  const [rules, setRules] = useState(initial);
  return (
    <RulesEditor
      label={label}
      outcomes={RULE_OUTCOMES}
      fields={CONDITION_FIELDS}
      variables={VARIABLE_ITEMS}
      value={rules}
      onChange={setRules}
      strings={FIELD_RULES_STRINGS}
    />
  );
}

export function FormRulesPanel({ onClose }: { onClose: () => void }) {
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<UserCheck />}
      nodeLabel="Finance approval"
      nodeCategory="Forms · Repeatable rows"
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <PanelTabs>
        <FormField>
          <FormFieldLabel htmlFor="form-field-label">Field</FormFieldLabel>
          <Input id="form-field-label" defaultValue="Approval notes" />
        </FormField>

        <FormField>
          <SectionLabel>Field behavior</SectionLabel>
          <p className="text-xs leading-5 text-muted-foreground">
            All matching rules apply, and their outcomes combine.
          </p>
          <FieldRules
            label="Field behavior"
            initial={() => [
              createRule({
                outcome: 'show',
                conditions: createConditionGroup('all', [
                  createCondition({ field: 'amount', operator: 'greaterThan', value: '10000' }),
                ]),
              }),
              createRule({ outcome: 'require', conditions: createConditionGroup('all') }),
            ]}
          />
        </FormField>
      </PanelTabs>
    </NodePropertyPanel>
  );
}
