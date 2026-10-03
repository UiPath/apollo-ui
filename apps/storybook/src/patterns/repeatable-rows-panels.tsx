import { Database, Globe, UserCheck } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { InsertVariableAction } from '@/components/ui/field-actions';
import { FormFieldLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodePropertyPanel } from '../../../../packages/apollo-react/src/canvas/components/NodePropertyPanel';
import {
  AddRowButton,
  ConditionEditor,
  type ConditionGroup,
  condition,
  EmptyRows,
  group,
  KeyValueList,
  newId,
  RepeatableCard,
  RowDeleteButton,
  RowDragHandle,
  RowGroup,
  uniqueName,
  useRowFocus,
  type VariableOption,
} from './repeatable-row-primitives';

/**
 * Right-panel examples for the Repeatable Rows guidance page. Each one is plugged into
 * the Flow workbench through `FullWorkbenchComposition`'s `renderRightPanel`, so the
 * layouts are reviewed at real panel width, next to tabs and other fields.
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

function SectionLabel({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs font-semibold text-foreground">{children}</span>
      {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
    </div>
  );
}

// ── Read entity records: collapsible condition group ────────────────────────

export function EntityFilterPanel({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<ConditionGroup>(() =>
    group('any', [
      condition({
        field: 'accountId',
        operator: 'equals',
        value: '$vars.accountId',
        mode: 'expression',
      }),
      // Visited and left incomplete, to show the row and group messages.
      condition({ touched: true }),
      group('all', [
        condition({ field: 'createdBy', operator: 'equals', value: 'admin' }),
        condition({ field: 'status', operator: 'isOneOf', values: ['active', 'onHold'] }),
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
        <div className="grid gap-1.5">
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
        </div>

        <div className="grid gap-2">
          <span id="lookup-mode-label" className="text-xs font-medium text-foreground">
            How to look up the record
          </span>
          <RadioGroup
            aria-labelledby="lookup-mode-label"
            defaultValue="multiple"
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="lookup-single" value="single" />
              <label htmlFor="lookup-single" className="text-xs">
                Single record
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="lookup-multiple" value="multiple" />
              <label htmlFor="lookup-multiple" className="text-xs">
                Multiple records
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-1.5">
          <SectionLabel>Filter</SectionLabel>
          <ConditionEditor
            label="Filter"
            container="collapsible"
            value={filter}
            onChange={setFilter}
            variables={VARIABLES}
            showSummary
            emptyText="No conditions. Every record is returned."
          />
        </div>
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
        <div className="grid gap-1.5">
          <FormFieldLabel htmlFor="http-url" required>
            URL
          </FormFieldLabel>
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <Select defaultValue="get">
                <SelectTrigger aria-label="Method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get">GET</SelectItem>
                  <SelectItem value="post">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input id="http-url" required defaultValue="https://api.example.com/accounts" />
          </div>
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

        <div className="flex flex-col gap-2">
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
                  <Input
                    data-row-first=""
                    aria-label={`Branch ${position + 1} name`}
                    value={branch.name}
                    onChange={(event) =>
                      setBranches((current) =>
                        current.map((item) =>
                          item.id === branch.id ? { ...item, name: event.target.value } : item
                        )
                      )
                    }
                  />
                }
                deleteLabel={`Remove branch ${position + 1}`}
                onDelete={() => {
                  focus.afterDelete(position);
                  setBranches((current) => current.filter((item) => item.id !== branch.id));
                }}
              >
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-2">
                    <FormFieldLabel htmlFor={`${branch.id}-condition`} className="flex-1">
                      Condition{' '}
                      <span className="ml-1 font-mono text-xs text-muted-foreground">boolean</span>
                    </FormFieldLabel>
                    <InsertVariableAction
                      variables={VARIABLES}
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
                  </div>
                  <Input
                    id={`${branch.id}-condition`}
                    className="font-mono text-xs"
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
                </div>
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
        </div>
      </PanelTabs>
    </NodePropertyPanel>
  );
}

// ── Form field behavior: rules ──────────────────────────────────────────────

interface Rule {
  id: string;
  outcome: string;
  conditions: ConditionGroup;
}

export function RuleList({
  initialRules,
  layout = 'stacked',
}: {
  initialRules: Omit<Rule, 'id'>[];
  layout?: 'inline' | 'stacked';
}) {
  const [rules, setRules] = useState<Rule[]>(() =>
    initialRules.map((rule) => ({ ...rule, id: newId('rule') }))
  );
  const focus = useRowFocus();
  const updateRule = (id: string, patch: Partial<Rule>) =>
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));

  return (
    <div className="flex flex-col gap-2">
      <div ref={focus.listRef} className="flex flex-col gap-2">
        {rules.map((rule, position) => (
          <RowGroup key={rule.id} rowProps>
            <div className="flex items-center gap-2">
              <div className="w-28 shrink-0">
                <Select
                  value={rule.outcome}
                  onValueChange={(outcome) => updateRule(rule.id, { outcome })}
                >
                  <SelectTrigger data-row-first="" aria-label={`Rule ${position + 1} outcome`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Show</SelectItem>
                    <SelectItem value="hide">Hide</SelectItem>
                    <SelectItem value="require">Require</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="flex-1 text-xs text-muted-foreground">when</span>
              <RowDeleteButton
                label={`Remove rule ${position + 1}`}
                onClick={() => {
                  focus.afterDelete(position);
                  setRules((current) => current.filter((item) => item.id !== rule.id));
                }}
              />
            </div>
            <div className="border-l-2 border-border pl-3">
              <ConditionEditor
                label={`Rule ${position + 1} conditions`}
                container="plain"
                layout={layout}
                maxDepth={0}
                matchMode={rule.conditions.children.length > 1}
                value={rule.conditions}
                onChange={(conditions) => updateRule(rule.id, { conditions })}
                emptyText="No conditions. This rule always applies."
              />
            </div>
          </RowGroup>
        ))}
        {rules.length === 0 && <EmptyRows>No rules. The field always shows.</EmptyRows>}
      </div>
      <div>
        <AddRowButton
          ref={focus.addRef}
          onClick={() => {
            focus.afterAdd();
            setRules((current) => [
              ...current,
              { id: newId('rule'), outcome: 'show', conditions: group('all', [condition()]) },
            ]);
          }}
        >
          Add rule
        </AddRowButton>
      </div>
    </div>
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
        <div className="grid gap-1.5">
          <FormFieldLabel htmlFor="form-field-label">Field</FormFieldLabel>
          <Input id="form-field-label" defaultValue="Approval notes" />
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Field behavior</SectionLabel>
          <p className="text-xs leading-5 text-muted-foreground">
            All matching rules apply, and their outcomes combine.
          </p>
          <RuleList
            initialRules={[
              {
                outcome: 'show',
                conditions: group('all', [
                  condition({ field: 'amount', operator: 'greaterThan', value: '10000' }),
                ]),
              },
              { outcome: 'require', conditions: group('all') },
            ]}
          />
        </div>
      </PanelTabs>
    </NodePropertyPanel>
  );
}
