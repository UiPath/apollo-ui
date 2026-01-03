import { useRef, useState } from 'react';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Palette,
  Star,
  StarHalf,
  Underline,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Toaster } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CustomFieldComponentProps, FormPlugin, FormSchema } from './form-schema';
import { MetadataForm } from './metadata-form';
import { SchemaViewer } from './schema-viewer';

const meta: Meta<typeof MetadataForm> = {
  title: 'Forms/Custom Controls',
  component: MetadataForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Custom Controls in MetadataForm

The MetadataForm system supports custom field components through a well-defined contract.

## The CustomFieldComponentProps Contract

\`\`\`typescript
interface CustomFieldComponentProps {
  // Core form integration (from react-hook-form)
  value: unknown;           // Current field value
  onChange: (value: unknown) => void;  // Update field value
  onBlur: () => void;       // Trigger validation on blur
  name: string;             // Field name for form registration

  // Metadata context
  field?: FieldMetadata;    // Full field metadata for advanced use cases

  // UI state (managed by rules engine)
  disabled?: boolean;       // Field disabled state
  required?: boolean;       // Field required state
  error?: string;           // Validation error message

  // Custom props (passed via componentProps in schema)
  [key: string]: unknown;
}
\`\`\`

## Registering Custom Components

Custom components must be registered via a plugin's \`onFormInit\` hook:

### Via Plugin (Recommended)
\`\`\`typescript
const myPlugin: FormPlugin = {
  name: "my-components",
  onFormInit: (context) => {
    context.registerCustomComponent("my-rating", RatingInput);
    context.registerCustomComponent("color-picker", ColorPicker);
  },
};

<MetadataForm schema={schema} plugins={[myPlugin]} />
\`\`\`

### Schema Field Definition
\`\`\`typescript
const field: CustomFieldMetadata = {
  type: "custom",
  name: "rating",
  label: "Rating",
  component: "my-rating",  // Maps to registered component
  componentProps: {
    maxStars: 5,
    allowHalf: true,
  },
};
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const schema = context.args.schema as FormSchema | undefined;
      return (
        <>
          {schema && (
            <div className="flex justify-end mb-4">
              <SchemaViewer schema={schema} />
            </div>
          )}
          <Story />
          <Toaster />
        </>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MetadataForm>;

// ============================================================================
// HELPER COMPONENTS & TYPES
// ============================================================================

/**
 * Reusable error message display component
 */
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-destructive">{error}</p>;
}

/**
 * Reusable required field hint component
 */
function RequiredHint({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return <p className="text-xs text-muted-foreground">* {message}</p>;
}

// ============================================================================
// TYPE DEFINITIONS FOR CUSTOM COMPONENTS
// ============================================================================

interface RatingInputProps extends CustomFieldComponentProps {
  maxStars?: number;
  allowHalf?: boolean;
}

interface ColorPickerProps extends CustomFieldComponentProps {
  presetColors?: string[];
  showHexInput?: boolean;
}

interface RichTextInputProps extends CustomFieldComponentProps {
  placeholder?: string;
  rows?: number;
}

interface TemperatureSliderProps extends CustomFieldComponentProps {
  min?: number;
  max?: number;
  unit?: string;
}

type Priority = 'low' | 'medium' | 'high' | 'critical';

interface PriorityOption {
  value: Priority;
  label: string;
  color: string;
}

// ============================================================================
// CUSTOM COMPONENT IMPLEMENTATIONS
// ============================================================================

/**
 * Simple Rating Input Component
 * Demonstrates basic custom control contract compliance.
 */
function RatingInput({
  value,
  onChange,
  onBlur,
  disabled,
  required,
  error,
  maxStars = 5,
  allowHalf = false,
}: RatingInputProps) {
  const rating = (value as number) || 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (star: number, isHalf: boolean) => {
    if (disabled) return;
    const newValue = isHalf && allowHalf ? star - 0.5 : star;
    onChange(newValue);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only trigger onBlur if focus is leaving the container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      onBlur();
    }
  };

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex items-center gap-1" onBlur={handleBlur}>
        {Array.from({ length: maxStars }, (_, i) => {
          const star = i + 1;
          const filled = rating >= star;
          const halfFilled = allowHalf && rating >= star - 0.5 && rating < star;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star, false)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (allowHalf) handleClick(star, true);
              }}
              disabled={disabled}
              className={cn(
                'p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
              )}
              aria-label={`Rate ${star} stars`}
            >
              {halfFilled ? (
                <StarHalf className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ) : (
                <Star
                  className={cn(
                    'w-6 h-6',
                    filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  )}
                />
              )}
            </button>
          );
        })}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating}/${maxStars}` : 'Not rated'}
        </span>
      </div>
      <RequiredHint show={required === true && rating === 0} message="Rating is required" />
      <FieldError error={error} />
    </div>
  );
}

/**
 * Color Picker Component
 * Demonstrates complex custom control with popover UI.
 */
function ColorPicker({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  showHexInput = true,
}: ColorPickerProps) {
  const color = (value as string) || '#3b82f6';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start"
            onBlur={onBlur}
          >
            <div className="w-6 h-6 rounded border mr-2" style={{ backgroundColor: color }} />
            <span className="font-mono text-sm">{color}</span>
            <Palette className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded border-2 transition-all',
                    color === presetColor ? 'border-ring scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor);
                    setIsOpen(false);
                  }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
            {showHexInput && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                  className="font-mono text-sm"
                />
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 p-1 h-10"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <FieldError error={error} />
    </div>
  );
}

/**
 * Rich Text Toolbar Component
 * Demonstrates structured value handling and toggle states.
 */
interface RichTextValue {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

function RichTextInput({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  placeholder = 'Enter formatted text...',
  rows = 3,
}: RichTextInputProps) {
  const richValue: RichTextValue = (value as RichTextValue) || {
    text: '',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
  };

  const updateValue = (updates: Partial<RichTextValue>) => {
    onChange({ ...richValue, ...updates });
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          <Toggle
            size="sm"
            pressed={richValue.bold}
            onPressedChange={(pressed) => updateValue({ bold: pressed })}
            disabled={disabled}
            aria-label="Toggle bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={richValue.italic}
            onPressedChange={(pressed) => updateValue({ italic: pressed })}
            disabled={disabled}
            aria-label="Toggle italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={richValue.underline}
            onPressedChange={(pressed) => updateValue({ underline: pressed })}
            disabled={disabled}
            aria-label="Toggle underline"
          >
            <Underline className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToggleGroup
            type="single"
            value={richValue.align}
            onValueChange={(val) =>
              val && updateValue({ align: val as 'left' | 'center' | 'right' })
            }
            disabled={disabled}
          >
            <ToggleGroupItem value="left" size="sm" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" size="sm" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" size="sm" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Text Area */}
        <Textarea
          value={richValue.text}
          onChange={(e) => updateValue({ text: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            'border-0 rounded-t-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0',
            richValue.bold && 'font-bold',
            richValue.italic && 'italic',
            richValue.underline && 'underline',
            richValue.align === 'center' && 'text-center',
            richValue.align === 'right' && 'text-right'
          )}
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}

/**
 * Temperature Slider with Visual Feedback
 * Demonstrates enhanced slider with gradient and emoji feedback.
 */
function TemperatureSlider({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  min = 0,
  max = 100,
  unit = '°C',
}: TemperatureSliderProps) {
  const temp = (value as number) ?? 20;

  const getEmoji = () => {
    if (temp < 10) return '🥶';
    if (temp < 20) return '😊';
    if (temp < 30) return '😓';
    return '🔥';
  };

  const getColor = () => {
    if (temp < 10) return 'text-blue-500';
    if (temp < 20) return 'text-green-500';
    if (temp < 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{getEmoji()}</span>
        <span className={cn('text-2xl font-bold tabular-nums', getColor())}>
          {temp}
          {unit}
        </span>
      </div>

      <div className="relative">
        {/* Gradient background */}
        <div
          className="absolute inset-0 h-2 rounded-full top-1/2 -translate-y-1/2"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #f97316, #ef4444)',
          }}
        />
        <Slider
          value={[temp]}
          onValueChange={([val]) => onChange(val)}
          onValueCommit={() => onBlur()}
          min={min}
          max={max}
          step={1}
          disabled={disabled}
          className="relative"
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>

      <FieldError error={error} />
    </div>
  );
}

/**
 * Phone Input with Country Code
 * Demonstrates composite input with multiple parts.
 */
interface PhoneValue {
  countryCode: string;
  number: string;
}

interface PhoneInputProps extends CustomFieldComponentProps {
  placeholder?: string;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
] as const;

function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled,
  required,
  error,
  placeholder = '(555) 123-4567',
}: PhoneInputProps) {
  const phoneValue: PhoneValue = (value as PhoneValue) || {
    countryCode: '+1',
    number: '',
  };

  const updateValue = (updates: Partial<PhoneValue>) => {
    onChange({ ...phoneValue, ...updates });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={phoneValue.countryCode}
          onValueChange={(code) => updateValue({ countryCode: code })}
          disabled={disabled}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((cc) => (
              <SelectItem key={cc.code} value={cc.code}>
                {cc.country} {cc.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={phoneValue.number}
          onChange={(e) => updateValue({ number: e.target.value })}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1"
        />
      </div>
      <RequiredHint
        show={required === true && !phoneValue.number}
        message="Phone number is required"
      />
      <FieldError error={error} />
    </div>
  );
}

/**
 * Priority Selector with Visual Chips
 * Demonstrates exclusive selection with visual feedback.
 */
interface PrioritySelectorProps extends CustomFieldComponentProps {
  // No additional props needed, but interface allows for future extension
}

const PRIORITIES: PriorityOption[] = [
  {
    value: 'low',
    label: 'Low',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    value: 'high',
    label: 'High',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    value: 'critical',
    label: 'Critical',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
];

function PrioritySelector({ value, onChange, onBlur, disabled, error }: PrioritySelectorProps) {
  const priority = (value as Priority) || '';
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBlur = (e: React.FocusEvent) => {
    // Only trigger onBlur if focus is leaving the container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      onBlur();
    }
  };

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex flex-wrap gap-2" onBlur={handleBlur}>
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
              priority === p.value
                ? cn(p.color, 'ring-2 ring-offset-1 ring-ring')
                : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <FieldError error={error} />
    </div>
  );
}

// ============================================================================
// PLUGIN WITH CUSTOM COMPONENTS
// ============================================================================

/**
 * Plugin that registers all custom components
 * Components are registered via onFormInit using context.registerCustomComponent()
 */
const customComponentsPlugin: FormPlugin = {
  name: 'custom-components',
  version: '1.0.0',
  onFormInit: (context) => {
    // Register all custom components with the form context
    context.registerCustomComponent('star-rating', RatingInput);
    context.registerCustomComponent('color-picker', ColorPicker);
    context.registerCustomComponent('rich-text', RichTextInput);
    context.registerCustomComponent('temperature', TemperatureSlider);
    context.registerCustomComponent('phone-input', PhoneInput);
    context.registerCustomComponent('priority-selector', PrioritySelector);
  },
};

// ============================================================================
// STORY: Basic Custom Controls
// ============================================================================

const basicCustomControlsSchema: FormSchema = {
  id: 'basic-custom-controls',
  title: 'Custom Controls Demo',
  description: 'Demonstrates the CustomFieldComponentProps contract',
  sections: [
    {
      id: 'ratings',
      title: 'Rating Components',
      description: 'Star rating with customizable options',
      fields: [
        {
          type: 'custom',
          name: 'productRating',
          label: 'Product Rating',
          description: 'Click to rate, right-click for half stars',
          component: 'star-rating',
          componentProps: {
            maxStars: 5,
            allowHalf: true,
          },
          validation: {
            required: true,
            messages: { required: 'Please provide a rating' },
          },
        },
        {
          type: 'custom',
          name: 'serviceRating',
          label: 'Service Rating (10 stars)',
          description: 'Larger scale rating',
          component: 'star-rating',
          componentProps: {
            maxStars: 10,
            allowHalf: false,
          },
        },
      ],
    },
    {
      id: 'selection',
      title: 'Selection Components',
      fields: [
        {
          type: 'custom',
          name: 'priority',
          label: 'Task Priority',
          component: 'priority-selector',
          validation: {
            required: true,
            messages: { required: 'Please select a priority' },
          },
        },
        {
          type: 'custom',
          name: 'brandColor',
          label: 'Brand Color',
          component: 'color-picker',
          componentProps: {
            presetColors: ['#0f172a', '#1e40af', '#7c3aed', '#db2777', '#ea580c', '#16a34a'],
            showHexInput: true,
          },
          defaultValue: '#1e40af',
        },
      ],
    },
  ],
};

/**
 * Basic Custom Controls
 *
 * Demonstrates simple custom controls:
 * - Star rating with half-star support
 * - Priority selector chips
 * - Color picker with presets
 */
export const BasicCustomControls: Story = {
  args: {
    schema: basicCustomControlsSchema,
    plugins: [customComponentsPlugin],
    onSubmit: async (data) => {
      console.log('Form data:', data);
      alert(`Submitted!\n\nData: ${JSON.stringify(data, null, 2)}`);
    },
  },
};

// ============================================================================
// STORY: Complex Custom Controls
// ============================================================================

const complexCustomControlsSchema: FormSchema = {
  id: 'complex-custom-controls',
  title: 'Complex Custom Controls',
  description: 'Advanced custom controls with structured values',
  sections: [
    {
      id: 'rich-content',
      title: 'Rich Content',
      fields: [
        {
          type: 'custom',
          name: 'announcement',
          label: 'Announcement',
          description: 'Use the toolbar to format your text',
          component: 'rich-text',
          componentProps: {
            placeholder: 'Write your announcement here...',
            rows: 4,
          },
          defaultValue: {
            text: '',
            bold: false,
            italic: false,
            underline: false,
            align: 'left',
          },
        },
      ],
    },
    {
      id: 'composite',
      title: 'Composite Inputs',
      fields: [
        {
          type: 'custom',
          name: 'contactPhone',
          label: 'Contact Phone',
          component: 'phone-input',
          validation: {
            required: true,
            messages: { required: 'Phone number is required' },
          },
        },
        {
          type: 'custom',
          name: 'thermostat',
          label: 'Thermostat Setting',
          description: 'Set your preferred temperature',
          component: 'temperature',
          componentProps: {
            min: 10,
            max: 35,
            unit: '°C',
          },
          defaultValue: 22,
        },
      ],
    },
  ],
};

/**
 * Complex Custom Controls
 *
 * Demonstrates advanced patterns:
 * - Rich text editor with formatting toolbar
 * - Composite phone input with country codes
 * - Temperature slider with visual feedback
 */
export const ComplexCustomControls: Story = {
  args: {
    schema: complexCustomControlsSchema,
    plugins: [customComponentsPlugin],
    onSubmit: async (data) => {
      console.log('Form data:', data);
      alert(`Submitted!\n\nData: ${JSON.stringify(data, null, 2)}`);
    },
  },
};

// ============================================================================
// STORY: Validation and Error States
// ============================================================================

const validationDemoSchema: FormSchema = {
  id: 'validation-demo',
  title: 'Validation Demo',
  description: 'Custom controls with validation and error states',
  mode: 'onChange',
  sections: [
    {
      id: 'required-fields',
      title: 'Required Custom Fields',
      description: 'All fields below are required - submit to see validation errors',
      fields: [
        {
          type: 'custom',
          name: 'rating',
          label: 'Required Rating',
          component: 'star-rating',
          componentProps: { maxStars: 5 },
          validation: {
            required: true,
            messages: { required: 'Please provide a rating' },
          },
        },
        {
          type: 'custom',
          name: 'priority',
          label: 'Required Priority',
          component: 'priority-selector',
          validation: {
            required: true,
            messages: { required: 'Please select a priority level' },
          },
        },
        {
          type: 'custom',
          name: 'phone',
          label: 'Required Phone',
          component: 'phone-input',
          validation: {
            required: true,
            messages: { required: 'Phone number is required' },
          },
        },
      ],
    },
  ],
};

/**
 * Validation and Error States
 *
 * Demonstrates how custom controls handle:
 * - Required field validation
 * - Error message display
 * - Visual error states
 */
export const ValidationDemo: Story = {
  args: {
    schema: validationDemoSchema,
    plugins: [customComponentsPlugin],
    onSubmit: async (data) => {
      console.log('Valid form data:', data);
      alert('All validations passed!');
    },
  },
};

// ============================================================================
// STORY: Disabled States
// ============================================================================

const disabledDemoSchema: FormSchema = {
  id: 'disabled-demo',
  title: 'Disabled Controls Demo',
  description: 'All custom controls in disabled state',
  sections: [
    {
      id: 'disabled-controls',
      fields: [
        {
          type: 'custom',
          name: 'rating',
          label: 'Disabled Rating',
          component: 'star-rating',
          componentProps: { maxStars: 5 },
          defaultValue: 3,
        },
        {
          type: 'custom',
          name: 'color',
          label: 'Disabled Color Picker',
          component: 'color-picker',
          defaultValue: '#8b5cf6',
        },
        {
          type: 'custom',
          name: 'richText',
          label: 'Disabled Rich Text',
          component: 'rich-text',
          defaultValue: {
            text: 'This text cannot be edited',
            bold: true,
            italic: false,
            underline: false,
            align: 'center',
          },
        },
        {
          type: 'custom',
          name: 'phone',
          label: 'Disabled Phone',
          component: 'phone-input',
          defaultValue: { countryCode: '+1', number: '555-123-4567' },
        },
        {
          type: 'custom',
          name: 'priority',
          label: 'Disabled Priority',
          component: 'priority-selector',
          defaultValue: 'high',
        },
        {
          type: 'custom',
          name: 'temperature',
          label: 'Disabled Temperature',
          component: 'temperature',
          defaultValue: 28,
        },
      ],
    },
  ],
};

/**
 * Disabled States
 *
 * Demonstrates how custom controls render in disabled mode:
 * - Visual indication of disabled state
 * - Interaction prevention
 * - Maintaining current values
 */
export const DisabledStates: Story = {
  args: {
    schema: disabledDemoSchema,
    plugins: [customComponentsPlugin],
    disabled: true,
  },
};

// ============================================================================
// STORY: Mixed with Standard Fields
// ============================================================================

const mixedFormSchema: FormSchema = {
  id: 'mixed-form',
  title: 'Project Configuration',
  description: 'Mix of standard and custom controls in a real-world form',
  layout: { columns: 2 },
  sections: [
    {
      id: 'project-info',
      title: 'Project Information',
      fields: [
        {
          type: 'text',
          name: 'projectName',
          label: 'Project Name',
          placeholder: 'My Awesome Project',
          validation: { required: true },
          grid: { span: 2 },
        },
        {
          type: 'textarea',
          name: 'description',
          label: 'Description',
          placeholder: 'Describe your project...',
          grid: { span: 2 },
        },
        {
          type: 'custom',
          name: 'brandColor',
          label: 'Brand Color',
          component: 'color-picker',
          defaultValue: '#3b82f6',
        },
        {
          type: 'custom',
          name: 'priority',
          label: 'Priority',
          component: 'priority-selector',
          validation: { required: true },
        },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      fields: [
        {
          type: 'select',
          name: 'visibility',
          label: 'Visibility',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' },
            { label: 'Team Only', value: 'team' },
          ],
        },
        {
          type: 'custom',
          name: 'importance',
          label: 'Importance Rating',
          component: 'star-rating',
          componentProps: { maxStars: 5, allowHalf: true },
        },
        {
          type: 'switch',
          name: 'notifications',
          label: 'Enable Notifications',
          description: 'Receive updates about this project',
          defaultValue: true,
        },
        {
          type: 'custom',
          name: 'contact',
          label: 'Contact Phone',
          component: 'phone-input',
        },
      ],
    },
  ],
};

/**
 * Mixed with Standard Fields
 *
 * Real-world example showing:
 * - Custom controls alongside standard form fields
 * - Grid layout integration
 * - Cohesive form UX
 */
export const MixedWithStandardFields: Story = {
  args: {
    schema: mixedFormSchema,
    plugins: [customComponentsPlugin],
    onSubmit: async (data) => {
      console.log('Project config:', data);
      alert(`Project created!\n\n${JSON.stringify(data, null, 2)}`);
    },
  },
};

// ============================================================================
// STORY: Contract Compliance Test
// ============================================================================

/**
 * Test component that displays all props received
 * Used to verify the contract is properly implemented.
 */
function ContractTestComponent(props: CustomFieldComponentProps) {
  const { value, onChange, onBlur, name, field, disabled, required, error, ...rest } = props;

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-3 font-mono text-sm">
      <div className="font-bold text-base">Props Received:</div>

      <div className="grid gap-2">
        <div className="flex gap-2">
          <span className="text-muted-foreground">name:</span>
          <span className="text-green-600">"{name}"</span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">value:</span>
          <span className="text-blue-600">{JSON.stringify(value)}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">onChange:</span>
          <span className="text-purple-600">{typeof onChange}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">onBlur:</span>
          <span className="text-purple-600">{typeof onBlur}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">disabled:</span>
          <span className={disabled ? 'text-red-600' : 'text-green-600'}>{String(disabled)}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">required:</span>
          <span className={required ? 'text-orange-600' : 'text-green-600'}>
            {String(required)}
          </span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">error:</span>
          <span className={error ? 'text-red-600' : 'text-muted-foreground'}>
            {error || 'undefined'}
          </span>
        </div>

        <div className="flex gap-2">
          <span className="text-muted-foreground">field?.type:</span>
          <span className="text-blue-600">"{field?.type}"</span>
        </div>

        {Object.keys(rest).length > 0 && (
          <div className="flex gap-2">
            <span className="text-muted-foreground">componentProps:</span>
            <span className="text-yellow-600">{JSON.stringify(rest)}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t">
        <Label className="text-xs text-muted-foreground mb-1 block">
          Test Input (updates value):
        </Label>
        <Input
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="Type to test onChange..."
        />
      </div>
    </div>
  );
}

const contractTestPlugin: FormPlugin = {
  name: 'contract-test',
  onFormInit: (context) => {
    context.registerCustomComponent('contract-test', ContractTestComponent);
  },
};

const contractTestSchema: FormSchema = {
  id: 'contract-test',
  title: 'Contract Compliance Test',
  description: 'Verifies all CustomFieldComponentProps are passed correctly',
  sections: [
    {
      id: 'test',
      fields: [
        {
          type: 'custom',
          name: 'testField',
          label: 'Contract Test Field',
          description: 'This component displays all props it receives',
          component: 'contract-test',
          componentProps: {
            customProp1: 'hello',
            customProp2: 42,
            customProp3: true,
          },
          validation: {
            required: true,
            minLength: 3,
            messages: {
              required: 'This field is required',
              minLength: 'Minimum 3 characters',
            },
          },
        },
      ],
    },
  ],
};

/**
 * Contract Compliance Test
 *
 * A debugging tool that displays exactly what props
 * are passed to custom components, verifying:
 * - Core props (value, onChange, onBlur, name)
 * - State props (disabled, required, error)
 * - Metadata (field object)
 * - Custom props (componentProps forwarding)
 */
export const ContractComplianceTest: Story = {
  args: {
    schema: contractTestSchema,
    plugins: [contractTestPlugin],
    onSubmit: async (data) => {
      console.log('Contract test data:', data);
    },
  },
};
