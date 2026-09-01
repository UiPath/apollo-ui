import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib';

export interface GuardrailStatusBannerProps {
  tone: 'error' | 'warning';
  message: string;
}

/** Status banner shown above the guardrail form (definition disabled / unauthorized / feature off). */
export function GuardrailStatusBanner({ tone, message }: GuardrailStatusBannerProps) {
  const Icon = tone === 'error' ? AlertCircle : AlertTriangle;
  return (
    <Alert
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertDescription
        className={cn(
          tone === 'error'
            ? 'text-red-800 dark:text-red-200'
            : 'text-yellow-800 dark:text-yellow-200'
        )}
      >
        {message}
      </AlertDescription>
    </Alert>
  );
}
