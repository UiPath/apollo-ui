import { useCallback, useMemo, useState } from 'react';

/** How one object-valued error field combines internal and host messages. */
export interface GuardrailErrorFieldMerge<V> {
  merge: (internal: V | undefined, host: V) => V;
  /** Whether a host value holds a message. Default: it has any key at all. */
  hasMessage?: (host: V) => boolean;
}

export type GuardrailErrorMerges<E> = {
  [K in keyof E]?: GuardrailErrorFieldMerge<NonNullable<E[K]>>;
};

type AnyMerges = Record<string, GuardrailErrorFieldMerge<unknown> | undefined>;

export interface GuardrailFormErrorsState<E> {
  /** Internal errors once a Save has failed, with host errors over them from the start. */
  displayErrors: E;
  /** Nothing internal fails and the host reports no message. */
  isValid: boolean;
  /** Whether a Save attempt has failed yet. */
  showErrors: boolean;
  /** Records a failed Save attempt; internal errors display from then on. */
  revealErrors: () => void;
}

/**
 * A builder's error state. Internal errors display after the first failed Save; host errors
 * display immediately and win per field, combined through `merges` for object-valued fields.
 * Both gate Save. Pass a stable `merges` object.
 */
export function useGuardrailFormErrors<E extends object>(
  internalErrors: E,
  hostErrors: Partial<E> | undefined,
  merges?: GuardrailErrorMerges<E>
): GuardrailFormErrorsState<E> {
  const [showErrors, setShowErrors] = useState(false);

  const displayErrors = useMemo<E>(() => {
    const base: Record<string, unknown> = showErrors ? { ...internalErrors } : {};
    if (hostErrors) {
      for (const [key, value] of Object.entries(hostErrors)) {
        if (value === undefined) continue;
        const nested = (merges as AnyMerges | undefined)?.[key];
        base[key] = nested ? nested.merge(base[key], value) : value;
      }
    }
    return base as E;
  }, [showErrors, internalErrors, hostErrors, merges]);

  const hasHostErrors = Boolean(
    hostErrors &&
      Object.entries(hostErrors).some(([key, value]) => {
        if (value === undefined) return false;
        const hasMessage = (merges as AnyMerges | undefined)?.[key]?.hasMessage;
        if (hasMessage) return hasMessage(value);
        return typeof value !== 'object' || (value !== null && Object.keys(value).length > 0);
      })
  );

  const revealErrors = useCallback(() => setShowErrors(true), []);

  return {
    displayErrors,
    isValid: Object.keys(internalErrors).length === 0 && !hasHostErrors,
    showErrors,
    revealErrors,
  };
}
