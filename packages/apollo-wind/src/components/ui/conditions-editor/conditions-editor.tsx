import { MoreVertical, Trash2 } from 'lucide-react';
import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ValueModeStrings } from '@/components/ui/field-addons';
import { FormFieldError } from '@/components/ui/form-field';
import type { MultiSelectStrings } from '@/components/ui/multi-select';
import {
  AddRowButton,
  CollapsibleRowGroup,
  EmptyRows,
  type GroupModeOption,
  GroupModeToggle,
  type MatchMode,
  useRowFocus,
} from '@/components/ui/row-groups';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import { ConditionRow, ConditionSeparator } from './condition-row';
import {
  type ConditionPatch,
  ConditionsEditorContext,
  type ConditionsEditorContextValue,
  type RenderConditionValue,
  useConditionsEditor,
} from './context';
import {
  type Condition,
  type ConditionGroup,
  type ConditionNode,
  type ConditionValueMode,
  collectIds,
  countConditions,
  createCondition,
  createConditionGroup,
  numberConditions,
  numberGroups,
  removeNode,
  updateNode,
} from './model';
import { defaultValueModes, describeGroup, hasShownProblems } from './status';
import { type ConditionsEditorStrings, DEFAULT_CONDITIONS_EDITOR_STRINGS } from './strings';
import {
  type ConditionField,
  type ConditionOperators,
  DEFAULT_CONDITION_OPERATORS,
} from './vocabulary';

export interface ConditionsEditorProps {
  value: ConditionGroup;
  onChange: (next: ConditionGroup) => void;
  /** Names the top group for assistive technology, e.g. "Rule 1 conditions". */
  label: string;
  fields: readonly ConditionField[];
  /** The operators per field type. Defaults to the English set. */
  operators?: ConditionOperators;
  /**
   * The value modes each value's menu lists, in order. One mode hides the menu. Defaults to Fixed
   * value and Expression, plus Variable when `variables` is given.
   */
  valueModes?: readonly ConditionValueMode[];
  /** What Variable mode picks from. */
  variables?: VariablePickerItem[];
  /** Replaces a value's control. See `RenderConditionValue`. */
  renderValue?: RenderConditionValue;
  /** How many levels of groups may nest inside the top group. 0 turns off Add group. */
  maxDepth?: number;
  /**
   * Whether the top group's All / Any switch can show, which it does once the group holds two or
   * more items. Turn it off for a list that always matches all. Nested groups always show theirs.
   */
  showMatchMode?: boolean;
  /**
   * `card` draws a bordered box, `collapsible` adds a header that collapses the rows, and `plain`
   * draws nothing, for use inside another container such as a rule.
   */
  container?: 'card' | 'collapsible' | 'plain';
  /** Whether a `collapsible` editor starts open. */
  defaultOpen?: boolean;
  /** Show the plain-language reading below the rows. */
  showSummary?: boolean;
  /** Show every incomplete row's message, as after a submit. */
  forceErrors?: boolean;
  /**
   * Ids of rows to treat as already left, so their messages show, e.g. when restoring a draft. Read
   * on mount: give the editor a new `key` to start over, such as when it shows another rule.
   */
  defaultTouched?: readonly string[];
  disabled?: boolean;
  className?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ConditionsEditorStrings>;
  /** Overrides for the value-mode menu, indicator, and variable control. */
  valueModeStrings?: Partial<ValueModeStrings>;
  /** Overrides for the options control of an operator that takes several. */
  multiSelectStrings?: Partial<MultiSelectStrings>;
}

/**
 * Edits a tree of conditions: flat lists, nested groups, collapsible filters, and a rule's
 * conditions. Controlled: it holds no conditions of its own, only which rows focus has left.
 */
export function ConditionsEditor({
  value,
  onChange,
  label,
  fields,
  operators = DEFAULT_CONDITION_OPERATORS,
  valueModes,
  variables,
  renderValue,
  maxDepth = 1,
  showMatchMode = true,
  container = 'card',
  defaultOpen,
  showSummary = false,
  forceErrors = false,
  defaultTouched,
  disabled = false,
  className,
  strings,
  valueModeStrings,
  multiSelectStrings,
}: ConditionsEditorProps) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(() => new Set(defaultTouched));
  const markTouched = React.useCallback(
    (id: string) => setTouched((current) => new Set(current).add(id)),
    []
  );
  // Forget rows that are gone, so a removed row's id never brings its message back.
  React.useEffect(() => {
    setTouched((current) => {
      const ids = collectIds(value);
      const kept = [...current].filter((id) => ids.has(id));
      return kept.length === current.size ? current : new Set(kept);
    });
  }, [value]);

  // The actions read the latest tree, so they stay stable and memoised rows stay put.
  const latest = React.useRef({ value, onChange });
  latest.current = { value, onChange };
  const actions = React.useMemo(() => {
    const apply = (next: (root: ConditionGroup) => ConditionGroup) =>
      latest.current.onChange(next(latest.current.value));
    return {
      updateCondition: (id: string, patch: ConditionPatch) =>
        apply((root) => updateNode(root, id, (node) => ({ ...node, ...patch }) as Condition)),
      setGroupMode: (id: string, mode: MatchMode) =>
        apply((root) => updateNode(root, id, (node) => ({ ...(node as ConditionGroup), mode }))),
      addChild: (groupId: string, child: ConditionNode) =>
        apply((root) =>
          updateNode(root, groupId, (node) => ({
            ...(node as ConditionGroup),
            children: [...(node as ConditionGroup).children, child],
          }))
        ),
      removeChild: (id: string) => apply((root) => removeNode(root, id)),
    };
  }, []);

  const text = React.useMemo(
    () => ({ ...DEFAULT_CONDITIONS_EDITOR_STRINGS, ...strings }),
    [strings]
  );
  const modes = valueModes ?? defaultValueModes(variables);
  const editor = React.useMemo<ConditionsEditorContextValue>(
    () => ({
      fields,
      operators,
      valueModes: modes,
      variables,
      renderValue,
      strings: text,
      valueModeStrings,
      multiSelectStrings,
      disabled,
      forceErrors,
      touched,
      markTouched,
      ...actions,
    }),
    [
      fields,
      operators,
      modes,
      variables,
      renderValue,
      text,
      valueModeStrings,
      multiSelectStrings,
      disabled,
      forceErrors,
      touched,
      markTouched,
      actions,
    ]
  );

  const matchModes = React.useMemo<GroupModeOption<MatchMode>[]>(
    () => [
      { value: 'all', label: text.matchAll },
      { value: 'any', label: text.matchAny },
    ],
    [text]
  );
  const summary =
    showSummary || container === 'collapsible' ? describeGroup(value, editor, text) : '';
  const groupError = hasShownProblems(value, editor, (id) => forceErrors || touched.has(id))
    ? text.incomplete
    : undefined;
  const groupErrorId = React.useId();

  const body = (
    <GroupBody
      node={value}
      depth={0}
      maxDepth={maxDepth}
      showMatchMode={showMatchMode}
      matchModes={matchModes}
      groupLabel={label}
      conditionNumbers={numberConditions(value)}
      groupNumbers={numberGroups(value)}
      describedBy={groupError && container !== 'collapsible' ? groupErrorId : undefined}
      footer={
        showSummary && summary ? (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">{text.summaryLabel} </span>
            {summary}
          </p>
        ) : null
      }
    />
  );

  return (
    <ConditionsEditorContext.Provider value={editor}>
      {container === 'collapsible' ? (
        <div className={className}>
          <CollapsibleRowGroup
            summary={text.count(countConditions(value))}
            detail={summary}
            error={groupError}
            defaultOpen={defaultOpen}
          >
            {body}
          </CollapsibleRowGroup>
        </div>
      ) : (
        <div className={cn('flex min-w-0 flex-col', className)}>
          <div
            className={cn(
              container === 'card' && 'rounded-lg border border-border bg-card p-3',
              container === 'card' && groupError && 'border-error'
            )}
          >
            {body}
          </div>
          {groupError && <FormFieldError id={groupErrorId}>{groupError}</FormFieldError>}
        </div>
      )}
    </ConditionsEditorContext.Provider>
  );
}

function GroupBody({
  node,
  depth,
  maxDepth,
  showMatchMode,
  matchModes,
  groupLabel,
  conditionNumbers,
  groupNumbers,
  describedBy,
  onDeleteGroup,
  footer,
}: {
  node: ConditionGroup;
  depth: number;
  maxDepth: number;
  /** The host's switch for the top group; nested groups ignore it. */
  showMatchMode: boolean;
  matchModes: readonly GroupModeOption<MatchMode>[];
  groupLabel: string;
  /** Each condition's 1-based position across the whole tree, in reading order. */
  conditionNumbers: Map<string, number>;
  /** Each nested group's 1-based position across the whole tree, in reading order. */
  groupNumbers: Map<string, number>;
  describedBy?: string;
  onDeleteGroup?: () => void;
  footer?: React.ReactNode;
}) {
  const { strings, disabled, setGroupMode, addChild, removeChild } = useConditionsEditor();
  const focus = useRowFocus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const actionsRef = React.useRef<HTMLButtonElement>(null);
  const nested = depth > 0;
  // A nested group exists to combine differently, so its mode always shows. The top group's only
  // means something once there are two things to combine.
  const matchModeShown = nested || (showMatchMode && node.children.length > 1);

  const add = (child: ConditionNode) => {
    focus.afterAdd();
    addChild(node.id, child);
  };
  const { afterDelete } = focus;
  const deleteChild = React.useCallback(
    (id: string, position: number) => {
      afterDelete(position);
      removeChild(id);
    },
    [afterDelete, removeChild]
  );

  return (
    // A named group, so repeated controls such as "Condition 1 Field" keep their context.
    <fieldset
      aria-label={groupLabel}
      aria-describedby={describedBy}
      data-row={nested ? '' : undefined}
      className={cn(
        'm-0 flex min-w-0 flex-col gap-3 border-0 p-0',
        nested && 'border-l-2 border-solid border-border pl-3'
      )}
    >
      {matchModeShown && (
        <div className="flex items-center gap-2">
          <GroupModeToggle
            modes={matchModes}
            value={node.mode}
            disabled={disabled}
            strings={{ label: strings.groupMatchMode(groupLabel) }}
            onValueChange={(mode) => setGroupMode(node.id, mode)}
          />
          {nested && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={actionsRef}
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon
                  disabled={disabled}
                  data-row-delete=""
                  aria-label={strings.groupActions(groupLabel)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  className="text-error focus:text-error"
                  onSelect={() => {
                    if (node.children.length > 0) setConfirmOpen(true);
                    else onDeleteGroup?.();
                  }}
                >
                  <Trash2 /> {strings.deleteGroup}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Its own container, so the list's gap widens and the separators go once rows fit on one
          line: a container query styles what is inside the container, not the container. */}
      <div className="@container">
        <div ref={focus.listRef} className="flex flex-col gap-2 @lg:gap-3">
          {node.children.length === 0 ? (
            <EmptyRows>{nested ? strings.emptyGroup : strings.empty}</EmptyRows>
          ) : (
            node.children.map((child, position) =>
              child.kind === 'group' ? (
                <GroupBody
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  showMatchMode={showMatchMode}
                  matchModes={matchModes}
                  groupLabel={strings.groupName(groupNumbers.get(child.id) ?? position + 1)}
                  conditionNumbers={conditionNumbers}
                  groupNumbers={groupNumbers}
                  onDeleteGroup={() => deleteChild(child.id, position)}
                />
              ) : (
                <React.Fragment key={child.id}>
                  {node.children[position - 1]?.kind === 'condition' && <ConditionSeparator />}
                  <ConditionRow
                    index={conditionNumbers.get(child.id) ?? position + 1}
                    position={position}
                    condition={child}
                    onDelete={deleteChild}
                  />
                </React.Fragment>
              )
            )
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <AddRowButton ref={focus.addRef} disabled={disabled} onClick={() => add(createCondition())}>
          {strings.addCondition}
        </AddRowButton>
        {depth < maxDepth && (
          <AddRowButton
            disabled={disabled}
            onClick={() => add(createConditionGroup('all', [createCondition()]))}
          >
            {strings.addGroup}
          </AddRowButton>
        )}
      </div>
      {footer}

      {nested && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent
            // The dialog opens from a menu item that is gone by now, so Cancel returns to the menu's
            // button. After a delete the group is gone too, and the list has already moved focus.
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (actionsRef.current?.isConnected) actionsRef.current.focus();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{strings.deleteGroupTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {strings.deleteGroupDescription(countConditions(node))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{strings.cancel}</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: 'destructive' })}
                onClick={() => onDeleteGroup?.()}
              >
                {strings.deleteGroup}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </fieldset>
  );
}
