import { z } from 'zod';
import type { ValidationConfig, FieldType } from './form-schema';

/**
 * Validation Converter
 *
 * Converts JSON-serializable ValidationConfig to Zod schemas at runtime.
 * This is the bridge between declarative validation config and runtime validation.
 */

/**
 * Convert a ValidationConfig to a Zod schema based on field type
 *
 * @param config - The validation configuration (JSON-serializable)
 * @param fieldType - The field type to determine base schema
 * @returns A Zod schema for runtime validation
 *
 * @example
 * const schema = validationConfigToZod(
 *   { required: true, minLength: 2, email: true },
 *   "email"
 * );
 * // Returns: z.string().min(2).email()
 */
export function validationConfigToZod(
  config: ValidationConfig | undefined,
  fieldType: FieldType
): z.ZodTypeAny {
  // Get base schema for field type
  let schema = getBaseSchemaForType(fieldType);

  // If no config, return optional base schema
  if (!config) {
    return schema.optional();
  }

  // Apply type-specific constraints
  schema = applyStringConstraints(schema, config, fieldType);
  schema = applyNumberConstraints(schema, config, fieldType);
  schema = applyArrayConstraints(schema, config, fieldType);

  // Apply required/optional
  if (config.required) {
    // For strings, also check for non-empty
    if (isStringType(fieldType) && !config.minLength) {
      schema = (schema as z.ZodString).min(
        1,
        config.messages?.required || 'This field is required'
      );
    }
    return schema;
  }

  return schema.optional();
}

/**
 * Get the base Zod schema for a field type
 */
function getBaseSchemaForType(fieldType: FieldType): z.ZodTypeAny {
  switch (fieldType) {
    case 'text':
    case 'textarea':
      return z.string();

    case 'email':
      return z.string().email();

    case 'number':
    case 'slider':
      return z.coerce.number();

    case 'checkbox':
    case 'switch':
      return z.boolean();

    case 'select':
    case 'radio':
      return z.string();

    case 'multiselect':
      return z.array(z.string());

    case 'date':
      return z.coerce.date();

    case 'datetime':
      return z.coerce.date();

    case 'file':
      // File validation is typically handled separately by the file input
      return z.any();

    case 'custom':
      return z.any();

    default:
      return z.string();
  }
}

/**
 * Check if field type uses string schema
 */
function isStringType(fieldType: FieldType): boolean {
  return ['text', 'textarea', 'email', 'select', 'radio'].includes(fieldType);
}

/**
 * Check if field type uses number schema
 */
function isNumberType(fieldType: FieldType): boolean {
  return ['number', 'slider'].includes(fieldType);
}

/**
 * Check if field type uses array schema
 */
function isArrayType(fieldType: FieldType): boolean {
  return ['multiselect'].includes(fieldType);
}

/**
 * Apply string-specific constraints to schema
 */
function applyStringConstraints(
  schema: z.ZodTypeAny,
  config: ValidationConfig,
  fieldType: FieldType
): z.ZodTypeAny {
  if (!isStringType(fieldType)) {
    return schema;
  }

  let stringSchema = schema as z.ZodString;

  // Min length
  if (config.minLength != null) {
    stringSchema = stringSchema.min(
      config.minLength,
      config.messages?.minLength || `Must be at least ${config.minLength} characters`
    );
  }

  // Max length
  if (config.maxLength != null) {
    stringSchema = stringSchema.max(
      config.maxLength,
      config.messages?.maxLength || `Must be at most ${config.maxLength} characters`
    );
  }

  // Pattern (regex)
  if (config.pattern) {
    try {
      const regex = new RegExp(config.pattern);
      stringSchema = stringSchema.regex(regex, config.messages?.pattern || 'Invalid format');
    } catch {
      // Invalid regex pattern, skip
      console.warn(`Invalid regex pattern: ${config.pattern}`);
    }
  }

  // Email validation (if not already email type)
  if (config.email && fieldType !== 'email') {
    stringSchema = stringSchema.email(config.messages?.email || 'Invalid email address');
  }

  // URL validation
  if (config.url) {
    stringSchema = stringSchema.url(config.messages?.url || 'Invalid URL');
  }

  return stringSchema;
}

/**
 * Apply number-specific constraints to schema
 */
function applyNumberConstraints(
  schema: z.ZodTypeAny,
  config: ValidationConfig,
  fieldType: FieldType
): z.ZodTypeAny {
  if (!isNumberType(fieldType)) {
    return schema;
  }

  let numberSchema = schema as z.ZodNumber;

  // Integer constraint
  if (config.integer) {
    numberSchema = numberSchema.int(config.messages?.integer || 'Must be a whole number');
  }

  // Min value
  if (config.min != null) {
    numberSchema = numberSchema.min(
      config.min,
      config.messages?.min || `Must be at least ${config.min}`
    );
  }

  // Max value
  if (config.max != null) {
    numberSchema = numberSchema.max(
      config.max,
      config.messages?.max || `Must be at most ${config.max}`
    );
  }

  // Positive
  if (config.positive) {
    numberSchema = numberSchema.positive(config.messages?.positive || 'Must be a positive number');
  }

  // Negative
  if (config.negative) {
    numberSchema = numberSchema.negative(config.messages?.negative || 'Must be a negative number');
  }

  return numberSchema;
}

/**
 * Apply array-specific constraints to schema
 */
function applyArrayConstraints(
  schema: z.ZodTypeAny,
  config: ValidationConfig,
  fieldType: FieldType
): z.ZodTypeAny {
  if (!isArrayType(fieldType)) {
    return schema;
  }

  let arraySchema = schema as z.ZodArray<z.ZodTypeAny>;

  // Min items
  if (config.minItems != null) {
    arraySchema = arraySchema.min(
      config.minItems,
      config.messages?.minItems || `Select at least ${config.minItems} item(s)`
    );
  }

  // Max items
  if (config.maxItems != null) {
    arraySchema = arraySchema.max(
      config.maxItems,
      config.messages?.maxItems || `Select at most ${config.maxItems} item(s)`
    );
  }

  return arraySchema;
}

/**
 * Build a complete Zod object schema from field validations
 *
 * @param fields - Array of field metadata with validation configs
 * @returns A Zod object schema for the entire form
 */
export function buildZodSchemaFromFields(
  fields: Array<{
    name: string;
    type: FieldType;
    validation?: ValidationConfig;
  }>
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.name] = validationConfigToZod(field.validation, field.type);
  }

  return z.object(shape);
}

/**
 * Merge multiple ValidationConfigs (for rule-based validation changes)
 *
 * @param base - Base validation config
 * @param override - Override validation config from rule effects
 * @returns Merged validation config
 */
export function mergeValidationConfigs(
  base: ValidationConfig | undefined,
  override: ValidationConfig | undefined
): ValidationConfig | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  return {
    ...base,
    ...override,
    messages: {
      ...base.messages,
      ...override.messages,
    },
  };
}
