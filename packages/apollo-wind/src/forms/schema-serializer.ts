import type {
  FormSchema,
  FieldMetadata,
  FormSection,
  FormStep,
  FieldRule,
  DataSource,
  FieldCondition,
  FieldOption,
  FormAction,
  ValidationConfig,
} from "./form-schema";

/**
 * Schema Serializer - Converts FormSchema to JSON-safe format
 *
 * With ValidationConfig being JSON-serializable by design, this serializer
 * now performs straightforward object-to-JSON conversion without complex
 * Zod schema transformation.
 *
 * Output format:
 * - Clean JSON that can be stored in databases
 * - Can be transmitted over APIs
 * - Fully round-trippable (JSON → FormSchema → JSON)
 */

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * Convert FieldOption array to JsonArray
 */
function serializeOptions(options: FieldOption[]): JsonArray {
  return options.map((opt) => ({
    label: opt.label,
    value: opt.value as JsonValue,
    ...(opt.disabled !== undefined && { disabled: opt.disabled }),
  }));
}

/**
 * Serialize ValidationConfig to JSON-safe format
 * ValidationConfig is already JSON-serializable, so this is mostly passthrough
 */
function serializeValidationConfig(config: ValidationConfig): JsonObject {
  const result: JsonObject = {};

  // Presence
  if (config.required !== undefined) result.required = config.required;

  // String constraints
  if (config.minLength !== undefined) result.minLength = config.minLength;
  if (config.maxLength !== undefined) result.maxLength = config.maxLength;
  if (config.pattern !== undefined) result.pattern = config.pattern;
  if (config.email !== undefined) result.email = config.email;
  if (config.url !== undefined) result.url = config.url;

  // Number constraints
  if (config.min !== undefined) result.min = config.min;
  if (config.max !== undefined) result.max = config.max;
  if (config.integer !== undefined) result.integer = config.integer;
  if (config.positive !== undefined) result.positive = config.positive;
  if (config.negative !== undefined) result.negative = config.negative;

  // Array constraints
  if (config.minItems !== undefined) result.minItems = config.minItems;
  if (config.maxItems !== undefined) result.maxItems = config.maxItems;

  // File constraints
  if (config.maxFileSize !== undefined) result.maxFileSize = config.maxFileSize;
  if (config.allowedTypes !== undefined) result.allowedTypes = config.allowedTypes;

  // Custom validation
  if (config.custom !== undefined) result.custom = config.custom;

  // Messages
  if (config.messages && Object.keys(config.messages).length > 0) {
    const messages: JsonObject = {};
    const m = config.messages;
    if (m.required) messages.required = m.required;
    if (m.minLength) messages.minLength = m.minLength;
    if (m.maxLength) messages.maxLength = m.maxLength;
    if (m.pattern) messages.pattern = m.pattern;
    if (m.min) messages.min = m.min;
    if (m.max) messages.max = m.max;
    if (m.email) messages.email = m.email;
    if (m.url) messages.url = m.url;
    if (m.integer) messages.integer = m.integer;
    if (m.positive) messages.positive = m.positive;
    if (m.negative) messages.negative = m.negative;
    if (m.minItems) messages.minItems = m.minItems;
    if (m.maxItems) messages.maxItems = m.maxItems;
    if (m.custom) messages.custom = m.custom;
    if (Object.keys(messages).length > 0) {
      result.messages = messages;
    }
  }

  return result;
}

/**
 * Convert FormAction array to JsonArray
 */
function serializeActions(actions: FormAction[]): JsonArray {
  return actions.map((action) => ({
    id: action.id,
    type: action.type,
    label: action.label,
    ...(action.variant && { variant: action.variant }),
    ...(action.loading !== undefined && { loading: action.loading }),
    ...(action.disabled !== undefined && { disabled: action.disabled }),
    ...(action.conditions && { conditions: action.conditions.map(serializeCondition) }),
  }));
}

/**
 * Serialize a FieldCondition to JSON-safe format
 */
function serializeCondition(condition: FieldCondition): JsonObject {
  const result: JsonObject = { when: condition.when };

  if (condition.is !== undefined) result.is = condition.is as JsonValue;
  if (condition.isNot !== undefined) result.isNot = condition.isNot as JsonValue;
  if (condition.in !== undefined) result.in = condition.in as JsonArray;
  if (condition.notIn !== undefined) result.notIn = condition.notIn as JsonArray;
  if (condition.matches !== undefined) result.matches = condition.matches;
  if (condition.custom !== undefined) result.custom = condition.custom;

  return result;
}

/**
 * Serialize a FieldRule to JSON-safe format
 */
function serializeRule(rule: FieldRule): JsonObject {
  const result: JsonObject = {
    id: rule.id,
    conditions: rule.conditions.map(serializeCondition),
  };

  if (rule.operator && rule.operator !== "AND") {
    result.operator = rule.operator;
  }

  const effects: JsonObject = {};
  if (rule.effects.visible !== undefined) effects.visible = rule.effects.visible;
  if (rule.effects.disabled !== undefined) effects.disabled = rule.effects.disabled;
  if (rule.effects.required !== undefined) effects.required = rule.effects.required;
  if (rule.effects.value !== undefined) effects.value = rule.effects.value as JsonValue;
  if (rule.effects.validate) {
    effects.validate = serializeValidationConfig(rule.effects.validate);
  }
  if (rule.effects.options) effects.options = serializeDataSource(rule.effects.options);

  result.effects = effects;

  return result;
}

/**
 * Serialize a DataSource to JSON-safe format
 */
function serializeDataSource(dataSource: DataSource): JsonObject {
  switch (dataSource.type) {
    case "static":
      return {
        type: "static",
        options: serializeOptions(dataSource.options),
      };
    case "fetch":
      return {
        type: "fetch",
        url: dataSource.url,
        ...(dataSource.method && { method: dataSource.method }),
        ...(dataSource.transform && { transform: dataSource.transform }),
        ...(dataSource.params && { params: dataSource.params as JsonObject }),
      };
    case "remote":
      return {
        type: "remote",
        endpoint: dataSource.endpoint,
        ...(dataSource.method && { method: dataSource.method }),
        ...(dataSource.params && { params: dataSource.params as JsonObject }),
        ...(dataSource.transform && { transform: dataSource.transform }),
      };
    case "computed":
      return {
        type: "computed",
        dependency: dataSource.dependency,
        compute: dataSource.compute,
      };
  }
}

/**
 * Serialize a FieldMetadata to JSON-safe format
 */
function serializeField(field: FieldMetadata): JsonObject {
  const result: JsonObject = {
    name: field.name,
    type: field.type,
    label: field.label,
  };

  // Optional base properties
  if (field.placeholder) result.placeholder = field.placeholder;
  if (field.description) result.description = field.description;
  if (field.defaultValue !== undefined) result.defaultValue = field.defaultValue as JsonValue;

  // Validation config (now JSON-serializable!)
  if (field.validation) {
    result.validation = serializeValidationConfig(field.validation);
  }

  if (field.dataSource) result.dataSource = serializeDataSource(field.dataSource);
  if (field.rules && field.rules.length > 0) {
    result.rules = field.rules.map(serializeRule);
  }
  if (field.grid) result.grid = field.grid as JsonObject;
  if (field.ariaLabel) result.ariaLabel = field.ariaLabel;
  if (field.ariaDescribedBy) result.ariaDescribedBy = field.ariaDescribedBy;

  // Type-specific properties
  if ("options" in field && field.options) {
    result.options = serializeOptions(field.options);
  }
  if ("rows" in field && field.rows) result.rows = field.rows;
  if ("min" in field && field.min !== undefined) result.min = field.min;
  if ("max" in field && field.max !== undefined) result.max = field.max;
  if ("step" in field && field.step !== undefined) result.step = field.step;
  if ("maxSelected" in field && field.maxSelected) result.maxSelected = field.maxSelected;
  if ("accept" in field && field.accept) result.accept = field.accept;
  if ("multiple" in field && field.multiple) result.multiple = field.multiple;
  if ("maxSize" in field && field.maxSize) result.maxSize = field.maxSize;
  if ("showPreview" in field && field.showPreview) result.showPreview = field.showPreview;
  if ("use12Hour" in field && field.use12Hour) result.use12Hour = field.use12Hour;
  if ("component" in field && field.component) result.component = field.component;
  if ("componentProps" in field && field.componentProps) {
    result.componentProps = field.componentProps as JsonObject;
  }

  return result;
}

/**
 * Serialize a FormSection to JSON-safe format
 */
function serializeSection(section: FormSection): JsonObject {
  const result: JsonObject = {
    id: section.id,
    fields: section.fields.map(serializeField),
  };

  if (section.title) result.title = section.title;
  if (section.description) result.description = section.description;
  if (section.collapsible !== undefined) result.collapsible = section.collapsible;
  if (section.defaultExpanded !== undefined) result.defaultExpanded = section.defaultExpanded;
  if (section.conditions && section.conditions.length > 0) {
    result.conditions = section.conditions.map(serializeCondition);
  }

  return result;
}

/**
 * Serialize a FormStep to JSON-safe format
 */
function serializeStep(step: FormStep): JsonObject {
  const result: JsonObject = {
    id: step.id,
    title: step.title,
    sections: step.sections.map(serializeSection),
  };

  if (step.description) result.description = step.description;
  if (step.validation) result.validation = step.validation;
  if (step.canSkip !== undefined) result.canSkip = step.canSkip;
  if (step.conditions && step.conditions.length > 0) {
    result.conditions = step.conditions.map(serializeCondition);
  }

  return result;
}

/**
 * Serialize a FormSchema to JSON-safe format
 */
export function serializeSchema(schema: FormSchema): JsonObject {
  const result: JsonObject = {
    id: schema.id,
    title: schema.title,
  };

  // Optional base properties
  if (schema.description) result.description = schema.description;
  if (schema.version) result.version = schema.version;
  if (schema.initialData) result.initialData = schema.initialData as JsonObject;
  if (schema.mode) result.mode = schema.mode;
  if (schema.reValidateMode) result.reValidateMode = schema.reValidateMode;
  if (schema.actions && schema.actions.length > 0) {
    result.actions = serializeActions(schema.actions);
  }
  if (schema.layout) result.layout = schema.layout as JsonObject;
  if (schema.metadata) result.metadata = schema.metadata as JsonObject;

  // Sections or Steps
  if ("sections" in schema && schema.sections) {
    result.sections = schema.sections.map(serializeSection);
  }
  if ("steps" in schema && schema.steps) {
    result.steps = schema.steps.map(serializeStep);
  }

  return result;
}

/**
 * Convert schema to formatted JSON string
 */
export function schemaToJson(schema: FormSchema, indent = 2): string {
  return JSON.stringify(serializeSchema(schema), null, indent);
}
