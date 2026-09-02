import { Check, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { FormField, FormFieldError } from '@/components/ui/form-field';
import { Label, RequiredIndicator } from '@/components/ui/label';
import type { GuardrailScope, GuardrailSelector } from '../builder-types';
import type { GuardrailBuilderLabels } from '../i18n';
import { FieldShell } from './field-shell';
import { GuardrailChip } from './guardrail-chip';

const ALL_SCOPES: GuardrailScope[] = ['Agent', 'Llm', 'Tool'];

export interface GuardrailScopeSelectorProps {
  selector: GuardrailSelector;
  onChange: (selector: GuardrailSelector) => void;
  /** Tool names available for targeting (shown when Tool scope is selected) */
  availableToolNames?: string[];
  /** When provided, only these scopes are shown as options */
  allowedScopes?: GuardrailScope[];
  errors?: { scopes?: string; toolNames?: string };
  labels: GuardrailBuilderLabels;
}

/**
 * Scope selector for guardrails: which scopes (Agent, LLM, Tool) and optionally which tools
 * a guardrail targets.
 */
export function GuardrailScopeSelector({
  selector,
  onChange,
  availableToolNames = [],
  allowedScopes,
  errors,
  labels,
}: GuardrailScopeSelectorProps) {
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
    <div data-slot="guardrail-scope-selector" className="space-y-3">
      {/* Scope multi-select, always visible */}
      <FormField>
        <Label>
          {labels.scopesLabel}
          <RequiredIndicator />
        </Label>
        <FieldShell invalid={Boolean(errors?.scopes)}>
          <div className="flex flex-wrap gap-1.5">
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
        <FormFieldError>{errors?.scopes}</FormFieldError>
      </FormField>

      {/* Tool name multi-select (only when Tool scope is selected) */}
      {hasToolScope && availableToolNames.length > 0 && (
        <FormField>
          <Label>
            {labels.toolsLabel}
            <RequiredIndicator />
          </Label>
          <FieldShell invalid={Boolean(errors?.toolNames)}>
            <div className="flex flex-wrap gap-1.5">
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
          <FormFieldError>{errors?.toolNames}</FormFieldError>
        </FormField>
      )}
    </div>
  );
}
