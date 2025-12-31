import type { FormPlugin, FormContext, FieldMetadata } from './form-schema';

/**
 * Example Plugins for the Metadata Form System
 * Demonstrates extensibility through the plugin architecture
 */

// ============================================================================
// Plugin 1: Analytics & Tracking
// ============================================================================

export const analyticsPlugin: FormPlugin = {
  name: 'analytics',
  version: '1.0.0',

  onFormInit: async (context: FormContext) => {
    console.log('[Analytics] Form initialized:', context.schema.id);

    // Track form view
    // await analytics.track('form_viewed', {
    //   formId: context.schema.id,
    //   formTitle: context.schema.title,
    // });
  },

  onValueChange: (fieldName: string, value: unknown, _context: FormContext) => {
    console.log('[Analytics] Field changed:', fieldName, value);

    // Track field interactions
    // analytics.track('field_changed', {
    //   formId: context.schema.id,
    //   fieldName,
    //   fieldType: context.schema.sections
    //     ?.flatMap(s => s.fields)
    //     .find(f => f.name === fieldName)?.type,
    // });
  },

  onSubmit: async (data: unknown, _context: FormContext) => {
    console.log('[Analytics] Form submitted:', data);

    // Track submission
    // await analytics.track('form_submitted', {
    //   formId: context.schema.id,
    //   completionTime: context.form.formState.submitCount,
    // });

    return data; // Pass through
  },
};

// ============================================================================
// Plugin 2: Auto-save / Draft Management
// ============================================================================

export const autoSavePlugin: FormPlugin = {
  name: 'autoSave',
  version: '1.0.0',

  onFormInit: async (context: FormContext) => {
    // Load saved draft
    const draft = localStorage.getItem(`form_draft_${context.schema.id}`);
    if (draft) {
      const draftData = JSON.parse(draft);
      Object.keys(draftData).forEach((key) => {
        context.form.setValue(key, draftData[key]);
      });
      console.log('[AutoSave] Draft restored');
    }
  },

  onValueChange: (_fieldName: string, _value: unknown, context: FormContext) => {
    // Debounced auto-save
    const draftKey = `form_draft_${context.schema.id}`;

    // Clear existing timeout
    const win = window as Window & { __autoSaveTimeout?: ReturnType<typeof setTimeout> };
    if (win.__autoSaveTimeout) {
      clearTimeout(win.__autoSaveTimeout);
    }

    // Set new timeout
    win.__autoSaveTimeout = setTimeout(() => {
      const values = context.form.getValues();
      localStorage.setItem(draftKey, JSON.stringify(values));
      console.log('[AutoSave] Draft saved');
    }, 1000);
  },

  onSubmit: async (data: unknown, context: FormContext) => {
    // Clear draft on successful submit
    localStorage.removeItem(`form_draft_${context.schema.id}`);
    console.log('[AutoSave] Draft cleared');
    return data;
  },
};

// ============================================================================
// Plugin 3: Validation Enhancement
// ============================================================================

export const validationPlugin: FormPlugin = {
  name: 'validation',
  version: '1.0.0',

  validators: {
    // Custom validator: Phone number
    phone: {
      pattern: '^\\+?[\\d\\s\\-()]+$',
      messages: { pattern: 'Invalid phone number format' },
    },

    // Custom validator: Strong password
    // Note: Multiple regex patterns require custom validation logic in the runtime
    strongPassword: {
      minLength: 8,
      pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$',
      messages: {
        minLength: 'Password must be at least 8 characters',
        pattern: 'Password must contain uppercase, lowercase, number, and special character',
      },
    },

    // Custom validator: Credit card
    creditCard: {
      pattern: '^\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}$',
      messages: { pattern: 'Invalid credit card number' },
    },

    // Custom validator: URL
    url: {
      url: true,
      messages: { url: 'Invalid URL format' },
    },

    // Custom validator: Postal code (US)
    postalCode: {
      pattern: '^\\d{5}(-\\d{4})?$',
      messages: { pattern: 'Invalid US postal code' },
    },
  },

  onFieldRegister: (field: FieldMetadata, _context: FormContext) => {
    // Apply custom validators based on field metadata
    if (field.type === 'email') {
      console.log('[Validation] Email validation applied to:', field.name);
    }
  },
};

// ============================================================================
// Plugin 4: Workflow Automation Integration
// ============================================================================

export const workflowPlugin: FormPlugin = {
  name: 'workflow',
  version: '1.0.0',

  onFormInit: async (context: FormContext) => {
    // Load workflow context if form is part of automation
    const win = window as Window & { __workflowContext?: { variables?: Record<string, unknown> } };
    const workflowContext = win.__workflowContext;

    if (workflowContext) {
      console.log('[Workflow] Loading workflow context:', workflowContext);

      // Pre-fill form with workflow variables
      if (workflowContext.variables) {
        Object.entries(workflowContext.variables).forEach(([key, value]) => {
          context.form.setValue(key, value);
        });
      }
    }
  },

  onSubmit: async (data: unknown, _context: FormContext) => {
    // Submit to workflow engine
    console.log('[Workflow] Submitting to workflow engine');

    const win = window as Window & {
      __workflowContext?: {
        submitEndpoint?: string;
        workflowId?: string;
        activityId?: string;
      };
    };
    const workflowContext = win.__workflowContext;

    if (workflowContext?.submitEndpoint) {
      try {
        const response = await fetch(workflowContext.submitEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: workflowContext.workflowId,
            activityId: workflowContext.activityId,
            formData: data,
          }),
        });

        if (!response.ok) {
          throw new Error('Workflow submission failed');
        }

        return await response.json();
      } catch (error) {
        console.error('[Workflow] Submission error:', error);
        throw error;
      }
    }

    return data;
  },
};

// ============================================================================
// Plugin 5: Field History / Audit Trail
// ============================================================================

export const auditPlugin: FormPlugin = {
  name: 'audit',
  version: '1.0.0',

  onFormInit: async (_context: FormContext) => {
    // Initialize audit trail
    type FieldHistoryEntry = { value: unknown; timestamp: string; user: string };
    const win = window as Window & { __fieldHistory?: Map<string, FieldHistoryEntry[]> };
    win.__fieldHistory = new Map();
    console.log('[Audit] Audit trail initialized');
  },

  onValueChange: (fieldName: string, value: unknown, _context: FormContext) => {
    type FieldHistoryEntry = { value: unknown; timestamp: string; user: string };
    const win = window as Window & {
      __fieldHistory?: Map<string, FieldHistoryEntry[]>;
      __currentUser?: { id?: string };
    };
    const history = win.__fieldHistory;

    if (!history) return;

    if (!history.has(fieldName)) {
      history.set(fieldName, []);
    }

    history.get(fieldName)!.push({
      value,
      timestamp: new Date().toISOString(),
      user: win.__currentUser?.id || 'anonymous',
    });

    console.log('[Audit] Field history updated:', fieldName);
  },

  onSubmit: async (data: unknown, _context: FormContext) => {
    // Include audit trail in submission
    type FieldHistoryEntry = { value: unknown; timestamp: string; user: string };
    const win = window as Window & {
      __fieldHistory?: Map<string, FieldHistoryEntry[]>;
      __currentUser?: { id?: string };
    };
    const history = win.__fieldHistory;

    return {
      ...(data as Record<string, unknown>),
      _audit: {
        fieldHistory: history ? Object.fromEntries(history) : {},
        submittedAt: new Date().toISOString(),
        submittedBy: win.__currentUser?.id || 'anonymous',
      },
    };
  },
};

// ============================================================================
// Plugin 6: Conditional Formatting
// ============================================================================

export const formattingPlugin: FormPlugin = {
  name: 'formatting',
  version: '1.0.0',

  customConditions: {
    // Custom condition: Check if value is within business hours
    isBusinessHours: (value: unknown) => {
      const hour = new Date(value as string | number | Date).getHours();
      return hour >= 9 && hour < 17;
    },

    // Custom condition: Check if value is weekend
    isWeekend: (value: unknown) => {
      const day = new Date(value as string | number | Date).getDay();
      return day === 0 || day === 6;
    },
  },

  onValueChange: (fieldName: string, _value: unknown, context: FormContext) => {
    // Apply conditional formatting based on value
    const field = context.schema.sections
      ?.flatMap((s) => s.fields)
      .find((f) => f.name === fieldName);

    if (!field) return;

    // Example: Highlight fields with errors
    const error = context.errors[fieldName];
    if (error) {
      // Apply error styling
      console.log('[Formatting] Error styling applied to:', fieldName);
    }
  },
};
