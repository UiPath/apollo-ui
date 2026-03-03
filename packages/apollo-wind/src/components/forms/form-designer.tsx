import {
  AlertTriangle,
  Asterisk,
  Ban,
  ChevronRight,
  Code,
  Database,
  Eye,
  EyeOff,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid } from '@/components/ui/layout/grid';
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
import type {
  DataSource,
  FieldCondition,
  FieldMetadata,
  FieldRule,
  FieldType,
  FormPlugin,
  FormSchema,
  ValidationConfig,
} from './form-schema';
import { MetadataForm } from './metadata-form';
import { schemaToJson } from './schema-serializer';

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
 * Complete mapping of all supported field types
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
  const currentTypeRef = useRef(field.type);

  useEffect(() => {
    currentTypeRef.current = field.type;
  }, [field.type]);

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
          if (newType !== currentTypeRef.current) {
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
            currentTypeRef.current = newType;
          }

          onUpdate(updates);
        },
      },
    ],
    [onUpdate, field.validation?.requiredMessage]
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
            <RulesEditor
              rules={field.rules}
              onChange={(rules) => onUpdate({ rules })}
              allFields={allFields}
              requiredMessage={field.validation?.requiredMessage}
              onRequiredMessageChange={(message) =>
                onUpdate({
                  validation: { ...field.validation, requiredMessage: message },
                })
              }
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

      return prevSections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...finalUpdates } : f)),
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
                  <AccordionTrigger className="h-5 w-5 p-0 hover:no-underline hover:bg-accent rounded [&>svg]:hidden flex items-center justify-center shrink-0">
                    <span className="flex items-center justify-center">
                      <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
                    </span>
                  </AccordionTrigger>
                  <div
                    className="flex-1 min-w-0 cursor-pointer flex items-center gap-1"
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setSelectedFieldId(null);
                    }}
                  >
                    <span className="text-sm font-medium truncate">{section.title}</span>
                    {section.collapsible && (
                      <span className="text-[10px] text-muted-foreground">(collapsible)</span>
                    )}
                  </div>
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
                    >
                      <Trash2 className="h-2.5 w-2.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <AccordionContent className="px-2 pb-2 pt-0">
                  <div className="space-y-0.5 ml-3 border-l pl-2">
                    {section.fields.map((field, fieldIndex) => (
                      <div
                        key={field.id}
                        className={`group/field flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                          selectedFieldId === field.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          setSelectedFieldId(field.id);
                        }}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover/field:opacity-50" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium truncate">{field.label}</span>
                            {field.rules?.some((r) => r.effects.required) && (
                              <span className="text-[10px] text-destructive">*</span>
                            )}
                          </div>
                          <div className="text-[9px] text-muted-foreground">{field.type}</div>
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
                      `${s.id}:${s.collapsible}:${s.defaultExpanded}:${s.fields.map((f) => `${f.id}:${f.type}:${f.name}:${JSON.stringify(f.rules || [])}:${JSON.stringify(f.validation || {})}`).join('-')}`
                  )
                  .join(',')}
                schema={generatedSchema}
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
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => removeOption(index)}
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
          <SelectTrigger>
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
// Condition Operator Types
// ============================================================================

type ConditionOperator = 'is' | 'isNot' | 'in' | 'notIn' | 'matches';

const CONDITION_OPERATORS: {
  value: ConditionOperator;
  label: string;
  description: string;
}[] = [
  { value: 'is', label: 'equals', description: 'Field value equals' },
  {
    value: 'isNot',
    label: 'not equals',
    description: 'Field value does not equal',
  },
  { value: 'in', label: 'is one of', description: 'Field value is one of' },
  {
    value: 'notIn',
    label: 'is not one of',
    description: 'Field value is not one of',
  },
  {
    value: 'matches',
    label: 'matches pattern',
    description: 'Field value matches regex',
  },
];

type RuleEffect = 'show' | 'hide' | 'require' | 'disable';

const RULE_EFFECTS: {
  value: RuleEffect;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: 'show',
    label: 'Show field',
    description: 'Show this field when conditions are met',
    Icon: Eye,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    value: 'hide',
    label: 'Hide field',
    description: 'Hide this field when conditions are met',
    Icon: EyeOff,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    value: 'require',
    label: 'Make required',
    description: 'Require this field when conditions are met',
    Icon: Asterisk,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    value: 'disable',
    label: 'Disable field',
    description: 'Disable this field when conditions are met',
    Icon: Ban,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
];

// ============================================================================
// Rules Editor Component
// ============================================================================

interface RulesEditorProps {
  rules?: FieldRule[];
  onChange: (rules?: FieldRule[]) => void;
  allFields: ExtendedFieldConfig[];
  requiredMessage?: string;
  onRequiredMessageChange: (message: string | undefined) => void;
}

function RulesEditor({
  rules = [],
  onChange,
  allFields,
  requiredMessage,
  onRequiredMessageChange,
}: RulesEditorProps) {
  // State for the new rule builder
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  // New rule state
  const [selectedEffect, setSelectedEffect] = useState<RuleEffect>('show');
  const [conditions, setConditions] = useState<
    { field: string; operator: ConditionOperator; value: string }[]
  >([{ field: '', operator: 'is', value: '' }]);
  const [conditionOperator, setConditionOperator] = useState<'AND' | 'OR'>('AND');

  // Check if field is always required (has required rule with no conditions)
  const isAlwaysRequired = rules.some(
    (r) => r.effects.required === true && r.conditions.length === 0
  );

  const resetBuilder = () => {
    setSelectedEffect('show');
    setConditions([{ field: '', operator: 'is', value: '' }]);
    setConditionOperator('AND');
    setIsAddingRule(false);
    setEditingRuleIndex(null);
  };

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'is', value: '' }]);
  };

  const updateCondition = (
    index: number,
    updates: Partial<{
      field: string;
      operator: ConditionOperator;
      value: string;
    }>
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const buildCondition = (cond: {
    field: string;
    operator: ConditionOperator;
    value: string;
  }): FieldCondition => {
    const condition: FieldCondition = { when: cond.field };

    // Get the target field to determine its type
    const targetField = allFields.find((f) => f.name === cond.field);
    const isNumericField = targetField?.type === 'number' || targetField?.type === 'slider';
    const isBooleanField = targetField?.type === 'checkbox' || targetField?.type === 'switch';

    // Parse value based on the target field's type
    const parseValue = (val: string): unknown => {
      // For boolean fields, parse true/false
      if (isBooleanField) {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }

      // For numeric fields, try to parse as number
      if (isNumericField) {
        const num = Number(val);
        if (!Number.isNaN(num)) return num;
      }

      // For text-based fields, keep as string
      // But still handle explicit booleans for special cases
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;

      return val;
    };

    switch (cond.operator) {
      case 'is':
        condition.is = parseValue(cond.value);
        break;
      case 'isNot':
        condition.isNot = parseValue(cond.value);
        break;
      case 'in':
        condition.in = cond.value.split(',').map((v) => parseValue(v.trim()));
        break;
      case 'notIn':
        condition.notIn = cond.value.split(',').map((v) => parseValue(v.trim()));
        break;
      case 'matches':
        condition.matches = cond.value;
        break;
    }

    return condition;
  };

  const saveRule = () => {
    // Validate that all conditions have fields selected
    const validConditions = conditions.filter((c) => c.field);
    if (validConditions.length === 0) return;

    const newRule: FieldRule = {
      id: `rule-${Date.now()}`,
      conditions: validConditions.map(buildCondition),
      operator: conditionOperator,
      effects: {},
    };

    // Set effects based on selected effect type
    switch (selectedEffect) {
      case 'show':
        newRule.effects.visible = true;
        break;
      case 'hide':
        newRule.effects.visible = false;
        break;
      case 'require':
        newRule.effects.required = true;
        break;
      case 'disable':
        newRule.effects.disabled = true;
        break;
    }

    if (editingRuleIndex !== null) {
      // Update existing rule
      const newRules = [...rules];
      newRules[editingRuleIndex] = newRule;
      onChange(newRules);
    } else {
      // Add new rule
      onChange([...rules, newRule]);
    }

    resetBuilder();
  };

  const editRule = (index: number) => {
    const rule = rules[index];
    if (!rule) return;

    // Determine effect type from rule
    let effect: RuleEffect = 'show';
    if (rule.effects.visible === true) effect = 'show';
    else if (rule.effects.visible === false) effect = 'hide';
    else if (rule.effects.required === true) effect = 'require';
    else if (rule.effects.disabled === true) effect = 'disable';

    setSelectedEffect(effect);
    setConditionOperator(rule.operator || 'AND');

    // Convert conditions back to editable form
    const editableConditions = rule.conditions.map((cond) => {
      let operator: ConditionOperator = 'is';
      let value = '';

      if (cond.is !== undefined) {
        operator = 'is';
        value = String(cond.is);
      } else if (cond.isNot !== undefined) {
        operator = 'isNot';
        value = String(cond.isNot);
      } else if (cond.in !== undefined) {
        operator = 'in';
        value = cond.in.map(String).join(', ');
      } else if (cond.notIn !== undefined) {
        operator = 'notIn';
        value = cond.notIn.map(String).join(', ');
      } else if (cond.matches !== undefined) {
        operator = 'matches';
        value = cond.matches;
      }

      return { field: cond.when, operator, value };
    });

    setConditions(
      editableConditions.length > 0
        ? editableConditions
        : [{ field: '', operator: 'is', value: '' }]
    );
    setEditingRuleIndex(index);
    setIsAddingRule(true);
  };

  const deleteRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const getFieldLabel = (fieldName: string) => {
    const field = allFields.find((f) => f.name === fieldName);
    return field?.label || fieldName;
  };

  const describeRule = (rule: FieldRule): string => {
    if (rule.conditions.length === 0) {
      if (rule.effects.required) return 'Always required';
      return 'Always applies';
    }

    const conditionDescriptions = rule.conditions.map((cond) => {
      const fieldLabel = getFieldLabel(cond.when);
      if (cond.is !== undefined) return `"${fieldLabel}" = ${JSON.stringify(cond.is)}`;
      if (cond.isNot !== undefined) return `"${fieldLabel}" ≠ ${JSON.stringify(cond.isNot)}`;
      if (cond.in !== undefined)
        return `"${fieldLabel}" in [${cond.in.map((v) => JSON.stringify(v)).join(', ')}]`;
      if (cond.notIn !== undefined)
        return `"${fieldLabel}" not in [${cond.notIn.map((v) => JSON.stringify(v)).join(', ')}]`;
      if (cond.matches !== undefined) return `"${fieldLabel}" matches /${cond.matches}/`;
      return `"${fieldLabel}"`;
    });

    const operator = rule.operator === 'OR' ? ' OR ' : ' AND ';
    return conditionDescriptions.join(operator);
  };

  const getEffectDescription = (rule: FieldRule): { label: string; color: string } => {
    if (rule.effects.visible === true)
      return { label: 'Show', color: 'text-green-600 bg-green-50' };
    if (rule.effects.visible === false)
      return { label: 'Hide', color: 'text-orange-600 bg-orange-50' };
    if (rule.effects.required === true)
      return { label: 'Required', color: 'text-red-600 bg-red-50' };
    if (rule.effects.disabled === true)
      return { label: 'Disabled', color: 'text-gray-600 bg-gray-50' };
    return { label: 'Unknown', color: 'text-muted-foreground bg-muted' };
  };

  // Get options for a specific field (for in/notIn suggestions)
  const getFieldOptions = (fieldName: string) => {
    const field = allFields.find((f) => f.name === fieldName);
    return field?.options || [];
  };

  return (
    <div className="space-y-4">
      {/* Always Required Toggle */}
      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Asterisk className="h-5 w-5 text-red-500" />
            <div>
              <Label className="cursor-pointer font-medium">Always required</Label>
              <p className="text-xs text-muted-foreground">Field must always have a value</p>
            </div>
          </div>
          <Checkbox
            checked={isAlwaysRequired}
            onCheckedChange={(checked) => {
              if (checked) {
                const requiredRule: FieldRule = {
                  id: 'always-required',
                  conditions: [],
                  operator: 'AND',
                  effects: { required: true },
                };
                onChange([
                  ...rules.filter((r) => !(r.effects.required && r.conditions.length === 0)),
                  requiredRule,
                ]);
              } else {
                onChange(rules.filter((r) => !(r.effects.required && r.conditions.length === 0)));
                // Clear required message when unchecking
                onRequiredMessageChange(undefined);
              }
            }}
          />
        </div>
        {/* Required Error Message - shown when Always Required is checked */}
        {isAlwaysRequired && (
          <div className="space-y-1.5 pl-8">
            <Label htmlFor="required-message" className="text-xs text-muted-foreground">
              Error message
            </Label>
            <Input
              id="required-message"
              placeholder="This field is required"
              value={requiredMessage || ''}
              onChange={(e) => onRequiredMessageChange(e.target.value || undefined)}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>

      {/* Existing Rules */}
      {rules.filter((r) => r.conditions.length > 0 || !r.effects.required).length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Conditional rules
          </Label>
          {rules
            .map((rule, index) => ({ rule, index }))
            .filter(({ rule }) => rule.conditions.length > 0 || !rule.effects.required)
            .map(({ rule, index }) => {
              const effect = getEffectDescription(rule);
              return (
                <div
                  key={index}
                  className="group border rounded-lg p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${effect.color}`}>
                          {effect.label}
                        </span>
                        {rule.conditions.length > 1 && (
                          <span className="text-xs text-muted-foreground">({rule.operator})</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{describeRule(rule)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => editRule(index)}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteRule(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Add/Edit Rule Builder */}
      {isAddingRule ? (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="font-medium">
              {editingRuleIndex !== null ? 'Edit rule' : 'New rule'}
            </Label>
            <Button variant="ghost" size="sm" onClick={resetBuilder}>
              Cancel
            </Button>
          </div>

          {/* Effect Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">When conditions are met:</Label>
            <div className="grid grid-cols-2 gap-2">
              {RULE_EFFECTS.map((effect) => (
                <button
                  key={effect.value}
                  type="button"
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-all ${
                    selectedEffect === effect.value
                      ? `${effect.color} border-current`
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedEffect(effect.value)}
                >
                  <effect.Icon className="h-4 w-4" />
                  <span className="font-medium">{effect.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Conditions:</Label>
              {conditions.length > 1 && (
                <Select
                  value={conditionOperator}
                  onValueChange={(v) => setConditionOperator(v as 'AND' | 'OR')}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">Match ALL</SelectItem>
                    <SelectItem value="OR">Match ANY</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {conditions.map((cond, index) => (
              <div key={index} className="space-y-2">
                {index > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Separator className="flex-1" />
                    <span>{conditionOperator}</span>
                    <Separator className="flex-1" />
                  </div>
                )}
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={cond.field}
                      onValueChange={(v) => updateCondition(index, { field: v })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allFields.map((field) => (
                          <SelectItem key={field.id} value={field.name}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Select
                        value={cond.operator}
                        onValueChange={(v) =>
                          updateCondition(index, {
                            operator: v as ConditionOperator,
                          })
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex-1">
                        {cond.field &&
                        getFieldOptions(cond.field).length > 0 &&
                        (cond.operator === 'is' || cond.operator === 'isNot') ? (
                          <Select
                            value={cond.value}
                            onValueChange={(v) => updateCondition(index, { value: v })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select value..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getFieldOptions(cond.field).map((opt) => (
                                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="h-8 text-sm"
                            placeholder={
                              cond.operator === 'in' || cond.operator === 'notIn'
                                ? 'value1, value2, ...'
                                : cond.operator === 'matches'
                                  ? 'regex pattern'
                                  : 'value'
                            }
                            value={cond.value}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  {conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground"
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full" onClick={addCondition}>
              <Plus className="h-3 w-3 mr-2" />
              Add condition
            </Button>
          </div>

          {/* Save Button */}
          <Button className="w-full" onClick={saveRule} disabled={!conditions.some((c) => c.field)}>
            {editingRuleIndex !== null ? 'Update rule' : 'Add rule'}
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setIsAddingRule(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add conditional rule
        </Button>
      )}
    </div>
  );
}
