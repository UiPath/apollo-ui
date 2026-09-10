import type { FormContext, FormPlugin, FormSchema } from '@uipath/apollo-wind';
import { useEffect, useMemo, useRef } from 'react';

/**
 * The one place guardrails' controlled contract is translated into MetadataForm's.
 *
 * `GuardrailValidatorForm` is controlled from the outside (`parameters`/`onChange` plus
 * host-owned `errors`), while `MetadataForm` owns its state and exposes plugins, so the
 * translation has to live somewhere. It lives here, named and in one file, rather than as
 * props on the shared primitive: `context.form` is an unlabelled backdoor, and a reviewer
 * who greps for a controlled prop would never find a scattered `setValue` call.
 *
 * Three jobs:
 *  - **register components** — `FormPlugin.components`, honoured from the first paint.
 *  - **push host values in** — per field, deep-equal guarded, so an echo of the form's own
 *    emission performs no write and focus/cursor survive.
 *  - **push host errors in** — as `type: 'external'`, re-applied from the prop (its source of
 *    truth) and cleared only when the prop drops them, so resolver errors are untouched.
 *
 * Emissions are suppressed while this hook is writing, otherwise a sync-in would echo back
 * to the host as if the user had typed it.
 */
export interface MetadataFormBridgeOptions {
  /** Field values the host owns, keyed by field name. */
  values: Record<string, unknown>;
  /** Host-owned messages keyed by field name. */
  errors?: Record<string, string>;
  /** Fires for user edits only — never for values this hook syncs in. */
  onValueChange: (name: string, value: unknown) => void;
  /** Custom field components, available from the first render. */
  components: FormPlugin['components'];
}

export function useMetadataFormBridge({
  values,
  errors,
  onValueChange,
  components,
}: MetadataFormBridgeOptions): { plugins: FormPlugin[]; schemaMode: FormSchema['mode'] } {
  const formRef = useRef<FormContext['form'] | null>(null);
  const syncingRef = useRef(false);
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  const plugins = useMemo<FormPlugin[]>(
    () => [
      {
        name: 'guardrail-host-bridge',
        components,
        onFormInit: (context) => {
          formRef.current = context.form;
        },
        onValueChange: (name, value) => {
          if (syncingRef.current) return;
          onValueChangeRef.current(name, value);
        },
      },
    ],
    [components]
  );

  // Values in. The form is only reachable once `onFormInit` has run; before that the
  // schema's own defaultValues already carry the initial parameters.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const current = form.getValues();
    syncingRef.current = true;
    try {
      for (const [name, value] of Object.entries(values)) {
        if (!Object.is(current[name], value)) {
          form.setValue(name, value as never);
        }
      }
    } finally {
      syncingRef.current = false;
    }
  }, [values]);

  // Errors in. Only entries this hook applied are cleared, so nothing else's errors are lost.
  const appliedRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const next: Record<string, string> = {};
    for (const [name, message] of Object.entries(errors ?? {})) {
      if (!message) continue;
      next[name] = message;
      if (appliedRef.current[name] !== message) {
        form.setError(name, { type: 'external', message });
      }
    }
    for (const name of Object.keys(appliedRef.current)) {
      if (!next[name] && form.getFieldState(name).error?.type === 'external') {
        form.clearErrors(name);
      }
    }
    appliedRef.current = next;
  }, [errors]);

  // Range constraints are only worth declaring if they are evaluated as the user types:
  // this form has no submit of its own, so the default 'onSubmit' mode would never run them.
  return { plugins, schemaMode: 'onChange' };
}
