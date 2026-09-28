import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyticsPlugin,
  auditPlugin,
  autoSavePlugin,
  formattingPlugin,
  validationPlugin,
  workflowPlugin,
} from './form-plugins';
import type { FieldMetadata, FormContext, FormSchema } from './form-schema';

// ============================================================================
// Test Helpers
// ============================================================================

type WindowWithPluginState = Window & {
  __autoSaveTimeout?: ReturnType<typeof setTimeout>;
  __workflowContext?: {
    variables?: Record<string, unknown>;
    submitEndpoint?: string;
    workflowId?: string;
    activityId?: string;
  };
  __fieldHistory?: Map<string, Array<{ value: unknown; timestamp: string; user: string }>>;
  __currentUser?: { id?: string };
};

const win = window as WindowWithPluginState;

const defaultSchema: FormSchema = {
  id: 'test-form',
  title: 'Test Form',
  sections: [
    {
      id: 'section-1',
      fields: [
        { name: 'name', type: 'text', label: 'Name' },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
  ],
};

interface MockFormContextOptions {
  schema?: FormSchema;
  values?: Record<string, unknown>;
  errors?: Record<string, unknown>;
}

function createMockContext(options: MockFormContextOptions = {}) {
  const setValue = vi.fn();
  const getValues = vi.fn(() => options.values ?? {});

  const context = {
    schema: options.schema ?? defaultSchema,
    form: {
      setValue,
      getValues,
      formState: { submitCount: 0 },
    } as unknown as FormContext['form'],
    values: options.values ?? {},
    errors: options.errors ?? {},
    isSubmitting: false,
    isDirty: false,
    evaluateConditions: vi.fn(() => true),
    fetchData: vi.fn(async () => []),
    registerCustomComponent: vi.fn(),
  } as unknown as FormContext;

  return { context, setValue, getValues };
}

beforeEach(() => {
  // Plugins log liberally; keep test output clean.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  localStorage.clear();
  delete win.__workflowContext;
  delete win.__fieldHistory;
  delete win.__currentUser;
  if (win.__autoSaveTimeout) {
    clearTimeout(win.__autoSaveTimeout);
    delete win.__autoSaveTimeout;
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ============================================================================
// analyticsPlugin
// ============================================================================

describe('analyticsPlugin', () => {
  it('declares its plugin identity', () => {
    expect(analyticsPlugin.name).toBe('analytics');
    expect(analyticsPlugin.version).toBe('1.0.0');
  });

  it('runs lifecycle hooks without throwing', async () => {
    const { context } = createMockContext();

    await expect(analyticsPlugin.onFormInit?.(context)).resolves.toBeUndefined();
    expect(() => analyticsPlugin.onValueChange?.('name', 'John', context)).not.toThrow();
  });

  it('passes submitted data through unchanged', async () => {
    const { context } = createMockContext();
    const data = { name: 'John', email: 'john@example.com' };

    const result = await analyticsPlugin.onSubmit?.(data, context);

    expect(result).toBe(data);
  });
});

// ============================================================================
// autoSavePlugin
// ============================================================================

describe('autoSavePlugin', () => {
  it('restores a saved draft into the form on init', async () => {
    localStorage.setItem('form_draft_test-form', JSON.stringify({ name: 'Draft Name', age: 42 }));
    const { context, setValue } = createMockContext();

    await autoSavePlugin.onFormInit?.(context);

    expect(setValue).toHaveBeenCalledWith('name', 'Draft Name');
    expect(setValue).toHaveBeenCalledWith('age', 42);
  });

  it('does not touch the form when no draft exists', async () => {
    const { context, setValue } = createMockContext();

    await autoSavePlugin.onFormInit?.(context);

    expect(setValue).not.toHaveBeenCalled();
  });

  it('debounces draft saving by one second on value change', () => {
    vi.useFakeTimers();
    const { context } = createMockContext({ values: { name: 'John' } });

    autoSavePlugin.onValueChange?.('name', 'John', context);
    expect(localStorage.getItem('form_draft_test-form')).toBeNull();

    vi.advanceTimersByTime(1000);
    expect(localStorage.getItem('form_draft_test-form')).toBe(JSON.stringify({ name: 'John' }));
  });

  it('collapses rapid changes into a single save', () => {
    vi.useFakeTimers();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { context } = createMockContext({ values: { name: 'Johnny' } });

    autoSavePlugin.onValueChange?.('name', 'J', context);
    vi.advanceTimersByTime(500);
    autoSavePlugin.onValueChange?.('name', 'Johnny', context);
    vi.advanceTimersByTime(1000);

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('form_draft_test-form')).toBe(JSON.stringify({ name: 'Johnny' }));
  });

  it('clears the draft on submit and passes data through', async () => {
    localStorage.setItem('form_draft_test-form', JSON.stringify({ name: 'stale' }));
    const { context } = createMockContext();
    const data = { name: 'John' };

    const result = await autoSavePlugin.onSubmit?.(data, context);

    expect(result).toBe(data);
    expect(localStorage.getItem('form_draft_test-form')).toBeNull();
  });
});

// ============================================================================
// validationPlugin
// ============================================================================

describe('validationPlugin', () => {
  it('exposes the expected custom validators', () => {
    expect(Object.keys(validationPlugin.validators ?? {})).toEqual(
      expect.arrayContaining(['phone', 'strongPassword', 'creditCard', 'url', 'postalCode'])
    );
  });

  it('phone validator pattern accepts valid numbers and rejects letters', () => {
    const pattern = new RegExp(validationPlugin.validators!.phone.pattern!);

    expect(pattern.test('+1 555-123-4567')).toBe(true);
    expect(pattern.test('(555) 123 4567')).toBe(true);
    expect(pattern.test('not-a-phone!')).toBe(false);
  });

  it('strongPassword validator requires mixed characters and min length 8', () => {
    const config = validationPlugin.validators!.strongPassword;
    const pattern = new RegExp(config.pattern!);

    expect(config.minLength).toBe(8);
    expect(pattern.test('Str0ng!pass')).toBe(true);
    expect(pattern.test('weakpassword')).toBe(false);
    expect(config.messages?.minLength).toBe('Password must be at least 8 characters');
  });

  it('postalCode validator matches US ZIP and ZIP+4 formats only', () => {
    const pattern = new RegExp(validationPlugin.validators!.postalCode.pattern!);

    expect(pattern.test('12345')).toBe(true);
    expect(pattern.test('12345-6789')).toBe(true);
    expect(pattern.test('1234')).toBe(false);
    expect(pattern.test('ABCDE')).toBe(false);
  });

  it('url validator delegates to the url flag with a custom message', () => {
    expect(validationPlugin.validators!.url).toEqual({
      url: true,
      messages: { url: 'Invalid URL format' },
    });
  });

  it('onFieldRegister handles email and non-email fields without throwing', () => {
    const { context } = createMockContext();
    const emailField: FieldMetadata = { name: 'email', type: 'email', label: 'Email' };
    const textField: FieldMetadata = { name: 'name', type: 'text', label: 'Name' };

    expect(() => validationPlugin.onFieldRegister?.(emailField, context)).not.toThrow();
    expect(() => validationPlugin.onFieldRegister?.(textField, context)).not.toThrow();
  });
});

// ============================================================================
// workflowPlugin
// ============================================================================

describe('workflowPlugin', () => {
  it('pre-fills the form from workflow variables on init', async () => {
    win.__workflowContext = {
      variables: { department: 'Finance', priority: 'high' },
    };
    const { context, setValue } = createMockContext();

    await workflowPlugin.onFormInit?.(context);

    expect(setValue).toHaveBeenCalledWith('department', 'Finance');
    expect(setValue).toHaveBeenCalledWith('priority', 'high');
  });

  it('does nothing on init when no workflow context is present', async () => {
    const { context, setValue } = createMockContext();

    await workflowPlugin.onFormInit?.(context);

    expect(setValue).not.toHaveBeenCalled();
  });

  it('returns data unchanged on submit when no submit endpoint is configured', async () => {
    const { context } = createMockContext();
    const data = { name: 'John' };

    const result = await workflowPlugin.onSubmit?.(data, context);

    expect(result).toBe(data);
  });

  it('posts to the workflow engine and returns its response', async () => {
    win.__workflowContext = {
      submitEndpoint: '/api/workflow/submit',
      workflowId: 'wf-1',
      activityId: 'act-1',
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'accepted' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { context } = createMockContext();
    const data = { name: 'John' };

    const result = await workflowPlugin.onSubmit?.(data, context);

    expect(fetchMock).toHaveBeenCalledWith('/api/workflow/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId: 'wf-1', activityId: 'act-1', formData: data }),
    });
    expect(result).toEqual({ status: 'accepted' });
  });

  it('throws when the workflow engine rejects the submission', async () => {
    win.__workflowContext = { submitEndpoint: '/api/workflow/submit' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({}) }))
    );

    const { context } = createMockContext();

    await expect(workflowPlugin.onSubmit?.({ name: 'John' }, context)).rejects.toThrow(
      'Workflow submission failed'
    );
  });
});

// ============================================================================
// auditPlugin
// ============================================================================

describe('auditPlugin', () => {
  it('initializes an empty field history on init', async () => {
    const { context } = createMockContext();

    await auditPlugin.onFormInit?.(context);

    expect(win.__fieldHistory).toBeInstanceOf(Map);
    expect(win.__fieldHistory!.size).toBe(0);
  });

  it('records value changes per field with user attribution', async () => {
    win.__currentUser = { id: 'user-1' };
    const { context } = createMockContext();
    await auditPlugin.onFormInit?.(context);

    auditPlugin.onValueChange?.('name', 'John', context);
    auditPlugin.onValueChange?.('name', 'Johnny', context);

    const entries = win.__fieldHistory!.get('name')!;
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ value: 'John', user: 'user-1' });
    expect(entries[1]).toMatchObject({ value: 'Johnny', user: 'user-1' });
    expect(typeof entries[0].timestamp).toBe('string');
  });

  it('falls back to anonymous when no current user is set and skips recording without init', () => {
    const { context } = createMockContext();

    // Without init there is no history store, so nothing is recorded.
    auditPlugin.onValueChange?.('name', 'ignored', context);
    expect(win.__fieldHistory).toBeUndefined();

    win.__fieldHistory = new Map();
    auditPlugin.onValueChange?.('name', 'John', context);
    expect(win.__fieldHistory.get('name')![0].user).toBe('anonymous');
  });

  it('attaches the audit trail to the submitted data', async () => {
    win.__currentUser = { id: 'user-1' };
    const { context } = createMockContext();
    await auditPlugin.onFormInit?.(context);
    auditPlugin.onValueChange?.('name', 'John', context);

    const result = (await auditPlugin.onSubmit?.({ name: 'John' }, context)) as Record<
      string,
      unknown
    >;

    expect(result.name).toBe('John');
    const audit = result._audit as {
      fieldHistory: Record<string, unknown[]>;
      submittedAt: string;
      submittedBy: string;
    };
    expect(audit.submittedBy).toBe('user-1');
    expect(audit.fieldHistory.name).toHaveLength(1);
    expect(typeof audit.submittedAt).toBe('string');
  });
});

// ============================================================================
// formattingPlugin
// ============================================================================

describe('formattingPlugin', () => {
  it('isBusinessHours accepts 9:00 to 16:59 and rejects other hours', () => {
    const isBusinessHours = formattingPlugin.customConditions!.isBusinessHours;

    expect(isBusinessHours('2026-08-19T10:30:00', undefined)).toBe(true);
    expect(isBusinessHours('2026-08-19T08:59:00', undefined)).toBe(false);
    expect(isBusinessHours('2026-08-19T17:00:00', undefined)).toBe(false);
  });

  it('isWeekend detects Saturday and Sunday only', () => {
    const isWeekend = formattingPlugin.customConditions!.isWeekend;

    expect(isWeekend('2026-08-22T12:00:00', undefined)).toBe(true); // Saturday
    expect(isWeekend('2026-08-23T12:00:00', undefined)).toBe(true); // Sunday
    expect(isWeekend('2026-08-19T12:00:00', undefined)).toBe(false); // Wednesday
  });

  it('onValueChange tolerates unknown fields, fields with errors, and step-based schemas', () => {
    const { context } = createMockContext({
      errors: { name: { message: 'Bad name' } },
    });

    expect(() => formattingPlugin.onValueChange?.('name', 'x', context)).not.toThrow();
    expect(() => formattingPlugin.onValueChange?.('unknown_field', 'x', context)).not.toThrow();

    const stepSchema: FormSchema = {
      id: 'steps',
      title: 'Steps',
      steps: [{ id: 's1', title: 'Step 1', sections: [] }],
    };
    const { context: stepContext } = createMockContext({ schema: stepSchema });
    expect(() => formattingPlugin.onValueChange?.('name', 'x', stepContext)).not.toThrow();
  });
});
