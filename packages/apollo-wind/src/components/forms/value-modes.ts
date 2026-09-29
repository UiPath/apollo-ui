import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import {
  builtInValueModes,
  isBuiltInValueMode,
  type ValueModeOption,
} from '@/components/ui/field-addons/built-in-value-modes';
import type { ValueModeStrings } from '@/components/ui/field-addons/value-mode-strings';
import type { InputGroupLayout, InputGroupProps } from '@/components/ui/input-group';
import { get } from '@/lib';
import type { FieldControlLabelTarget } from './field-control';
import type {
  CustomFieldComponentProps,
  CustomValueType,
  FieldMetadata,
  FieldType,
  FormPlugin,
  FormSchema,
  ValueModeId,
  ValueModesConfig,
} from './form-schema';
import { VALUE_MODE_OPAQUE } from './opaque-value';
import { isEmptyFieldValue } from './validation-converter';

// ============================================================================
// Codecs — how a field's stored value carries its mode
// ============================================================================

/** A stored value split into its mode and the value written in that mode. */
export interface DecodedValue {
  mode: ValueModeId;
  /** For `literal`, the value in its field type's own shape, which that type's validation runs on. */
  value: unknown;
  /** Set by a codec that knows; otherwise `isEmpty` decides. */
  empty?: boolean;
}

export interface CodecContext {
  field: FieldMetadata;
  /** The field's type, whose control edits `literal` values. */
  fieldType: FieldType;
  valueType?: CustomValueType;
  /** The value's type as a mode describes it: `valueModes.expectedType`, else the field type's. */
  expectedType?: string;
  config: ValueModesConfig;
}

/**
 * A switch's outcome, `value` being the value in the new mode, which the form encodes. `ok` writes
 * it straight away; `lossy` asks first, with the codec's own wording when it gives one.
 */
export type ConvertResult =
  | { kind: 'ok'; value: unknown }
  | { kind: 'lossy'; value: unknown; title?: string; description?: string };

/**
 * How a field's stored value carries its mode. Validating a value in a mode belongs to the mode:
 * see `ValueModeDefinition.validate`.
 */
export interface ValueModeCodec {
  /**
   * The active mode and the value in it. Only the active mode's: a shape that keeps other modes'
   * data alongside gets it back as `encode`'s `previous`.
   */
  decode(stored: unknown, ctx: CodecContext): DecodedValue;
  /**
   * The stored value for `inner` in `mode`. `previous` is the value stored until now, so a shape
   * holding more than the active mode's value (another mode's draft, a flag) can carry it over.
   * Never `undefined`: react-hook-form reads it as unset and shows the field's default instead, so
   * an empty value is `null` or a shape of the codec's own. `inner` is `null` or `undefined` when
   * the value is cleared.
   */
  encode(mode: ValueModeId, inner: unknown, ctx: CodecContext, previous?: unknown): unknown;
  /**
   * The value in `to` for a switch from `from`. Called for an empty value too, with `from.empty`
   * set, so a switch can seed a value; an empty value never asks, whatever `kind` says. Without
   * it, an empty value switches to nothing and a non-empty one clears, lossily.
   */
  convert?(from: DecodedValue, to: ValueModeId, ctx: CodecContext): ConvertResult;
  /** Drives `required` and Clear. Defaults to the form's usual notion of empty. */
  isEmpty?(decoded: DecodedValue, ctx: CodecContext): boolean;
}

/** How the default codec stores a value, in every mode. A cleared value has no `value`. */
export interface ValueModeEnvelope {
  $mode: ValueModeId;
  value?: unknown;
}

export function isValueModeEnvelope(value: unknown): value is ValueModeEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { $mode?: unknown }).$mode === 'string'
  );
}

/**
 * The default codec. Every mode is stored as `{ $mode, value }`; a cleared value keeps its
 * envelope without `value`, so its mode survives. A raw value reads as `literal`, so data written
 * before the field had value modes still loads; its first write wraps it. `$mode` rather than
 * `mode`, so an object value that has a `mode` of its own is not misread.
 */
export const envelopeCodec: ValueModeCodec = {
  decode(stored) {
    if (isValueModeEnvelope(stored)) return { mode: stored.$mode, value: stored.value };
    return { mode: 'literal', value: stored };
  },
  encode(mode, inner) {
    return isCleared(inner) ? { $mode: mode } : { $mode: mode, value: inner };
  },
  isEmpty(decoded) {
    // A number input that has been cleared reports NaN.
    return isEmptyFieldValue(decoded.value) || Number.isNaN(decoded.value);
  },
};

/** What a control reports once emptied. Whitespace is kept: it is still being typed. */
function isCleared(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    Number.isNaN(value) ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function isDecodedEmpty(
  codec: ValueModeCodec,
  decoded: DecodedValue,
  ctx: CodecContext
): boolean {
  return decoded.empty ?? codec.isEmpty?.(decoded, ctx) ?? isEmptyFieldValue(decoded.value);
}

/**
 * Switches `from` to `to`, returning the value in `to`: an empty value never asks, and a codec
 * without `convert` clears a non-empty one, lossily.
 */
export function convertValue(
  codec: ValueModeCodec,
  from: DecodedValue,
  to: ValueModeId,
  ctx: CodecContext
): ConvertResult {
  const empty = isDecodedEmpty(codec, from, ctx);
  const result = codec.convert?.({ ...from, empty }, to, ctx);
  if (empty) return { kind: 'ok', value: result?.value };
  return result ?? { kind: 'lossy', value: undefined };
}

export function codecContext(field: FieldMetadata, config: ValueModesConfig): CodecContext {
  return {
    field,
    fieldType: field.type,
    valueType: field.type === 'custom' ? field.valueType : undefined,
    expectedType: expectedType(field, config),
    config,
  };
}

// ============================================================================
// Controls — what edits a value in each mode
// ============================================================================

export interface ValueModeControlHandle {
  focus(): void;
  /**
   * Inserts at the caret. Needed by a control registered as `insertable` that has no text input
   * of its own for the form to insert into, such as a code editor.
   */
  insertText?(text: string): void;
}

/**
 * Props of a registered value-mode control. A superset of `CustomFieldComponentProps`, so an
 * existing custom component can be registered as a control unchanged. In the field anatomy both
 * get the value in the active mode (a custom field's fixed value), never the stored shape.
 */
export interface ValueModeControlProps extends CustomFieldComponentProps {
  mode: ValueModeId;
  /** The value in `mode`, not the stored shape. */
  value: unknown;
  onChange: (inner: unknown) => void;
  /** Writes a value in another mode without asking, as pasting an expression does. */
  onModeValueChange: (mode: ValueModeId, inner: unknown) => void;
  /** Switches mode the way the menu does, asking first if the value would be lost. */
  requestModeSwitch: (mode: ValueModeId) => void;
  controlRef?: React.Ref<ValueModeControlHandle>;
  inputRef?: React.Ref<unknown>;
  /** The id the field's label points at, when the registration's `labelTarget` is `control`. */
  id: string;
  /** The label's id, for `aria-labelledby` on a control no label can point at. */
  labelId: string;
  invalid: boolean;
  placeholder?: string;
  /** Spread on the element that takes focus, so the group's focus ring and error wiring find it. */
  controlProps: {
    'data-slot': 'input-group-control';
    'aria-invalid'?: true;
    'aria-describedby'?: string;
    'aria-errormessage'?: string;
  };
}

export type InputGroupVariant = NonNullable<InputGroupProps['variant']>;

/** A component with its geometry inside the field anatomy. */
export interface FieldControlRegistration<P> {
  component: React.ComponentType<P>;
  /** Defaults to `row`. */
  layout?: InputGroupLayout;
  /** Defaults to `default`. */
  variant?: InputGroupVariant;
  /**
   * How the label reaches the control: `control` points it at the element with `id`;
   * `labelledby` leaves the control to name itself with `aria-labelledby={labelId}`, as a code
   * editor or a radio group must. Defaults to `control`.
   */
  labelTarget?: FieldControlLabelTarget;
  /**
   * Whether Insert variable writes at the caret. The control's `controlRef` handle does it, or,
   * without one, the text input carrying `id`; with neither the reference is appended.
   */
  insertable?: boolean;
}

export function isFieldControlRegistration<P>(
  entry: React.ComponentType<P> | FieldControlRegistration<P>
): entry is FieldControlRegistration<P> {
  return typeof entry === 'object' && entry !== null && 'component' in entry;
}

// ============================================================================
// Definitions and registry
// ============================================================================

/** A value control with its geometry, for value modes. */
export type ValueModeControlRegistration = FieldControlRegistration<ValueModeControlProps>;

/**
 * A mode apollo-wind does not ship, or changes to a built-in one. For a built-in id every member is
 * optional and merges over the built-in, whose localized title and description stay unless given.
 * A mode of the host's own needs `icon` and `title`.
 */
export interface ValueModeDefinition {
  icon?: LucideIcon;
  title?: string | ((ctx: { field: FieldMetadata }) => string);
  description?: string;
  /** The glyph ahead of the value in this mode. */
  indicator?: React.ReactNode;
  /** The control for this mode on every field. A field's own `valueModes.controls[mode]` wins. */
  control?: ValueModeControlRegistration;
  /**
   * Validates a non-empty value in this mode, such as an expression's syntax. Never called for
   * `literal`, which its field type validates.
   */
  validate?(value: unknown, ctx: CodecContext): string | undefined;
}

/**
 * Form-wide value-mode behavior.
 *
 * A field's control for its active mode is the first of:
 * 1. the field's `valueModes.controls[mode]`, a name in `controlRegistry`;
 * 2. for `literal`, `literalControls[fieldType]`, since a fixed value is edited per field type;
 * 3. `definitions[mode].control`;
 * 4. the built-in: the field type's own control for `literal`, a plain Input for `expression`;
 * 5. a plain Input, with a warning. The built-in `variable` and `prompt` modes have no control of
 *    their own yet, so they land here until the host registers one.
 *
 * Only a field schema refers to controls by name, since it has to stay JSON; the plugin's own
 * settings hold the registration itself.
 *
 * @example
 * const code = { component: CodeControl, layout: 'fill', insertable: true };
 * valueModes: {
 *   // Every expression edits in the code control…
 *   definitions: { expression: { control: code } },
 *   // …every fixed textarea value in a rich-text one…
 *   literalControls: { textarea: { component: RichTextControl, layout: 'grow', insertable: true } },
 *   // …and a field can ask for the code control by name: `controls: { literal: 'code' }`.
 *   controlRegistry: { code },
 * }
 */
export interface ValueModesPluginConfig {
  /** Codecs by name; `default` replaces the envelope codec form-wide. */
  codecs?: Record<string, ValueModeCodec>;
  /** Mode definitions by mode id: a host mode, or changes to a built-in one. */
  definitions?: Partial<Record<ValueModeId, ValueModeDefinition>>;
  /**
   * Controls a field schema can name in `valueModes.controls`. A name is any string of the host's
   * choosing; it is not a mode id or a field type.
   */
  controlRegistry?: Record<string, ValueModeControlRegistration>;
  /**
   * The `literal` control per field type, for those with fixed values the host edits in its own
   * control rather than the default one for that field type.
   */
  literalControls?: Partial<Record<FieldType, ValueModeControlRegistration>>;
}

/** Every plugin's `valueModes`, merged with later plugins winning. */
export interface ValueModeRegistry {
  codecs: Record<string, ValueModeCodec>;
  definitions: Partial<Record<ValueModeId, ValueModeDefinition>>;
  controlRegistry: Record<string, ValueModeControlRegistration>;
  literalControls: Partial<Record<FieldType, ValueModeControlRegistration>>;
}

export const EMPTY_VALUE_MODE_REGISTRY: ValueModeRegistry = {
  codecs: {},
  definitions: {},
  controlRegistry: {},
  literalControls: {},
};

export function buildValueModeRegistry(plugins: readonly FormPlugin[]): ValueModeRegistry {
  const registry: ValueModeRegistry = {
    codecs: {},
    definitions: {},
    controlRegistry: {},
    literalControls: {},
  };
  for (const { valueModes } of plugins) {
    if (!valueModes) continue;
    Object.assign(registry.codecs, valueModes.codecs);
    for (const [id, definition] of Object.entries(valueModes.definitions ?? {})) {
      registry.definitions[id] = { ...registry.definitions[id], ...definition };
    }
    Object.assign(registry.controlRegistry, valueModes.controlRegistry);
    Object.assign(registry.literalControls, valueModes.literalControls);
  }
  return registry;
}

const warned = new Set<string>();

/** Logs a schema or registration mistake once per message rather than on every render. */
export function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[MetadataForm] ${message}`);
}

export function resolveCodec(
  codecs: Record<string, ValueModeCodec>,
  config: ValueModesConfig
): ValueModeCodec {
  const name = config.codec ?? 'default';
  const codec = codecs[name];
  if (codec) return codec;
  if (config.codec) warnOnce(`No value-mode codec is registered as "${name}".`);
  return envelopeCodec;
}

/** The value type a built-in mode's description is phrased for. */
function expectedType(
  field: FieldMetadata,
  config: ValueModesConfig | undefined
): string | undefined {
  if (config?.expectedType) return config.expectedType;
  if (field.type === 'number') return 'number';
  if (field.type === 'switch' || field.type === 'checkbox' || field.type === 'boolean') {
    return 'boolean';
  }
  if (field.type === 'custom') return field.valueType;
  return undefined;
}

/** The menu entries for a field's modes, in its order. Ids with no definition are left out. */
export function resolveModeOptions(
  field: FieldMetadata,
  config: ValueModesConfig,
  registry: ValueModeRegistry,
  strings: Partial<ValueModeStrings> = {}
): ValueModeOption<string>[] {
  const builtIns = builtInValueModes(strings, {
    expectedType: expectedType(field, config),
  });
  const options: ValueModeOption<string>[] = [];
  for (const id of config.modes) {
    const definition = registry.definitions[id];
    const label = config.labels?.[id];
    const base: Partial<ValueModeOption<string>> = isBuiltInValueMode(id) ? builtIns[id] : {};
    const title =
      typeof definition?.title === 'function' ? definition.title({ field }) : definition?.title;
    const option = {
      ...base,
      id,
      ...(title !== undefined && { title }),
      ...(definition?.description !== undefined && { description: definition.description }),
      ...(definition?.icon && { icon: definition.icon }),
    };
    if (!option.title || !option.icon) {
      warnOnce(`Value mode "${id}" of field "${field.name}" needs an icon and a title.`);
      continue;
    }
    options.push({
      ...option,
      title: label?.title ?? option.title,
      icon: option.icon,
      description: label?.description ?? option.description,
    });
  }
  return options;
}

/** Whether a stored value is empty, decoding it first for a field with value modes. */
export function isEmptyModeValue(
  stored: unknown,
  field: FieldMetadata,
  codecs: Record<string, ValueModeCodec> = {}
): boolean {
  if (!field.valueModes) return isEmptyFieldValue(stored);
  const codec = resolveCodec(codecs, field.valueModes);
  const ctx = codecContext(field, field.valueModes);
  return isDecodedEmpty(codec, codec.decode(stored, ctx), ctx);
}

export { VALUE_MODE_OPAQUE } from './opaque-value';

/**
 * Form values as rules, conditions and data sources read them. A field with value modes reads as
 * its `literal` value; a value in another mode as `VALUE_MODE_OPAQUE`, and an empty one as
 * `undefined`. Fields without value modes read as stored.
 */
export function literalValues(
  values: Record<string, unknown>,
  schema: FormSchema,
  codecs: Record<string, ValueModeCodec> = {}
): Record<string, unknown> {
  let result = values;
  for (const field of modeFields(schema)) {
    const stored = get(values, field.name);
    const read = readLiteral(stored, field, codecs);
    if (read !== stored) {
      result = withPath(result, field.name.split('.'), read) as Record<string, unknown>;
    }
  }
  return result;
}

/** One field's value as `literalValues` reads it: `stored` as it is for a field without modes. */
export function literalValueOf(
  name: string,
  stored: unknown,
  schema: FormSchema,
  codecs: Record<string, ValueModeCodec> = {}
): unknown {
  const field = modeFields(schema).find((candidate) => candidate.name === name);
  return field ? readLiteral(stored, field, codecs) : stored;
}

function readLiteral(
  stored: unknown,
  field: FieldMetadata,
  codecs: Record<string, ValueModeCodec>
): unknown {
  const config = field.valueModes as ValueModesConfig;
  const codec = resolveCodec(codecs, config);
  const ctx = codecContext(field, config);
  const decoded = codec.decode(stored, ctx);
  if (isDecodedEmpty(codec, decoded, ctx)) return undefined;
  return decoded.mode === 'literal' ? decoded.value : VALUE_MODE_OPAQUE;
}

const modeFieldsCache = new WeakMap<FormSchema, FieldMetadata[]>();

function modeFields(schema: FormSchema): FieldMetadata[] {
  let fields = modeFieldsCache.get(schema);
  if (!fields) {
    const sections = schema.steps?.flatMap((step) => step.sections) ?? schema.sections ?? [];
    fields = sections.flatMap((section) => section.fields).filter((field) => field.valueModes);
    modeFieldsCache.set(schema, fields);
  }
  return fields;
}

/** `target` with `value` at `path`, copying only the objects and arrays along it, as what they are. */
function withPath(target: unknown, path: string[], value: unknown): unknown {
  const [key, ...rest] = path;
  if (key === undefined) return target;
  const container = typeof target === 'object' && target !== null ? target : {};
  const copy: Record<string, unknown> = Array.isArray(container)
    ? ([...container] as unknown as Record<string, unknown>)
    : { ...container };
  copy[key] = rest.length ? withPath(copy[key], rest, value) : value;
  return copy;
}
