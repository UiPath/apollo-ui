import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  FormFieldDescription,
  FormFieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@uipath/apollo-wind';
import { Database, Pencil } from 'lucide-react';
import { type FormEvent, useId, useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import type { JsonValue } from '../JsonTree';
import type { NodeVariableDetails, NodeVariableType } from './NodeVariablesPanel.types';

const VARIABLE_TYPES: readonly NodeVariableType[] = [
  'string',
  'number',
  'boolean',
  'object',
  'array',
];

/** A variable id: a letter or underscore, then letters, digits, or underscores. */
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The default value as the text the field edits. JSON for containers. */
function draftFor(type: NodeVariableType, value: JsonValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (type === 'object' || type === 'array') return JSON.stringify(value, null, 2);
  return String(value);
}

/** Parses the drafted default value, or reports that it doesn't match the type. */
function parseDefault(
  type: NodeVariableType,
  draft: string,
  checked: boolean | undefined
): { value: JsonValue | undefined } | { error: true } {
  // Untouched stays unset; the default is optional.
  if (type === 'boolean') return { value: checked };
  const text = draft.trim();
  if (!text) return { value: undefined };
  if (type === 'string') return { value: draft };
  if (type === 'number') {
    const value = Number(text);
    return Number.isFinite(value) ? { value } : { error: true };
  }
  try {
    const value = JSON.parse(text) as JsonValue;
    const isArray = Array.isArray(value);
    const isObject = typeof value === 'object' && value !== null && !isArray;
    return (type === 'array' ? isArray : isObject) ? { value } : { error: true };
  } catch {
    return { error: true };
  }
}

export interface NodeVariableEditDialogProps {
  /** The variable being edited. */
  variable: NodeVariableDetails;
  /** Names of the other variables, which the id can't take. */
  takenNames: ReadonlySet<string>;
  /** Builds the reference shown under the id, e.g. `$vars.flowTest`. */
  referenceFor: (id: string) => string;
  onSave: (next: NodeVariableDetails) => void;
  onClose: () => void;
}

/**
 * The "Edit variable" dialog: the variable's id (locked until the pencil is
 * pressed), data type, description, and default value. It opens on mount, so
 * the host renders it only while a variable is being edited.
 */
export function NodeVariableEditDialog({
  variable,
  takenNames,
  referenceFor,
  onSave,
  onClose,
}: NodeVariableEditDialogProps) {
  const { _ } = useSafeLingui();
  const fieldId = useId();
  const idInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState(variable.id);
  const [editingId, setEditingId] = useState(false);
  const [type, setType] = useState<NodeVariableType>(variable.type);
  const [description, setDescription] = useState(variable.description ?? '');
  const [draft, setDraftState] = useState(() => draftFor(variable.type, variable.defaultValue));
  // A Boolean default has three states: unset (undefined), true, and false.
  // It stays unset until the switch is used, and Clear returns it there.
  const [checked, setCheckedState] = useState<boolean | undefined>(
    typeof variable.defaultValue === 'boolean' ? variable.defaultValue : undefined
  );
  // Any edit to the default, even one typed and then deleted, marks it changed.
  // Until then it saves exactly as it came in (see submit).
  const [defaultEdited, setDefaultEdited] = useState(false);
  const setDraft = (next: string) => {
    setDraftState(next);
    setDefaultEdited(true);
  };
  const setChecked = (next: boolean | undefined) => {
    setCheckedState(next);
    setDefaultEdited(true);
  };
  // An explicit `null` default has no text form; the empty field says so.
  const nullPlaceholder = variable.defaultValue === null && !defaultEdited ? 'null' : undefined;

  const trimmedId = id.trim();
  const idError = !IDENTIFIER_PATTERN.test(trimmedId)
    ? _({
        id: 'canvas.node_variables_panel.edit_id_pattern_error',
        message: 'Use a letter or underscore first, then letters, numbers, or underscores.',
      })
    : trimmedId !== variable.id && takenNames.has(trimmedId)
      ? _({
          id: 'canvas.node_variables_panel.edit_id_taken_error',
          message: 'A variable named {name} already exists.',
          values: { name: trimmedId },
        })
      : undefined;
  const parsed = parseDefault(type, draft, checked);
  const defaultError =
    'error' in parsed
      ? {
          number: _({
            id: 'canvas.node_variables_panel.edit_default_number_error',
            message: 'Enter a number.',
          }),
          object: _({
            id: 'canvas.node_variables_panel.edit_default_object_error',
            message: 'Enter a valid JSON object.',
          }),
          array: _({
            id: 'canvas.node_variables_panel.edit_default_array_error',
            message: 'Enter a valid JSON array.',
          }),
        }[type as 'number' | 'object' | 'array']
      : undefined;

  const changeType = (next: NodeVariableType) => {
    setType(next);
    // Each type has its own default editor, and a value typed for one rarely fits another.
    setDraft('');
    setChecked(undefined);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (idError || 'error' in parsed) return;
    // An untouched default saves exactly as it came in, so values the editor
    // can't show as text (an explicit `null`) aren't lost or rewritten. Once
    // edited, the field's content wins, so clearing it clears the default.
    const untouched = !defaultEdited;
    onSave({
      id: trimmedId,
      type,
      description: description.trim() || undefined,
      defaultValue: untouched ? variable.defaultValue : parsed.value,
    });
  };

  const typeLabel: Record<NodeVariableType, string> = {
    string: _({ id: 'canvas.node_variables_panel.type_string', message: 'String' }),
    number: _({ id: 'canvas.node_variables_panel.type_number', message: 'Number' }),
    boolean: _({ id: 'canvas.node_variables_panel.type_boolean', message: 'Boolean' }),
    object: _({ id: 'canvas.node_variables_panel.type_object', message: 'Object' }),
    array: _({ id: 'canvas.node_variables_panel.type_array', message: 'Array' }),
  };
  const defaultLabel = _({
    id: 'canvas.node_variables_panel.edit_default_label',
    message: 'Default value',
  });
  // The reference updates as the id is edited, but only for an id that would resolve.
  const reference = referenceFor(IDENTIFIER_PATTERN.test(trimmedId) ? trimmedId : variable.id);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // The fields carry their own hints; there is no dialog-level description.
        aria-describedby={undefined}
        // Keys stay in the dialog: no canvas shortcuts while a field is being typed in.
        onKeyDown={(event) => event.stopPropagation()}
      >
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database size={16} aria-hidden="true" className="text-foreground-muted" />
              {_({ id: 'canvas.node_variables_panel.edit_title', message: 'Edit variable' })}
            </DialogTitle>
          </DialogHeader>

          <FormField>
            <FormFieldLabel htmlFor={`${fieldId}-id`}>
              {_({ id: 'canvas.node_variables_panel.edit_id_label', message: 'ID' })}
            </FormFieldLabel>
            <div className="flex items-start gap-2">
              <Input
                ref={idInputRef}
                id={`${fieldId}-id`}
                value={id}
                // Locked until the pencil is pressed, so a rename is a deliberate step.
                disabled={!editingId}
                onChange={(event) => setId(event.target.value)}
                error={editingId ? idError : undefined}
                aria-describedby={`${fieldId}-id-hint`}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 font-mono"
              />
              {!editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={_({
                    id: 'canvas.node_variables_panel.edit_id_action',
                    message: 'Edit ID',
                  })}
                  onClick={() => {
                    setEditingId(true);
                    requestAnimationFrame(() => idInputRef.current?.select());
                  }}
                  className="shrink-0"
                >
                  <Pencil />
                </Button>
              )}
            </div>
            <FormFieldDescription id={`${fieldId}-id-hint`}>
              {_({
                id: 'canvas.node_variables_panel.edit_id_hint',
                message: 'Used in expressions as',
              })}{' '}
              <code className="break-all rounded bg-surface-overlay px-1 py-0.5 font-mono text-xs">
                {reference}
              </code>
            </FormFieldDescription>
          </FormField>

          <FormField>
            <FormFieldLabel htmlFor={`${fieldId}-type`}>
              {_({ id: 'canvas.node_variables_panel.edit_type_label', message: 'Data type' })}
            </FormFieldLabel>
            <Select value={type} onValueChange={(next) => changeType(next as NodeVariableType)}>
              <SelectTrigger id={`${fieldId}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIABLE_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {typeLabel[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField>
            <FormFieldLabel htmlFor={`${fieldId}-description`}>
              {_({
                id: 'canvas.node_variables_panel.edit_description_label',
                message: 'Description',
              })}
            </FormFieldLabel>
            <Textarea
              id={`${fieldId}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={_({
                id: 'canvas.node_variables_panel.edit_description_placeholder',
                message: 'Helpful description of what this variable represents',
              })}
              rows={2}
            />
          </FormField>

          {type === 'boolean' ? (
            <FormField>
              <FormFieldLabel htmlFor={`${fieldId}-default`}>{defaultLabel}</FormFieldLabel>
              <div className="flex items-center gap-2">
                <Switch
                  id={`${fieldId}-default`}
                  checked={checked ?? false}
                  onCheckedChange={setChecked}
                  aria-describedby={`${fieldId}-default-hint`}
                />
                {checked !== undefined && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="2xs"
                    onClick={() => setChecked(undefined)}
                    aria-label={_({
                      id: 'canvas.node_variables_panel.edit_default_clear_label',
                      message: 'Clear default value',
                    })}
                  >
                    {_({ id: 'canvas.node_variables_panel.edit_default_clear', message: 'Clear' })}
                  </Button>
                )}
              </div>
              <FormFieldDescription id={`${fieldId}-default-hint`}>
                {checked === undefined
                  ? _({
                      id: 'canvas.node_variables_panel.edit_default_boolean_unset_hint',
                      message: 'No default. Toggle on for true, off for false',
                    })
                  : _({
                      id: 'canvas.node_variables_panel.edit_default_boolean_hint',
                      message: 'Toggle on for true, off for false',
                    })}
              </FormFieldDescription>
            </FormField>
          ) : (
            <FormField>
              <FormFieldLabel htmlFor={`${fieldId}-default`}>{defaultLabel}</FormFieldLabel>
              {type === 'object' || type === 'array' ? (
                <Textarea
                  id={`${fieldId}-default`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    nullPlaceholder ?? (type === 'object' ? '{"key": "value"}' : '[1, 2, 3]')
                  }
                  error={defaultError}
                  rows={4}
                  spellCheck={false}
                  className="font-mono"
                />
              ) : (
                <Input
                  id={`${fieldId}-default`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  inputMode={type === 'number' ? 'decimal' : undefined}
                  placeholder={
                    nullPlaceholder ??
                    (type === 'number'
                      ? '0'
                      : _({
                          id: 'canvas.node_variables_panel.edit_default_string_placeholder',
                          message: 'Enter text value',
                        }))
                  }
                  error={defaultError}
                  autoComplete="off"
                />
              )}
            </FormField>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {_({ id: 'canvas.node_variables_panel.edit_cancel', message: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={!!idError || !!defaultError}>
              {_({ id: 'canvas.node_variables_panel.edit_save', message: 'Save' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
