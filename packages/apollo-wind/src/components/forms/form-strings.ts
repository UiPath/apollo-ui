import {
  type BooleanRadioGroupStrings,
  DEFAULT_BOOLEAN_RADIO_GROUP_STRINGS,
} from '@/components/ui/boolean-radio-group';
import {
  type AiAssistActionStrings,
  DEFAULT_AI_ASSIST_ACTION_STRINGS,
} from '@/components/ui/field-actions/ai-assist-action';
import {
  DEFAULT_INSERT_VARIABLE_ACTION_STRINGS,
  type InsertVariableActionStrings,
} from '@/components/ui/field-actions/insert-variable-action';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueModeStrings,
} from '@/components/ui/field-addons/value-mode-strings';
import type { FormPlugin } from './form-schema';

export interface ClearActionStrings {
  label: string;
}

export interface FormValidationStrings {
  /** A required field with no value, in any mode. */
  required: string;
}

/** Every string MetadataForm's built-ins show, by the built-in that shows it. */
export interface MetadataFormStrings {
  /** Mode titles and descriptions, the mode menu and the lossy-switch dialog. */
  valueModes: ValueModeStrings;
  /** The `boolean` field type's radios, with or without value modes. */
  boolean: BooleanRadioGroupStrings;
  insertVariable: InsertVariableActionStrings;
  aiAssist: AiAssistActionStrings;
  clear: ClearActionStrings;
  validation: FormValidationStrings;
}

/** Any subset of any group, as `FormPlugin.strings` takes them. */
export type MetadataFormStringOverrides = {
  [Group in keyof MetadataFormStrings]?: Partial<MetadataFormStrings[Group]>;
};

export const DEFAULT_METADATA_FORM_STRINGS: MetadataFormStrings = {
  valueModes: DEFAULT_VALUE_MODE_STRINGS,
  boolean: DEFAULT_BOOLEAN_RADIO_GROUP_STRINGS,
  insertVariable: DEFAULT_INSERT_VARIABLE_ACTION_STRINGS,
  aiAssist: DEFAULT_AI_ASSIST_ACTION_STRINGS,
  clear: { label: 'Clear value' },
  validation: { required: 'This field is required' },
};

/** Every plugin's `strings` over the English defaults, later plugins winning per string. */
export function buildFormStrings(plugins: readonly FormPlugin[]): MetadataFormStrings {
  const strings = { ...DEFAULT_METADATA_FORM_STRINGS };
  for (const plugin of plugins) {
    for (const [group, overrides] of Object.entries(plugin.strings ?? {})) {
      const key = group as keyof MetadataFormStrings;
      strings[key] = { ...strings[key], ...overrides } as never;
    }
  }
  return strings;
}
