import { Alert, AlertDescription } from '@uipath/apollo-wind';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export interface GuardrailStatusBannerProps {
  tone: 'error' | 'warning';
  message: string;
}

/**
 * Status banner shown above the guardrail form (definition disabled / unauthorized / feature off).
 *
 * `mt-0` cancels the AlertDescription top offset, which assumes an AlertTitle above it. With no
 * title it pushes the text 4px below the absolutely positioned icon. Drop it once apollo-wind
 * handles the title-less case.
 */
export function GuardrailStatusBanner({ tone, message }: GuardrailStatusBannerProps) {
  if (tone === 'error') {
    return (
      <Alert variant="destructive" data-slot="guardrail-status-banner">
        <AlertCircle />
        <AlertDescription className="mt-0">{message}</AlertDescription>
      </Alert>
    );
  }
  return (
    // A warning is a persistent notice, not an interruption: role="status" (polite live
    // region) instead of Alert's default role="alert".
    <Alert variant="warning" role="status" data-slot="guardrail-status-banner">
      <AlertTriangle />
      <AlertDescription className="mt-0">{message}</AlertDescription>
    </Alert>
  );
}
