import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface GuardrailStatusBannerProps {
  tone: 'error' | 'warning';
  message: string;
}

/** Status banner shown above the guardrail form (definition disabled / unauthorized / feature off). */
export function GuardrailStatusBanner({ tone, message }: GuardrailStatusBannerProps) {
  if (tone === 'error') {
    return (
      <Alert variant="destructive" data-slot="guardrail-status-banner">
        <AlertCircle />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }
  return (
    // A warning is a persistent notice, not an interruption: role="status" (polite live
    // region) instead of Alert's default role="alert".
    <Alert variant="warning" role="status" data-slot="guardrail-status-banner">
      <AlertTriangle />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
