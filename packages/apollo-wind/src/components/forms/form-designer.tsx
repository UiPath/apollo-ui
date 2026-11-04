import {
  AlertTriangle,
  Asterisk,
  ChevronRight,
  Code,
  Database,
  Eye,
  GitBranch,
  GripVertical,
  Layers,
  MoveDown,
  MoveUp,
  Plus,
  Settings,
  Trash2,
  View,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { createConditionGroup } from '@/components/ui/conditions-editor';
import { Input } from '@/components/ui/input';
import { Label, RequiredIndicator } from '@/components/ui/label';
import { Grid } from '@/components/ui/layout/grid';
import {
  createRule,
  findRuleIssues,
  issueIds,
  isUnconditionalRule,
  type Rule,
  RulesEditor,
} from '@/components/ui/rules-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { createAiAssistAction, createInsertVariableAction } from './field-actions';
import {
  type FieldRuleOutcome,
  type FieldRulesOptions,
  fromFieldRules,
  renameFieldInRules,
} from './field-rules';
import type {
  CustomValueType,
  DataSource,
  FieldMetadata,
  FieldRule,
  FieldType,
  FormPlugin,
  FormSchema,
  ValidationConfig,
  ValueModeId,
  ValueModesConfig,
} from './form-schema';
import { MetadataForm } from './metadata-form';
import {
  type FieldRuleField,
  rulesEngineDialect,
  rulesEngineVocabulary,
} from './rules-engine-dialect';
import { schemaToJson } from './schema-serializer';
import { useFieldRules } from './use-field-rules';

/**
 * Enhanced Form Designer Component
 * Full-featured visual editor supporting all schema capabilities
 */

/**
 * Metadata for each field type used in the form designer
 */
interface FieldTypeMetadata {
  value: FieldType;
  label: string;
  category: 'Input' | 'Selection' | 'Boolean' | 'Advanced';
  description?: string;
}

/**
 * The field types the designer can create and edit.
 *
 * Deliberately not the same set as `FieldType`: `string-list` is renderable and fully usable
 * from a hand-written or programmatically built schema, but is absent here because the designer
 * would also need settings UI for `maxItems` / `maxLength` / `minRows`. Adding a type to this
 * list without that UI surfaces it in the type selector with its settings unreachable, which is
 * worse than the omission — so add the settings and the entry together.
 */
const FIELD_TYPE_METADATA: readonly FieldTypeMetadata[] = [
  {
    value: 'text',
    label: 'Text',
    category: 'Input',
    description: 'Single-line text input',
  },
  {
    value: 'email',
    label: 'Email',
    category: 'Input',
    description: 'Email with validation',
  },
  {
    value: 'textarea',
    label: 'Textarea',
    category: 'Input',
    description: 'Multi-line text input',
  },
  {
    value: 'number',
    label: 'Number',
    category: 'Input',
    description: 'Numeric input with min/max',
  },
  {
    value: 'date',
    label: 'Date',
    category: 'Input',
    description: 'Date picker',
  },
  {
    value: 'datetime',
    label: 'Date & Time',
    category: 'Input',
    description: 'Date and time picker',
  },
  {
    value: 'file',
    label: 'File Upload',
    category: 'Input',
    description: 'File upload control',
  },
  {
    value: 'select',
    label: 'Select Dropdown',
    category: 'Selection',
    description: 'Single-select dropdown',
  },
  {
    value: 'multiselect',
    label: 'Multi-Select',
    category: 'Selection',
    description: 'Multi-select with search',
  },
  {
    value: 'radio',
    label: 'Radio Group',
    category: 'Selection',
    description: 'Radio button group',
  },
  {
    value: 'checkbox',
    label: 'Checkbox',
    category: 'Boolean',
    description: 'Single checkbox',
  },
  {
    value: 'switch',
    label: 'Switch Toggle',
    category: 'Boolean',
    description: 'Toggle switch',
  },
  {
    value: 'boolean',
    label: 'True / False',
    category: 'Boolean',
    description: 'True, false or not set',
  },
  {
    value: 'slider',
    label: 'Slider',
    category: 'Input',
    description: 'Range slider',
  },
  {
    value: 'custom',
    label: 'Custom Component',
    category: 'Advanced',
    description: 'Custom field component',
  },
] as const;

/** The field types the designer offers value modes and field actions on: those fitted to the anatomy. */
const ANATOMY_FIELD_TYPES: readonly FieldType[] = [
  'text',
  'email',
  'textarea',
  'number',
  'select',
  'multiselect',
  'switch',
  'checkbox',
  'boolean',
];

const VALUE_MODE_OPTIONS: { label: string; value: ValueModeId }[] = [
  { label: 'Fixed value', value: 'literal' },
  { label: 'Expression', value: 'expression' },
  { label: 'Variable', value: 'variable' },
  { label: 'Prompt', value: 'prompt' },
];

/**
 * What the preview offers the fields: the variables the Variable mode and Insert pick from, and the
 * header actions a field can list. Clear is built in. Module-level, as MetadataForm expects plugins
 * to keep their identity.
 */
const PREVIEW_PLUGINS: FormPlugin[] = [
  {
    name: 'designer-preview',
    variables: [
      {
        id: 'vars',
        label: '$vars',
        children: [
          {
            id: 'customerName',
            label: 'customerName',
            value: '$vars.customerName',
            type: 'string',
          },
          { id: 'orderId', label: 'orderId', value: '$vars.orderId', type: 'string' },
          { id: 'total', label: 'total', value: '$vars.total', type: 'number' },
        ],
      },
    ],
    fieldActions: {
      header: {
        'insert-variable': createInsertVariableAction({}),
        'ai-assist': createAiAssistAction({
          // A stand-in for a model call.
          generate: ({ prompt }) =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ value: `Generated from "${prompt}"` }), 600)
            ),
        }),
      },
    },
  },
];

/** The designer's value-mode settings as `ValueModesConfig`; no modes means none. */
function toValueModes(values: Record<string, unknown> | undefined): ValueModesConfig | undefined {
  const modes = (values?.modes as ValueModeId[] | undefined) ?? [];
  if (modes.length === 0) return undefined;
  const defaultMode = values?.defaultMode as ValueModeId | undefined;
  return {
    modes,
    ...(defaultMode && modes.includes(defaultMode) && { defaultMode }),
    ...(values?.switchable === false && { switchable: false }),
  };
}

function nonEmpty(list: unknown): string[] | undefined {
  return Array.isArray(list) && list.length > 0 ? (list as string[]) : undefined;
}

interface ExtendedFieldConfig extends Omit<FieldMetadata, 'validation'> {
  id: string;
  options?: Array<{ label: string; value: string; disabled?: boolean }>;
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  multiple?: boolean;
  defaultValue?: unknown;
  // Validation properties
  validation?: {
    // Required validation
    requiredMessage?: string;
    // Text validations
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    // Number validations (min/max already exist at field level)
    integer?: boolean;
    // File validations
    maxFileSize?: number; // in bytes
    maxFiles?: number;
    // General
    customMessage?: string;
  };
}

interface ExtendedSectionConfig {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fields: ExtendedFieldConfig[];
}

interface OptionItem {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * Build ValidationConfig from field configuration
 * Converts the internal ExtendedFieldConfig.validation to the JSON-serializable ValidationConfig
 */
function buildValidationConfig(field: ExtendedFieldConfig): ValidationConfig | undefined {
  const { type, validation, rules } = field;

  const config: ValidationConfig = {};
  const messages: ValidationConfig['messages'] = {};

  // Check if field is always required (has required rule with no conditions)
  const isAlwaysRequired = rules?.some(
    (r) => r.effects.required === true && r.conditions.length === 0
  );
  if (isAlwaysRequired) {
    config.required = true;
    if (validation?.requiredMessage) {
      messages.required = validation.requiredMessage;
    }
  }

  // If no validation config and not required, return undefined
  if (!validation && !isAlwaysRequired) return undefined;

  if (validation) {
    // Text field validations
    if (type === 'text' || type === 'textarea' || type === 'email') {
      // Validate that minLength <= maxLength before applying
      const minLen = validation.minLength;
      const maxLen = validation.maxLength;
      const validLengthConstraints = minLen == null || maxLen == null || minLen <= maxLen;

      if (validLengthConstraints) {
        if (minLen != null) {
          config.minLength = minLen;
          if (validation.customMessage) {
            messages.minLength = validation.customMessage;
          }
        }
        if (maxLen != null) {
          config.maxLength = maxLen;
          if (validation.customMessage) {
            messages.maxLength = validation.customMessage;
          }
        }
      }

      if (validation.pattern) {
        // Validate regex is valid before adding
        try {
          new RegExp(validation.pattern);
          config.pattern = validation.pattern;
          if (validation.patternMessage) {
            messages.pattern = validation.patternMessage;
          } else if (validation.customMessage) {
            messages.pattern = validation.customMessage;
          }
        } catch {
          // Invalid regex pattern - skip until pattern is valid
        }
      }
    }

    // Number field validations
    if (type === 'number' || type === 'slider') {
      if (validation.integer) {
        config.integer = true;
        if (validation.customMessage) {
          messages.integer = validation.customMessage;
        }
      }

      // Validate that min <= max before applying
      const minVal = field.min;
      const maxVal = field.max;
      const validRangeConstraints = minVal == null || maxVal == null || minVal <= maxVal;

      if (validRangeConstraints) {
        if (minVal != null) {
          config.min = minVal;
          if (validation.customMessage) {
            messages.min = validation.customMessage;
          }
        }
        if (maxVal != null) {
          config.max = maxVal;
          if (validation.customMessage) {
            messages.max = validation.customMessage;
          }
        }
      }
    }

    // File field validations
    if (type === 'file') {
      if (validation.maxFileSize != null) {
        config.maxFileSize = validation.maxFileSize;
      }
      if (field.multiple && validation.maxFiles != null) {
        config.maxItems = validation.maxFiles;
        if (validation.customMessage) {
          messages.maxItems = validation.customMessage;
        }
      }
    }

    // General custom message
    if (validation.customMessage) {
      messages.custom = validation.customMessage;
    }
  }

  // Add messages if any exist
  if (Object.keys(messages).length > 0) {
    config.messages = messages;
  }

  // Only return if we have any validation config
  return Object.keys(config).length > 0 ? config : undefined;
}

// ============================================================================
// Configuration Schemas for MetadataForm
// ============================================================================

/**
 * Schema for section configuration
 */
const createSectionConfigSchema = (section: ExtendedSectionConfig): FormSchema => ({
  id: 'section-config',
  title: '',
  sections: [
    {
      id: 'main',
      title: 'Section settings',
      fields: [
        {
          name: 'id',
          type: 'text',
          label: 'Section ID',
          description: 'Unique identifier for this section',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Section title',
          placeholder: 'Enter section title',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Optional section description',
          rows: 2,
        },
        {
          name: 'collapsible',
          type: 'switch',
          label: 'Collapsible section',
        },
        {
          name: 'defaultExpanded',
          type: 'switch',
          label: 'Expanded by default',
          rules: [
            {
              id: 'show-when-collapsible',
              conditions: [{ when: 'collapsible', is: true }],
              operator: 'AND',
              effects: { visible: true },
            },
          ],
        },
      ],
    },
  ],
  initialData: {
    id: section.id,
    title: section.title,
    description: section.description || '',
    collapsible: section.collapsible || false,
    defaultExpanded: section.defaultExpanded !== false,
  },
  actions: [], // No submit button - sync happens on change
});

/**
 * Schema for field configuration
 */
const createFieldConfigSchema = (field: ExtendedFieldConfig): FormSchema => ({
  id: 'field-config',
  title: '',
  sections: [
    {
      id: 'basic',
      title: 'Basic settings',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Field name',
          placeholder: 'fieldName',
          description: 'Internal identifier (camelCase recommended)',
        },
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          placeholder: 'Field Label',
        },
        {
          name: 'type',
          type: 'select',
          label: 'Field type',
          options: FIELD_TYPE_METADATA.map((t) => ({
            label: `${t.label} (${t.category})`,
            value: t.value,
          })),
        },
        {
          name: 'placeholder',
          type: 'text',
          label: 'Placeholder',
          placeholder: 'Enter placeholder text...',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Help text for this field',
          rows: 2,
        },
      ],
    },
    {
      id: 'number-settings',
      title: 'Number settings',
      fields: [
        { name: 'min', type: 'number', label: 'Min' },
        { name: 'max', type: 'number', label: 'Max' },
        { name: 'step', type: 'number', label: 'Step' },
      ],
      conditions: [{ when: 'type', in: ['number', 'slider'] }],
    },
    {
      id: 'file-settings',
      title: 'File settings',
      fields: [
        {
          name: 'accept',
          type: 'text',
          label: 'Accepted file types',
          placeholder: '.pdf,.doc,.docx',
          description: 'Comma-separated file extensions',
        },
        {
          name: 'multiple',
          type: 'checkbox',
          label: 'Allow multiple files',
        },
      ],
      conditions: [{ when: 'type', is: 'file' }],
    },
    {
      id: 'text-validation',
      title: 'Text validation',
      fields: [
        {
          name: 'validation.minLength',
          type: 'number',
          label: 'Minimum length',
          min: 0,
          placeholder: '0',
        },
        {
          name: 'validation.maxLength',
          type: 'number',
          label: 'Maximum length',
          min: 0,
          placeholder: 'No limit',
        },
        {
          name: 'validation.pattern',
          type: 'text',
          label: 'Pattern (regex)',
          placeholder: '^[A-Za-z]+$',
          description: 'Regular expression pattern',
        },
        {
          name: 'validation.patternMessage',
          type: 'text',
          label: 'Pattern error message',
          placeholder: 'Invalid format',
          rules: [
            {
              id: 'show-when-pattern',
              conditions: [{ when: 'validation.pattern', isNot: '' }],
              operator: 'AND',
              effects: { visible: true },
            },
          ],
        },
      ],
      conditions: [{ when: 'type', in: ['text', 'textarea', 'email'] }],
    },
    {
      id: 'number-validation',
      title: 'Number validation',
      fields: [
        {
          name: 'validation.integer',
          type: 'switch',
          label: 'Integer only',
          description: 'Only allow whole numbers',
        },
      ],
      conditions: [{ when: 'type', in: ['number', 'slider'] }],
    },
    {
      id: 'file-validation',
      title: 'File validation',
      fields: [
        {
          name: 'validation.maxFileSize',
          type: 'number',
          label: 'Max file size (MB)',
          min: 0,
          step: 0.1,
          placeholder: 'No limit',
        },
        {
          name: 'validation.maxFiles',
          type: 'number',
          label: 'Max number of files',
          min: 1,
          placeholder: 'No limit',
          rules: [
            {
              id: 'show-when-multiple',
              conditions: [{ when: 'multiple', is: true }],
              operator: 'AND',
              effects: { visible: true },
            },
          ],
        },
      ],
      conditions: [{ when: 'type', is: 'file' }],
    },
    {
      id: 'value-modes',
      title: 'Value modes and actions',
      description:
        'A field with modes takes its value as a fixed value, an expression, a variable or a prompt. Any of these settings renders the field anatomy.',
      fields: [
        {
          name: 'valueModes.modes',
          type: 'multiselect',
          label: 'Modes',
          placeholder: 'No modes',
          options: VALUE_MODE_OPTIONS,
        },
        {
          name: 'valueModes.defaultMode',
          type: 'select',
          label: 'Default mode',
          placeholder: 'The first mode',
          options: VALUE_MODE_OPTIONS,
          rules: [
            {
              id: 'show-with-modes',
              conditions: [{ when: 'valueModes.modes', custom: 'valueModes.modes.length > 0' }],
              effects: { visible: true },
            },
          ],
        },
        {
          name: 'valueModes.switchable',
          type: 'switch',
          label: 'Users can switch modes',
          rules: [
            {
              id: 'show-with-modes',
              conditions: [{ when: 'valueModes.modes', custom: 'valueModes.modes.length > 0' }],
              effects: { visible: true },
            },
          ],
        },
        {
          name: 'headerActions',
          type: 'multiselect',
          label: 'Header actions',
          placeholder: 'None',
          options: [
            { label: 'Insert variable', value: 'insert-variable' },
            { label: 'AI assist', value: 'ai-assist' },
          ],
        },
        {
          name: 'menuActions',
          type: 'multiselect',
          label: 'Menu actions',
          placeholder: 'None',
          options: [{ label: 'Clear value', value: 'clear' }],
        },
        {
          name: 'badge',
          type: 'text',
          label: 'Badge',
          placeholder: 'e.g. Beta',
        },
      ],
      conditions: [{ when: 'type', in: [...ANATOMY_FIELD_TYPES] }],
    },
  ],
  initialData: {
    name: field.name,
    label: field.label,
    type: field.type,
    placeholder: field.placeholder || '',
    description: field.description || '',
    min: field.min,
    max: field.max,
    step: field.step,
    accept: field.accept || '',
    multiple: field.multiple || false,
    valueModes: {
      modes: field.valueModes?.modes ?? [],
      defaultMode: field.valueModes?.defaultMode ?? '',
      switchable: field.valueModes?.switchable ?? true,
    },
    headerActions: field.headerActions ?? [],
    menuActions: field.menuActions ?? [],
    badge: field.badge ?? '',
    validation: {
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      pattern: field.validation?.pattern || '',
      patternMessage: field.validation?.patternMessage || '',
      integer: field.validation?.integer || false,
      maxFileSize: field.validation?.maxFileSize
        ? field.validation.maxFileSize / (1024 * 1024)
        : undefined, // Convert bytes to MB for display
      maxFiles: field.validation?.maxFiles,
    },
  },
  actions: [], // No submit button - sync happens on change
});

// ============================================================================
// Configuration Form Wrapper Components
// ============================================================================

interface SectionConfigFormProps {
  section: ExtendedSectionConfig;
  onUpdate: (updates: Partial<ExtendedSectionConfig>) => void;
  existingSectionIds: Set<string>;
}

function SectionConfigForm({ section, onUpdate, existingSectionIds }: SectionConfigFormProps) {
  const [attemptedId, setAttemptedId] = useState<string | null>(null);

  // Reset attempted ID when section changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset when section.id changes
  useEffect(() => {
    setAttemptedId(null);
  }, [section.id]);

  // Check if attempted ID is a duplicate (different from current and exists)
  const isDuplicateId =
    attemptedId !== null && attemptedId !== section.id && existingSectionIds.has(attemptedId);

  // Memoize schema to prevent infinite re-renders
  const schema = useMemo(() => createSectionConfigSchema(section), [section]);

  // Sync plugin - updates parent on any value change
  const plugins = useMemo<FormPlugin[]>(
    () => [
      {
        name: 'section-sync',
        onValueChange: (_field, _value, context) => {
          const values = context.values;
          const newId = values.id as string;

          // Track attempted ID for duplicate detection
          setAttemptedId(newId);

          onUpdate({
            id: newId,
            title: values.title as string,
            description: (values.description as string) || undefined,
            collapsible: values.collapsible as boolean,
            defaultExpanded: values.defaultExpanded as boolean,
          });
        },
      },
    ],
    [onUpdate]
  );

  return (
    <div className="space-y-4">
      {isDuplicateId && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Section ID &quot;{attemptedId}&quot; already exists. Please use a unique ID.</span>
        </div>
      )}
      <MetadataForm key={section.id} schema={schema} plugins={plugins} autoComplete="off" />
      <Separator />
      <div className="text-sm text-muted-foreground">
        <p>This section contains {section.fields.length} field(s).</p>
        <p className="mt-1">Click on a field in the left panel to configure it.</p>
      </div>
    </div>
  );
}

interface FieldConfigFormProps {
  field: ExtendedFieldConfig;
  onUpdate: (updates: Partial<ExtendedFieldConfig>) => void;
  allFields: ExtendedFieldConfig[];
  existingFieldNames: Set<string>;
}

function FieldConfigForm({ field, onUpdate, allFields, existingFieldNames }: FieldConfigFormProps) {
  const [attemptedName, setAttemptedName] = useState<string | null>(null);

  // Reset attempted name when field changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset when field.id changes
  useEffect(() => {
    setAttemptedName(null);
  }, [field.id]);

  // Check if attempted name is a duplicate (different from current and exists)
  const isDuplicateName =
    attemptedName !== null && attemptedName !== field.name && existingFieldNames.has(attemptedName);
  // Memoize schema to prevent infinite re-renders
  const schema = useMemo(() => createFieldConfigSchema(field), [field]);

  // Track current type for detecting type changes
  const currentTypeRef = useMemo(() => ({ type: field.type }), [field.type]);

  // Sync plugin - updates parent on any value change
  const plugins = useMemo<FormPlugin[]>(
    () => [
      {
        name: 'field-sync',
        onValueChange: (_fieldName, _value, context) => {
          const values = context.values;
          const newType = values.type as FieldType;
          const newName = values.name as string;
          const validationValues = values.validation as Record<string, unknown> | undefined;

          // Track attempted name for duplicate detection
          setAttemptedName(newName);

          // Build updates
          const updates: Partial<ExtendedFieldConfig> = {
            name: newName,
            label: values.label as string,
            type: newType,
            placeholder: (values.placeholder as string) || undefined,
            description: (values.description as string) || undefined,
          };

          // The anatomy settings; a type outside the anatomy keeps none.
          const anatomy = ANATOMY_FIELD_TYPES.includes(newType);
          updates.valueModes = anatomy
            ? toValueModes(values.valueModes as Record<string, unknown>)
            : undefined;
          updates.headerActions = anatomy ? nonEmpty(values.headerActions) : undefined;
          updates.menuActions = anatomy ? nonEmpty(values.menuActions) : undefined;
          updates.badge = (anatomy && (values.badge as string)) || undefined;

          // Add type-specific properties and validation
          // Always preserve requiredMessage from form values
          const requiredMessage = (validationValues?.requiredMessage as string) || undefined;

          if (newType === 'number' || newType === 'slider') {
            updates.min = values.min as number | undefined;
            updates.max = values.max as number | undefined;
            updates.step = values.step as number | undefined;
            // Number validation
            updates.validation = {
              integer: validationValues?.integer as boolean | undefined,
              requiredMessage,
            };
          } else if (newType === 'file') {
            updates.accept = (values.accept as string) || undefined;
            updates.multiple = values.multiple as boolean;
            // File validation - convert MB back to bytes
            const maxFileSizeMB = validationValues?.maxFileSize as number | undefined;
            updates.validation = {
              maxFileSize: maxFileSizeMB ? maxFileSizeMB * 1024 * 1024 : undefined,
              maxFiles: validationValues?.maxFiles as number | undefined,
              requiredMessage,
            };
          } else if (newType === 'text' || newType === 'textarea' || newType === 'email') {
            // Text validation
            updates.validation = {
              minLength: validationValues?.minLength as number | undefined,
              maxLength: validationValues?.maxLength as number | undefined,
              pattern: (validationValues?.pattern as string) || undefined,
              patternMessage: (validationValues?.patternMessage as string) || undefined,
              requiredMessage,
            };
          } else {
            // For types without specific validation, still preserve requiredMessage
            if (requiredMessage) {
              updates.validation = { requiredMessage };
            }
          }

          // Clear properties from previous type if type changed
          if (newType !== currentTypeRef.type) {
            // Preserve requiredMessage across type changes
            const preservedRequiredMessage = field.validation?.requiredMessage;

            updates.options = undefined;
            updates.min = undefined;
            updates.max = undefined;
            updates.step = undefined;
            updates.accept = undefined;
            updates.multiple = undefined;
            updates.validation = undefined;

            // Re-add for new type, preserving requiredMessage
            if (newType === 'number' || newType === 'slider') {
              updates.min = values.min as number | undefined;
              updates.max = values.max as number | undefined;
              updates.step = values.step as number | undefined;
              updates.validation = {
                integer: validationValues?.integer as boolean | undefined,
                requiredMessage: preservedRequiredMessage,
              };
            } else if (newType === 'file') {
              updates.accept = (values.accept as string) || undefined;
              updates.multiple = values.multiple as boolean;
              const maxFileSizeMB = validationValues?.maxFileSize as number | undefined;
              updates.validation = {
                maxFileSize: maxFileSizeMB ? maxFileSizeMB * 1024 * 1024 : undefined,
                maxFiles: validationValues?.maxFiles as number | undefined,
                requiredMessage: preservedRequiredMessage,
              };
            } else if (newType === 'text' || newType === 'textarea' || newType === 'email') {
              updates.validation = {
                minLength: validationValues?.minLength as number | undefined,
                maxLength: validationValues?.maxLength as number | undefined,
                pattern: (validationValues?.pattern as string) || undefined,
                patternMessage: (validationValues?.patternMessage as string) || undefined,
                requiredMessage: preservedRequiredMessage,
              };
            } else {
              // For types without specific validation (checkbox, switch, date, datetime, select, etc.)
              // Still preserve the requiredMessage
              if (preservedRequiredMessage) {
                updates.validation = {
                  requiredMessage: preservedRequiredMessage,
                };
              }
            }
            currentTypeRef.type = newType;
          }

          onUpdate(updates);
        },
      },
    ],
    [onUpdate, currentTypeRef, field.validation?.requiredMessage]
  );

  // Check if field type needs options editor
  const needsOptions = ['select', 'multiselect', 'radio'].includes(field.type);

  return (
    <div className="space-y-2">
      {isDuplicateName && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Field name &quot;{attemptedName}&quot; already exists. Please use a unique name.
          </span>
        </div>
      )}
      <MetadataForm key={field.id} schema={schema} plugins={plugins} autoComplete="off" />

      {/* Options Editor - rendered separately since it's complex */}
      {needsOptions && (
        <Accordion type="multiple" defaultValue={['options']}>
          <AccordionItem value="options" className="border rounded-lg px-3">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Options
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <FieldOptionsEditor
                options={field.options || []}
                onChange={(options) => onUpdate({ options })}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Data Source Editor */}
      <Accordion type="multiple" defaultValue={['data-source']}>
        <AccordionItem value="data-source" className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data source
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <DataSourceEditor
              dataSource={field.dataSource}
              onChange={(dataSource) => onUpdate({ dataSource })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Rules Editor */}
      <Accordion type="multiple" defaultValue={['rules']}>
        <AccordionItem value="rules" className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Rules & conditions
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {/* Keyed, so the editor's own rules never carry over to another field. */}
            <FieldRulesEditor
              key={field.id}
              field={field}
              allFields={allFields}
              onUpdate={onUpdate}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function FormDesigner() {
  const [formTitle, setFormTitle] = useState('My Custom Form');
  const [formDescription, setFormDescription] = useState('');
  const [sections, setSections] = useState<ExtendedSectionConfig[]>([
    {
      id: 'section-1',
      title: 'General Information',
      collapsible: false,
      defaultExpanded: true,
      fields: [
        {
          id: '1',
          name: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your name',
        },
      ],
    },
  ]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>('section-1');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('1');
  const [expandedSections, setExpandedSections] = useState<string[]>(['section-1']);
  const [previewDisabled, setPreviewDisabled] = useState(false);

  // Get all fields across all sections for rules editor
  const allFields = sections.flatMap((s) => s.fields);
  const ruleOptions = useRuleOptions(allFields);
  // Each field's last name that was not blank, for a rename typed over a cleared name.
  const lastNames = useRef(new Map<string, string>());
  useEffect(() => {
    for (const field of allFields) if (field.name) lastNames.current.set(field.id, field.name);
  });

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedField = allFields.find((f) => f.id === selectedFieldId);

  // Generate the form schema from current configuration
  const generatedSchema: FormSchema = {
    id: 'custom-form',
    title: formTitle,
    description: formDescription || undefined,
    mode: 'onChange', // Validate on every change for immediate feedback in preview
    reValidateMode: 'onChange', // Re-validate on change after first validation
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      collapsible: section.collapsible,
      defaultExpanded: section.defaultExpanded,
      fields: section.fields.map((field) => {
        const { id: _id, validation: _validationConfig, ...fieldMeta } = field;
        // Build ValidationConfig from field config
        const validationConfig = buildValidationConfig(field);
        return {
          ...fieldMeta,
          validation: validationConfig,
        } as FieldMetadata;
      }),
    })),
  };

  // Section management
  const addSection = () => {
    const newSection: ExtendedSectionConfig = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      collapsible: true,
      defaultExpanded: true,
      fields: [],
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    setSelectedFieldId(null);
    setExpandedSections([...expandedSections, newSection.id]);
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) return; // Keep at least one section
    setSections(sections.filter((s) => s.id !== id));
    setExpandedSections(expandedSections.filter((sId) => sId !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(sections[0]?.id || null);
      setSelectedFieldId(null);
    }
  };

  const updateSection = (id: string, updates: Partial<ExtendedSectionConfig>) => {
    // Prevent duplicate section IDs - strip out ID change if it would create a duplicate
    let finalUpdates = updates;
    if (updates.id && updates.id !== id) {
      const idExists = sections.some((s) => s.id === updates.id);
      if (idExists) {
        // Remove id from updates to prevent duplicate
        const { id: _id, ...rest } = updates;
        finalUpdates = rest;
      }
    }
    setSections(sections.map((s) => (s.id === id ? { ...s, ...finalUpdates } : s)));
    // Update selectedSectionId and expandedSections if the section ID changed
    if (finalUpdates.id && finalUpdates.id !== id) {
      if (selectedSectionId === id) {
        setSelectedSectionId(finalUpdates.id);
      }
      setExpandedSections(expandedSections.map((sId) => (sId === id ? finalUpdates.id! : sId)));
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;

    const newSections = [...sections];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < sections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    setSections(newSections);
  };

  // Field management (within sections)
  const addField = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newField: ExtendedFieldConfig = {
      id: Date.now().toString(),
      name: `field_${allFields.length + 1}`,
      type: 'text',
      label: `Field ${allFields.length + 1}`,
    };

    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s))
    );
    setSelectedSectionId(sectionId);
    setSelectedFieldId(newField.id);
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s
      )
    );
    if (selectedFieldId === fieldId) {
      const section = sections.find((s) => s.id === sectionId);
      setSelectedFieldId(section?.fields[0]?.id || null);
    }
  };

  const updateField = (fieldId: string, updates: Partial<ExtendedFieldConfig>) => {
    // Use functional updater to handle batched updates correctly
    setSections((prevSections) => {
      // Get all fields from previous state for duplicate check
      const prevAllFields = prevSections.flatMap((s) => s.fields);

      // Prevent duplicate field names - strip out name change if it would create a duplicate
      let finalUpdates = updates;
      if (updates.name) {
        const currentField = prevAllFields.find((f) => f.id === fieldId);
        if (currentField && updates.name !== currentField.name) {
          const nameExists = prevAllFields.some((f) => f.id !== fieldId && f.name === updates.name);
          if (nameExists) {
            // Remove name from updates to prevent duplicate
            const { name: _name, ...rest } = updates;
            finalUpdates = rest;
          }
        }
      }

      // Rules name fields by their name, so a rename follows into every field's rules. Clearing the
      // name to retype it renames from the last one it had.
      const previousName =
        prevAllFields.find((f) => f.id === fieldId)?.name || lastNames.current.get(fieldId);
      const renamed =
        finalUpdates.name && previousName && finalUpdates.name !== previousName
          ? { from: previousName, to: finalUpdates.name }
          : undefined;
      const follow = (f: ExtendedFieldConfig) =>
        renamed && f.rules
          ? { ...f, rules: renameFieldInRules(f.rules, renamed.from, renamed.to) }
          : f;

      return prevSections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => follow(f.id === fieldId ? { ...f, ...finalUpdates } : f)),
      }));
    });
  };

  const moveField = (sectionId: string, fieldId: string, direction: 'up' | 'down') => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const index = section.fields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;

    const newFields = [...section.fields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }

    setSections(sections.map((s) => (s.id === sectionId ? { ...s, fields: newFields } : s)));
  };

  return (
    <Grid gap={3} h="screen" p={3} className="lg:grid-cols-[2fr_3fr_3fr]">
      {/* Left Panel - Sections & Fields */}
      <Card className="overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Sections
              </CardTitle>
              <CardDescription>Organize fields into sections</CardDescription>
            </div>
            <Button onClick={addSection} variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto px-2 pb-2">
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-1"
          >
            {sections.map((section, sectionIndex) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className={`group/section border rounded-lg ${selectedSectionId === section.id && !selectedFieldId ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <AccordionTrigger
                    aria-label={`Toggle section ${section.title}`}
                    className="h-5 w-5 p-0 hover:no-underline hover:bg-accent rounded [&>svg]:hidden flex items-center justify-center shrink-0"
                  >
                    <span className="flex items-center justify-center">
                      <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
                    </span>
                  </AccordionTrigger>
                  <button
                    type="button"
                    tabIndex={0}
                    className="flex-1 min-w-0 cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0 text-left"
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setSelectedFieldId(null);
                    }}
                  >
                    <span className="text-sm font-medium truncate">{section.title}</span>
                    {section.collapsible && (
                      <span className="text-[10px] text-muted-foreground">(collapsible)</span>
                    )}
                  </button>
                  <div className="flex gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, 'up');
                      }}
                      disabled={sectionIndex === 0}
                      aria-label={`Move section ${section.title} up`}
                    >
                      <MoveUp className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, 'down');
                      }}
                      disabled={sectionIndex === sections.length - 1}
                      aria-label={`Move section ${section.title} down`}
                    >
                      <MoveDown className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSection(section.id);
                      }}
                      disabled={sections.length <= 1}
                      aria-label={`Delete section ${section.title}`}
                    >
                      <Trash2 className="h-2.5 w-2.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <AccordionContent className="px-2 pb-2 pt-0">
                  <div className="space-y-0.5 ml-3 border-l pl-2">
                    {section.fields.map((field, fieldIndex) => (
                      // biome-ignore lint/a11y/useSemanticElements: Interactive field item in list needs div for proper layout with drag handles
                      <div
                        key={field.id}
                        role="button"
                        tabIndex={0}
                        className={`group/field flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                          selectedFieldId === field.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          setSelectedFieldId(field.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedSectionId(section.id);
                            setSelectedFieldId(field.id);
                          }
                        }}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-50" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium truncate">{field.label}</span>
                            {field.rules?.some((r) => r.effects.required) && (
                              <RequiredIndicator className="ml-0 text-[10px]" />
                            )}
                            {rulesNeedAttention(field.rules, ruleOptions) && (
                              <AlertTriangle
                                role="img"
                                aria-label="Rules need attention"
                                className="h-3 w-3 shrink-0 text-destructive"
                              />
                            )}
                          </div>
                          <div className="text-[9px] text-muted-foreground">
                            {field.type}
                            {field.valueModes && ` · ${field.valueModes.modes.length} modes`}
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover/field:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveField(section.id, field.id, 'up');
                            }}
                            disabled={fieldIndex === 0}
                            aria-label={`Move field ${field.label} up`}
                          >
                            <MoveUp className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveField(section.id, field.id, 'down');
                            }}
                            disabled={fieldIndex === section.fields.length - 1}
                            aria-label={`Move field ${field.label} down`}
                          >
                            <MoveDown className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(section.id, field.id);
                            }}
                            aria-label={`Delete field ${field.label}`}
                          >
                            <Trash2 className="h-2.5 w-2.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button onClick={() => addField(section.id)} variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Field
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Middle Panel - Configuration */}
      <Card className="overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {selectedFieldId
              ? 'Field configuration'
              : selectedSectionId
                ? 'Section configuration'
                : 'Configuration'}
          </CardTitle>
          <CardDescription>
            {selectedField
              ? `Configure "${selectedField.label}"`
              : selectedSection
                ? `Configure "${selectedSection.title}" section`
                : 'Select a section or field to configure'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {selectedField ? (
            <FieldConfigForm
              field={selectedField}
              onUpdate={(updates) => updateField(selectedField.id, updates)}
              allFields={allFields}
              existingFieldNames={new Set(allFields.map((f) => f.name))}
            />
          ) : selectedSection ? (
            <SectionConfigForm
              section={selectedSection}
              onUpdate={(updates) => updateSection(selectedSection.id, updates)}
              existingSectionIds={new Set(sections.map((s) => s.id))}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a section or field to configure
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - Preview and Code */}
      <Card className="overflow-hidden flex flex-col">
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <View className="h-4 w-4" />
                Preview & export
              </CardTitle>
              <CardDescription>See how your form looks</CardDescription>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-title">Form title</Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">Form description</Label>
              <Textarea
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="h-4 w-4 mr-2" />
                Schema
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 overflow-auto">
              <div className="flex items-center justify-end gap-2 mb-4 pb-2 border-b">
                <Label htmlFor="preview-readonly" className="text-sm text-muted-foreground">
                  Readonly
                </Label>
                <Switch
                  id="preview-readonly"
                  checked={previewDisabled}
                  onCheckedChange={setPreviewDisabled}
                />
              </div>
              <MetadataForm
                key={sections
                  .map(
                    (s) =>
                      `${s.id}:${s.collapsible}:${s.defaultExpanded}:${s.fields.map((f) => `${f.id}:${f.type}:${f.name}:${JSON.stringify(f.rules || [])}:${JSON.stringify(f.validation || {})}:${JSON.stringify(f.valueModes || {})}`).join('-')}`
                  )
                  .join(',')}
                schema={generatedSchema}
                plugins={PREVIEW_PLUGINS}
                onSubmit={(data) => {
                  console.log('Form submitted:', data);
                  alert('Form submitted! Check console for data.');
                }}
                disabled={previewDisabled}
                autoComplete="off"
              />
            </TabsContent>
            <TabsContent value="code" className="flex-1 overflow-auto">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-full">
                {schemaToJson(generatedSchema)}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Grid>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface FieldOptionsEditorProps {
  options: OptionItem[];
  onChange: (options: OptionItem[]) => void;
}

function FieldOptionsEditor({ options, onChange }: FieldOptionsEditorProps) {
  const addOption = () => {
    onChange([
      ...options,
      {
        label: `Option ${options.length + 1}`,
        value: `option${options.length + 1}`,
      },
    ]);
  };

  const updateOption = (index: number, updates: Partial<OptionItem>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div key={index} className="flex gap-2 items-center">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Input
              placeholder="Label"
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
            />
            <Input
              placeholder="Value"
              value={option.value}
              onChange={(e) => updateOption(index, { value: e.target.value })}
            />
          </div>
          <Button
            variant="ghost"
            size="xs"
            icon
            className="text-muted-foreground hover:text-destructive"
            onClick={() => removeOption(index)}
            aria-label="Remove option"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button onClick={addOption} variant="outline" size="sm" className="w-full">
        <Plus className="h-3 w-3 mr-2" />
        Add option
      </Button>
    </div>
  );
}

interface DataSourceEditorProps {
  dataSource?: DataSource;
  onChange: (dataSource?: DataSource) => void;
}

function DataSourceEditor({ dataSource, onChange }: DataSourceEditorProps) {
  const [sourceType, setSourceType] = useState<string>(dataSource?.type || 'none');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Data source type</Label>
        <Select
          value={sourceType}
          onValueChange={(value) => {
            setSourceType(value);
            if (value === 'none') {
              onChange(undefined);
            } else if (value === 'static') {
              onChange({ type: 'static', options: [] });
            } else if (value === 'fetch') {
              onChange({ type: 'fetch', url: '', method: 'GET' });
            } else if (value === 'remote') {
              onChange({ type: 'remote', endpoint: '', params: {} });
            } else if (value === 'computed') {
              onChange({ type: 'computed', dependency: [], compute: '' });
            }
          }}
        >
          <SelectTrigger aria-label="Data source type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="fetch">Fetch (single request)</SelectItem>
            <SelectItem value="remote">Remote (dependent)</SelectItem>
            <SelectItem value="computed">Computed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sourceType === 'fetch' && dataSource?.type === 'fetch' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>API URL</Label>
            <Input
              placeholder="/api/data"
              value={dataSource.url}
              onChange={(e) => onChange({ ...dataSource, url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Transform</Label>
            <Textarea
              placeholder="data.map(item => ({ label: item.name, value: item.id }))"
              value={dataSource.transform || ''}
              onChange={(e) => onChange({ ...dataSource, transform: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      )}

      {sourceType === 'remote' && dataSource?.type === 'remote' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Input
              placeholder="/api/data"
              value={dataSource.endpoint}
              onChange={(e) => onChange({ ...dataSource, endpoint: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Parameters (JSON)</Label>
            <Textarea
              placeholder='{ "fieldName": "$otherField" }'
              value={JSON.stringify(dataSource.params || {}, null, 2)}
              onChange={(e) => {
                try {
                  const params = JSON.parse(e.target.value);
                  onChange({ ...dataSource, params });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              rows={3}
            />
          </div>
        </div>
      )}

      {sourceType === 'computed' && dataSource?.type === 'computed' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Dependencies (comma-separated)</Label>
            <Input
              placeholder="field1, field2"
              value={dataSource.dependency.join(', ')}
              onChange={(e) =>
                onChange({
                  ...dataSource,
                  dependency: e.target.value.split(',').map((s) => s.trim()),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Compute expression</Label>
            <Textarea
              placeholder="(field1 || 0) * (field2 || 0)"
              value={dataSource.compute}
              onChange={(e) => onChange({ ...dataSource, compute: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Field rules
// ============================================================================

const DESIGNER_OUTCOMES: FieldRuleOutcome[] = [
  { value: 'show', label: 'Show', effects: { visible: true } },
  { value: 'hide', label: 'Hide', effects: { visible: false } },
  { value: 'require', label: 'Require', effects: { required: true } },
  { value: 'disable', label: 'Disable', effects: { disabled: true } },
];

const ALWAYS_REQUIRED_ID = 'always-required';
const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/**
 * A field as rules can compare it. A date with a time compares by its day, as RulesEngine reads a
 * picked date against a `yyyy-MM-dd` value. Anything else, such as files, several options, a list
 * or a custom value of no known shape, can only be checked for being empty.
 */
function ruleFieldFor(field: ExtendedFieldConfig): FieldRuleField {
  const base = { value: field.name, label: field.label || field.name };
  const enumOf = (options: readonly { label: string; value: unknown }[]) =>
    options.map((option) => ({ value: String(option.value), label: option.label }));
  const boolean = {
    ...base,
    type: 'enum',
    valueType: 'boolean',
    options: BOOLEAN_OPTIONS,
  } as const;
  switch (field.type) {
    case 'text':
    case 'email':
    case 'textarea':
      return { ...base, type: 'string' };
    case 'number':
    case 'slider':
      return { ...base, type: 'number' };
    case 'date':
    case 'datetime':
      return { ...base, type: 'date' };
    case 'select':
    case 'radio':
      return { ...base, type: 'enum', options: enumOf(field.options ?? []) };
    case 'checkbox':
    case 'switch':
    case 'boolean':
      return boolean;
    case 'custom': {
      // An imported custom field keeps the shape its schema declared.
      const { valueType } = field as { valueType?: CustomValueType };
      if (valueType === 'string') return { ...base, type: 'string' };
      if (valueType === 'number') return { ...base, type: 'number' };
      if (valueType === 'boolean') return boolean;
      return { ...base, type: 'other' };
    }
    default:
      return { ...base, type: 'other' };
  }
}

/** The rules' options for a form's fields, by what the rules can see of them. */
function useRuleOptions(allFields: ExtendedFieldConfig[]): FieldRulesOptions {
  // A field is named by its name, so one being renamed past a blank name is left out meanwhile.
  const fields = allFields.flatMap((field) => (field.name ? ruleFieldFor(field) : []));
  const key = JSON.stringify(fields);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the fields are read through their key
  return useMemo(() => ({ outcomes: DESIGNER_OUTCOMES, fields }), [key]);
}

/** Whether the stored rules include one the editor would flag, such as on a removed field. */
function rulesNeedAttention(rules: FieldRule[] | undefined, options: FieldRulesOptions) {
  if (!rules?.length) return false;
  const vocabulary = { ...options, ...rulesEngineVocabulary };
  return findRuleIssues(fromFieldRules(rules, options), vocabulary, rulesEngineDialect).length > 0;
}

const isAlwaysRequired = (rule: Rule) => rule.outcome === 'require' && isUnconditionalRule(rule);

interface FieldRulesEditorProps {
  field: ExtendedFieldConfig;
  allFields: ExtendedFieldConfig[];
  onUpdate: (updates: Partial<ExtendedFieldConfig>) => void;
}

/**
 * The field's rules in a RulesEditor, stored as RulesEngine `FieldRule`s through `useFieldRules`.
 * Always required is its own checkbox, standing for a Require rule with no conditions, which the
 * schema also writes as `validation.required` with the field's message.
 */
function FieldRulesEditor({ field, allFields, onUpdate }: FieldRulesEditorProps) {
  const options = useRuleOptions(allFields);
  const requiredMessage = field.validation?.requiredMessage;
  const editor = useFieldRules(
    { rules: field.rules },
    ({ rules }) => {
      const stillRequired = rules.some(
        (rule) => rule.effects.required === true && rule.conditions.length === 0
      );
      onUpdate({
        // The hook knows its own emitted array, so an emptied one keeps an unfinished draft open;
        // the schema leaves empty rules out.
        rules,
        // The message is for the field's own requirement, so it goes with it.
        ...(stillRequired || !requiredMessage
          ? {}
          : { validation: { ...field.validation, requiredMessage: undefined } }),
      });
    },
    options
  );

  const alwaysRequired = editor.value.find(isAlwaysRequired);
  const rules = alwaysRequired
    ? editor.value.filter((rule) => rule !== alwaysRequired)
    : editor.value;
  // Every rule sets `required` to true or not at all, so where the checkbox's rule goes is moot.
  const changeRules = (next: Rule[]) =>
    editor.onChange(alwaysRequired ? [...next, alwaysRequired] : next);
  const setAlwaysRequired = (on: boolean) =>
    editor.onChange(
      on
        ? [
            ...editor.value,
            createRule({
              id: ALWAYS_REQUIRED_ID,
              outcome: 'require',
              conditions: createConditionGroup(),
            }),
          ]
        : [...rules]
    );

  // Its messages open as each rule mounts, so a field added, renamed or removed remounts it:
  // a rule that broke shows why at once. One added since is flagged once it is left.
  const editorKey = options.fields.map((option) => option.value).join('\n');
  // biome-ignore lint/correctness/useExhaustiveDependencies: read as the editor mounts, by its key
  const touched = useMemo(() => issueIds(editor.issues), [editorKey]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Asterisk className="h-5 w-5 text-error" />
            <div>
              <Label htmlFor={`always-required-${field.id}`} className="cursor-pointer font-medium">
                Always required
              </Label>
              <p className="text-xs text-muted-foreground">Field must always have a value</p>
            </div>
          </div>
          <Checkbox
            id={`always-required-${field.id}`}
            checked={!!alwaysRequired}
            onCheckedChange={(checked) => setAlwaysRequired(checked === true)}
          />
        </div>
        {alwaysRequired && (
          <div className="space-y-1.5 pl-8">
            <Label htmlFor="required-message" className="text-xs text-muted-foreground">
              Error message
            </Label>
            <Input
              id="required-message"
              placeholder="This field is required"
              value={requiredMessage || ''}
              onChange={(e) =>
                onUpdate({
                  validation: { ...field.validation, requiredMessage: e.target.value || undefined },
                })
              }
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>

      <RulesEditor
        key={editorKey}
        label="Field rules"
        value={rules}
        onChange={changeRules}
        outcomes={DESIGNER_OUTCOMES}
        fields={options.fields}
        operators={rulesEngineVocabulary.operators}
        valueModes={rulesEngineVocabulary.valueModes}
        dialect={rulesEngineDialect}
        defaultTouched={touched}
      />
    </div>
  );
}
