import { Alert, AlertDescription } from '@uipath/apollo-wind';
import { AlertCircle } from 'lucide-react';
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
        {/* Keys are prefixed by source: both lists render as siblings of one <ul>, and a tool
            may legitimately be named after a scope ("Agent", "Tools"), which would otherwise
            collide into duplicate keys and misreconcile the list. */}
        <ul className="list-disc pl-5 mt-1">
          {otherAppliedScopes.scopes.map((scope) => (
            <li key={`scope:${scope}`}>{scope}</li>
          ))}
          {otherAppliedScopes.tools.map((tool) => (
            <li key={`tool:${tool}`}>{tool}</li>
          ))}
        </ul>
        <p>{labels.mixedScopesSaveAsNewHint}</p>
      </AlertDescription>
    </Alert>
  );
}
