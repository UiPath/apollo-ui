import { Eraser, type LucideIcon } from 'lucide-react';
import type * as React from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import {
  AiAssistAction,
  type AiAssistActionStrings,
} from '@/components/ui/field-actions/ai-assist-action';
import {
  InsertVariableAction,
  type InsertVariableActionStrings,
} from '@/components/ui/field-actions/insert-variable-action';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import type { FieldMetadata, FormPlugin, ValueModeId } from './form-schema';
import type { ClearActionStrings, MetadataFormStrings } from './form-strings';
import type { DecodedValue, ValueModeControlHandle } from './value-modes';

/** What an action sees of its field. Read when the action runs, so it is always current. */
export interface FieldActionContext {
  field: FieldMetadata;
  name: string;
  /** The stored value. */
  value: unknown;
  /** Writes the stored value. Never `undefined`, which the form reads as unset: clear with `null`. */
  setValue(value: unknown): void;
  /** Empties the value, keeping its mode; a field without value modes is set to `null`. */
  clear(): void;
  /** Whether the value is empty, decoded first on a field with `valueModes`. */
  empty: boolean;
  disabled: boolean;
  /** The active value control, for focus and caret insertion. */
  control: ValueModeControlHandle | null;
  /** Whether the active control takes text at its caret. */
  insertable: boolean;
  form: UseFormReturn<FieldValues>;
  /** The form's strings, every plugin's over the English defaults. */
  strings: MetadataFormStrings;
  /** The decoded value. Only on a field with `valueModes`. */
  mode?: DecodedValue;
  /**
   * Writes `inner` in `mode`. With `confirm`, a non-empty value is replaced only once the user
   * confirms, in the lossy-switch dialog worded as `confirm` gives. Only on a field with
   * `valueModes`.
   */
  setModeValue?(
    mode: ValueModeId,
    inner: unknown,
    options?: { confirm?: FieldActionConfirm }
  ): void;
}

/** The wording of a confirmation; each part defaults to the lossy-switch dialog's. */
export interface FieldActionConfirm {
  title?: string;
  description?: string;
  confirmLabel?: string;
}

/** An action behind the field's label. */
export interface FieldHeaderAction {
  id: string;
  render(ctx: FieldActionContext): React.ReactNode;
}

/** A row of the field's trailing menu, below its modes. */
export interface FieldMenuAction {
  id: string;
  label: string | ((ctx: FieldActionContext) => string);
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?(ctx: FieldActionContext): boolean;
  onSelect(ctx: FieldActionContext): void;
}

/** A variable Insert variable offers, rendered as supplied. */
export type ValueModeVariable = VariablePickerItem;

/** The variables to offer. A function is called when a picker opens, never during render. */
export type FieldActionVariables =
  | ValueModeVariable[]
  | ((ctx: { field: FieldMetadata }) => ValueModeVariable[]);

/**
 * Generates a value from a prompt. Resolving with a value writes it, in `mode` or else the mode
 * the field is in when it resolves; resolving with nothing writes nothing.
 */
export type FieldActionGenerate = (
  request: { prompt: string },
  ctx: FieldActionContext
  // biome-ignore lint/suspicious/noConfusingVoidType: an `async` generator that writes nothing returns `Promise<void>`
) => Promise<{ mode?: ValueModeId; value: unknown } | undefined | void>;

export interface FieldActionsPluginConfig {
  /** Header actions by id, in the order fields list them. */
  header?: Record<string, FieldHeaderAction>;
  /** Menu actions by id. `clear` is registered unless a plugin replaces it. */
  menu?: Record<string, FieldMenuAction>;
}

/** Every plugin's `fieldActions` over the default `clear`, later plugins winning by id. */
export interface FieldActionRegistry {
  header: Record<string, FieldHeaderAction>;
  menu: Record<string, FieldMenuAction>;
}

// ============================================================================
// Built-in actions — each factory takes the configuration its action needs
// ============================================================================

export interface InsertVariableActionOptions {
  variables: FieldActionVariables;
  /**
   * How a picked reference is written at the caret, such as `{{ ref }}` inside fixed-value text.
   * A field that switches to `expression` or `variable` to take the reference gets it as picked.
   */
  formatReference?: (reference: string, ctx: { field: FieldMetadata; mode: ValueModeId }) => string;
  strings?: Partial<InsertVariableActionStrings>;
  /** Defaults to `insert-variable`. */
  id?: string;
}

function offers(ctx: FieldActionContext, mode: ValueModeId) {
  return !!ctx.setModeValue && !!ctx.field.valueModes?.modes.includes(mode);
}

// A fixed number or boolean has nothing a reference could be merged into, so replacing it with one
// is the expected result of Insert and does not ask.
const REPLACED_WITHOUT_ASKING = new Set(['number', 'boolean', 'switch', 'checkbox']);

/**
 * Where a picked variable goes: at the caret of a control that takes text, else as the whole value
 * in `expression` or `variable` mode, whichever the field offers first, asking before it replaces
 * a value. A control that takes text never has its value replaced.
 */
function insertTarget(
  ctx: FieldActionContext,
  formatReference: InsertVariableActionOptions['formatReference'],
  text: InsertVariableActionStrings
): ((reference: string) => void) | undefined {
  // Resolved again at pick time, so a field disabled while the picker was open takes nothing.
  if (ctx.disabled) return undefined;
  if (ctx.insertable) {
    const insertText = ctx.control?.insertText;
    if (!insertText) return undefined;
    const mode = ctx.mode?.mode ?? 'literal';
    return (reference) =>
      insertText(formatReference?.(reference, { field: ctx.field, mode }) ?? reference);
  }
  const confirm =
    ctx.mode?.mode === 'literal' && REPLACED_WITHOUT_ASKING.has(ctx.field.type)
      ? undefined
      : {
          title: text.replaceTitle,
          description: text.replaceDescription,
          confirmLabel: text.replaceConfirm,
        };
  for (const mode of ['expression', 'variable']) {
    if (offers(ctx, mode)) {
      return (reference) => ctx.setModeValue?.(mode, reference, { confirm });
    }
  }
  return undefined;
}

/** Insert variable: a variable picker behind the label that writes the picked reference. */
export function createInsertVariableAction({
  variables,
  formatReference,
  strings,
  id = 'insert-variable',
}: InsertVariableActionOptions): FieldHeaderAction {
  return {
    id,
    render: (ctx) => {
      const text = { ...ctx.strings.insertVariable, ...strings };
      const insert = insertTarget(ctx, formatReference, text);
      return (
        <InsertVariableAction
          variables={
            typeof variables === 'function' ? () => variables({ field: ctx.field }) : variables
          }
          // Resolved at pick time: the mode or control may have changed since render.
          onInsert={
            insert && ((reference) => insertTarget(ctx, formatReference, text)?.(reference))
          }
          disabled={ctx.disabled}
          strings={text}
        />
      );
    },
  };
}

export interface AiAssistActionOptions {
  generate: FieldActionGenerate;
  /** Guidance under the prompt, such as the value type expected. */
  hint?: React.ReactNode | ((ctx: FieldActionContext) => React.ReactNode);
  /** The prompt's placeholder, such as an example request for this field. */
  placeholder?: string | ((ctx: FieldActionContext) => string);
  strings?: Partial<AiAssistActionStrings>;
  /** Defaults to `ai-assist`. */
  id?: string;
}

/** AI assist: a prompt behind the label whose generated value is written to the field. */
export function createAiAssistAction({
  generate,
  hint,
  placeholder,
  strings,
  id = 'ai-assist',
}: AiAssistActionOptions): FieldHeaderAction {
  return {
    id,
    render: (ctx) => {
      const promptPlaceholder = typeof placeholder === 'function' ? placeholder(ctx) : placeholder;
      return (
        <AiAssistAction
          onGenerate={async (prompt) => {
            const result = await generate({ prompt }, ctx);
            // The field may have been disabled while the request was out.
            if (!result || ctx.disabled) return;
            // `ctx.mode` is read now, not when the request went out.
            const mode = result.mode ?? ctx.mode?.mode;
            if (ctx.setModeValue && mode) ctx.setModeValue(mode, result.value);
            else ctx.setValue(result.value);
          }}
          hint={typeof hint === 'function' ? hint(ctx) : hint}
          disabled={ctx.disabled}
          strings={{
            ...ctx.strings.aiAssist,
            ...(promptPlaceholder !== undefined && { promptPlaceholder }),
            ...strings,
          }}
        />
      );
    },
  };
}

export interface ClearActionOptions {
  strings?: Partial<ClearActionStrings>;
  /** Defaults to `clear`. */
  id?: string;
}

/** Clear value: a menu row that empties the value, keeping its mode. */
export function createClearAction({
  strings,
  id = 'clear',
}: ClearActionOptions = {}): FieldMenuAction {
  return {
    id,
    label: (ctx) => strings?.label ?? ctx.strings.clear.label,
    icon: Eraser,
    destructive: true,
    disabled: (ctx) => ctx.disabled || ctx.empty,
    onSelect: (ctx) => ctx.clear(),
  };
}

export function buildFieldActionRegistry(plugins: readonly FormPlugin[]): FieldActionRegistry {
  const registry: FieldActionRegistry = { header: {}, menu: { clear: createClearAction() } };
  for (const { fieldActions } of plugins) {
    Object.assign(registry.header, fieldActions?.header);
    Object.assign(registry.menu, fieldActions?.menu);
  }
  return registry;
}

/** The registry of a form whose plugins add no actions: just Clear. Frozen, as it is shared. */
export const DEFAULT_FIELD_ACTION_REGISTRY: Readonly<FieldActionRegistry> = (() => {
  const { header, menu } = buildFieldActionRegistry([]);
  return Object.freeze({ header: Object.freeze(header), menu: Object.freeze(menu) });
})();

/** A field's actions in its order. Unregistered ids are left out. */
export function resolveFieldActions(
  field: FieldMetadata,
  registry: FieldActionRegistry
): { header: FieldHeaderAction[]; menu: FieldMenuAction[] } {
  const pick = <A,>(ids: string[] | undefined, actions: Record<string, A>) =>
    (ids ?? []).flatMap((id) => (actions[id] ? [actions[id]] : []));
  return {
    header: pick(field.headerActions, registry.header),
    menu: pick(field.menuActions, registry.menu),
  };
}
