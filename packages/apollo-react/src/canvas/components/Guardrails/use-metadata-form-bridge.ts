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
 *  - **push host values in** — per field, structurally compared (see `valuesEqual`), so an echo
 *    of the form's own emission performs no write and focus/cursor survive.
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

/**
 * Structural comparison for a single field's value.
 *
 * Reference equality is not enough: the host rebuilds `enum-list`, `text-list` and `map-enum`
 * values through `updateParam`, and the `values` record itself is rebuilt by a memo, so every
 * echo of the form's own emission arrives as a fresh instance. Under `Object.is` the guard
 * never holds for those types and `setValue` fires on each keystroke.
 *
 * apollo-wind has a `deepEqual`, but it is not part of that package's public export surface
 * (only `cn` is re-exported from its root), so widening it is #1107's call to make rather than
 * something to force from here. Guardrail parameter values are JSON-shaped — primitive,
 * array-of-primitive, or a flat record — which this covers.
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => valuesEqual(item, b[index]));
  }

  const aEntries = Object.entries(a as Record<string, unknown>);
  const bRecord = b as Record<string, unknown>;
  if (aEntries.length !== Object.keys(bRecord).length) return false;
  return aEntries.every(
    ([key, value]) =>
      Object.hasOwn(bRecord, key) && valuesEqual(value, (bRecord as Record<string, unknown>)[key])
  );
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

  // A sync that arrives before `onFormInit` has to be replayed, not dropped: the effect below
  // only re-runs when `values` changes again, so without this the update is lost for good.
  // Reachable as soon as any schema gains `initialData` and MetadataForm's init goes async.
  const pendingValuesRef = useRef<Record<string, unknown> | null>(null);

  const syncValuesIn = (form: NonNullable<FormContext['form']>, next: Record<string, unknown>) => {
    syncingRef.current = true;
    try {
      for (const [name, value] of Object.entries(next)) {
        // Read through `getValues(name)` rather than indexing the whole-form snapshot: the
        // paired `setValue(name, …)` is path-aware, so a flat lookup would never match a
        // dotted field name. Guardrail parameter ids are flat today; this hook is not.
        if (!valuesEqual(form.getValues(name), value)) {
          form.setValue(name, value as never);
        }
      }
    } finally {
      syncingRef.current = false;
    }
  };
  const syncValuesInRef = useRef(syncValuesIn);
  syncValuesInRef.current = syncValuesIn;

  const plugins = useMemo<FormPlugin[]>(
    () => [
      {
        name: 'guardrail-host-bridge',
        components,
        onFormInit: (context) => {
          formRef.current = context.form;
          const pending = pendingValuesRef.current;
          if (pending) {
            pendingValuesRef.current = null;
            syncValuesInRef.current(context.form, pending);
          }
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
    if (!form) {
      pendingValuesRef.current = values;
      return;
    }
    syncValuesInRef.current(form, values);
  }, [values]);

  // Errors in. Only entries this hook applied are cleared, so nothing else's errors are lost.
  const appliedRef = useRef<Record<string, string>>({});

  /**
   * Put the host's message back on a field unless it is already there.
   *
   * Keyed on the field's actual state rather than on what we last wrote: the schema runs in
   * `onChange` mode, so the resolver replaces a manually-set error on the next keystroke, and
   * a "did the message change?" guard would then never restore it — the host's verdict would
   * vanish on the first edit and stay gone while `errors` sat unchanged.
   */
  const applyHostError = (
    form: NonNullable<FormContext['form']>,
    name: string,
    message: string
  ) => {
    const current = form.getFieldState(name).error;
    if (current?.type === 'external' && current.message === message) return;
    form.setError(name, { type: 'external', message });
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const next: Record<string, string> = {};
    for (const [name, message] of Object.entries(errors ?? {})) {
      if (!message) continue;
      next[name] = message;
      applyHostError(form, name, message);
    }
    for (const name of Object.keys(appliedRef.current)) {
      if (!next[name] && form.getFieldState(name).error?.type === 'external') {
        form.clearErrors(name);
      }
    }
    appliedRef.current = next;
  }, [errors]);

  // Re-assert host errors after the form validates itself. In `onChange` mode every edit runs
  // the resolver, whose result overwrites the external error set above; without this the host
  // message disappears on the first keystroke and never returns, because `errors` has not
  // changed and so the effect above does not re-run. The prop stays the source of truth — the
  // host verdict wins over the resolver's, matching the documented precedence.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    return form.subscribe({
      formState: { values: true },
      callback: () => {
        const current = formRef.current;
        if (!current) return;
        for (const [name, message] of Object.entries(appliedRef.current)) {
          applyHostError(current, name, message);
        }
      },
    });
    // Subscribes once against the stable form instance; the messages it re-applies are read
    // from `appliedRef` at call time, so it never closes over a stale `errors`.
  }, []);

  // Range constraints are only worth declaring if they are evaluated as the user types:
  // this form has no submit of its own, so the default 'onSubmit' mode would never run them.
  return { plugins, schemaMode: 'onChange' };
}
