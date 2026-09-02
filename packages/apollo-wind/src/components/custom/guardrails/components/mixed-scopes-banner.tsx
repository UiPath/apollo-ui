import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { GuardrailBuilderLabels } from '../i18n';

export interface MixedScopesBannerProps {
  /** Pre-localized scope labels + tool names the guardrail also applies to; null hides the banner. */
  otherAppliedScopes: { scopes: string[]; tools: string[] } | null;
  labels: Pick<GuardrailBuilderLabels, 'mixedScopesAlsoApplied' | 'mixedScopesSaveAsNewHint'>;
}

/**
 * Info banner shown when a guardrail has mixed scopes (e.g. Agent + Tool): lists the other
 * scopes/tools it applies to and suggests "Save as new".
 */
export function MixedScopesBanner({ otherAppliedScopes, labels }: MixedScopesBannerProps) {
  if (!otherAppliedScopes) return null;

  return (
    <Alert variant="info" data-slot="guardrail-mixed-scopes-banner">
      <AlertCircle />
      <AlertDescription>
        <p>{labels.mixedScopesAlsoApplied}</p>
        <ul className="list-disc pl-5 mt-1">
          {otherAppliedScopes.scopes.map((s) => (
            <li key={s}>{s}</li>
          ))}
          {otherAppliedScopes.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
        <p>{labels.mixedScopesSaveAsNewHint}</p>
      </AlertDescription>
    </Alert>
  );
}
