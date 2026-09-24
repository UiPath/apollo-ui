import { cn, FormField, FormFieldError, Label, RequiredIndicator } from '@uipath/apollo-wind';
import { Check, Plus } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo } from 'react';
import type {
  GuardrailScope,
  GuardrailScopeSelectorErrors,
  GuardrailSelector,
} from '../builder-types';
import { type GuardrailScopeSelectorLabels, useGuardrailScopeSelectorLabels } from '../i18n';
import { FieldShell } from './field-shell';
import { GuardrailChip } from './guardrail-chip';

const ALL_SCOPES: GuardrailScope[] = ['Agent', 'Llm', 'Tool'];

export interface GuardrailScopeSelectorProps {
  selector: GuardrailSelector;
  /** Receives the whole next selector; `matchNames` only while Tool scope is selected. */
  onChange: (selector: GuardrailSelector) => void;
  /** Tool names available for targeting (shown when Tool scope is selected) */
  availableToolNames?: string[];
  /** When provided, only these scopes are shown as options */
  allowedScopes?: GuardrailScope[];
  /** Validation messages; each renders as soon as it is present. */
  errors?: GuardrailScopeSelectorErrors;
  /** Per-string overrides; anything omitted resolves from the canvas lingui catalog. */
  labels?: Partial<GuardrailScopeSelectorLabels>;
  className?: string;
}

/**
 * Scope selector for guardrails: which scopes (Agent, LLM, Tool) and optionally which tools
 * a guardrail targets.
 *
 * Rendered inside `GuardrailBuilder`, and usable on its own with `selector` and `onChange`
 * alone: labels come from the catalog.
 */
export function GuardrailScopeSelector({
  selector,
  onChange,
  availableToolNames = [],
  allowedScopes,
  errors,
  labels: labelOverrides,
  className,
}: GuardrailScopeSelectorProps) {
  const labels = useGuardrailScopeSelectorLabels(labelOverrides);
  // Namespaced per instance: two builders can share a document (inline panels).
  const uid = useId();

  const scopeLabels = useMemo<Record<GuardrailScope, string>>(
    () => ({
      Agent: labels.scopeAgentLabel,
      Llm: labels.scopeLlmLabel,
      Tool: labels.scopeToolLabel,
    }),
    [labels]
  );
  const selectedScopes = useMemo(() => selector.scopes ?? [], [selector.scopes]);
  const hasTools = availableToolNames.length > 0;
  const visibleScopes = useMemo(() => {
    const scopes = allowedScopes ?? ALL_SCOPES;
    return hasTools ? scopes : scopes.filter((s) => s !== 'Tool');
  }, [allowedScopes, hasTools]);

  // When tools disappear while Tool scope is selected, strip it from the selector to avoid
  // invisible invalid state the user can't fix via the UI. (Deliberate self-healing side
  // effect, kept for parity with the original implementation.)
  useEffect(() => {
    if (!hasTools && selectedScopes.includes('Tool')) {
      const cleaned = selectedScopes.filter((s) => s !== 'Tool');
      onChange({ scopes: cleaned });
    }
  }, [hasTools, selectedScopes, onChange]);

  const handleToggleScope = useCallback(
    (scope: GuardrailScope) => {
      const isSelected = selectedScopes.includes(scope);
      const newScopes = isSelected
        ? selectedScopes.filter((s) => s !== scope)
        : [...selectedScopes, scope];
      const hasToolScope = newScopes.includes('Tool');
      if (!hasToolScope) {
        onChange({ scopes: newScopes });
      } else if (!isSelected && scope === 'Tool') {
        // Toggling Tool ON: pre-select all available tools
        onChange({ scopes: newScopes, matchNames: [...availableToolNames] });
      } else {
        onChange({ scopes: newScopes, matchNames: selector.matchNames ?? [...availableToolNames] });
      }
    },
    [selectedScopes, selector.matchNames, availableToolNames, onChange]
  );

  const handleToggleTool = useCallback(
    (toolName: string) => {
      const current = selector.matchNames ?? [];
      const isSelected = current.includes(toolName);
      const newMatchNames = isSelected
        ? current.filter((n) => n !== toolName)
        : [...current, toolName];
      onChange({ ...selector, matchNames: newMatchNames });
    },
    [selector, onChange]
  );

  const selectedTools = useMemo(() => selector.matchNames ?? [], [selector.matchNames]);
  const hasToolScope = selectedScopes.includes('Tool');

  // Split tools into "currently targeted" (in matchNames) and "available to add" (in
  // availableToolNames but not in matchNames). Distinct groups with Check vs Plus icons
  // avoid a newly-added tool appearing "selected" merely by rendering alongside targeted
  // ones with subtle styling differences.
  const targetedTools = useMemo(
    () => selectedTools.filter((name) => availableToolNames.includes(name)),
    [selectedTools, availableToolNames]
  );
  const addableTools = useMemo(
    () => availableToolNames.filter((name) => !selectedTools.includes(name)),
    [availableToolNames, selectedTools]
  );

  return (
    <div data-slot="guardrail-scope-selector" className={cn('space-y-3', className)}>
      {/* Scope multi-select, always visible */}
      <FormField>
        {/* The chips are Toggle buttons, not labelable controls, so a bare <label> here names
            nothing — the group had no accessible name at all and the error was announced only by
            its own aria-live. role=group + aria-labelledby is the conventional fix. Note axe does
            not flag an orphan <label>, so the a11y suite was green over this.

            No aria-required: it is not a permitted attribute on role=group, and adding it trips
            aria-allowed-attr. The requirement is carried by the label's RequiredIndicator and,
            when unmet, by the associated error. */}
        <Label id={`${uid}-scopes-label`}>
          {labels.scopesLabel}
          <RequiredIndicator />
        </Label>
        <FieldShell invalid={Boolean(errors?.scopes)}>
          {/* biome-ignore lint/a11y/useSemanticElements: <fieldset> requires <legend> as its
              first child, which would pull the styled Label (with its RequiredIndicator) inside
              FieldShell and change the layout. role=group + aria-labelledby gives assistive tech
              the identical result, and is what the review asked for. */}
          <div
            role="group"
            aria-labelledby={`${uid}-scopes-label`}
            aria-invalid={errors?.scopes ? true : undefined}
            aria-describedby={errors?.scopes ? `${uid}-scopes-error` : undefined}
            className="flex flex-wrap gap-1.5"
          >
            {visibleScopes.map((scope) => (
              <GuardrailChip
                key={scope}
                pressed={selectedScopes.includes(scope)}
                onPressedChange={() => handleToggleScope(scope)}
              >
                {scopeLabels[scope]}
              </GuardrailChip>
            ))}
          </div>
        </FieldShell>
        <FormFieldError id={`${uid}-scopes-error`}>{errors?.scopes}</FormFieldError>
      </FormField>

      {/* Tool name multi-select (only when Tool scope is selected) */}
      {hasToolScope && availableToolNames.length > 0 && (
        <FormField>
          <Label id={`${uid}-tools-label`}>
            {labels.toolsLabel}
            <RequiredIndicator />
          </Label>
          <FieldShell invalid={Boolean(errors?.toolNames)}>
            {/* biome-ignore lint/a11y/useSemanticElements: see the note on the scopes group. */}
            <div
              role="group"
              aria-labelledby={`${uid}-tools-label`}
              aria-invalid={errors?.toolNames ? true : undefined}
              aria-describedby={errors?.toolNames ? `${uid}-tools-error` : undefined}
              className="flex flex-wrap gap-1.5"
            >
              {targetedTools.map((name) => (
                <GuardrailChip
                  key={`targeted-${name}`}
                  pressed={true}
                  onPressedChange={() => handleToggleTool(name)}
                >
                  <Check aria-hidden="true" />
                  {name}
                </GuardrailChip>
              ))}
              {addableTools.map((name) => (
                <GuardrailChip
                  key={`addable-${name}`}
                  appearance="addable"
                  pressed={false}
                  onPressedChange={() => handleToggleTool(name)}
                >
                  <Plus aria-hidden="true" />
                  {name}
                </GuardrailChip>
              ))}
            </div>
          </FieldShell>
          <FormFieldError id={`${uid}-tools-error`}>{errors?.toolNames}</FormFieldError>
        </FormField>
      )}
    </div>
  );
}
