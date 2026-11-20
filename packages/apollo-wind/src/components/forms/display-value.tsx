import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/ui/markdown';
import type { DisplayFieldMetadata } from './form-schema';

interface DisplayValueProps {
  field: DisplayFieldMetadata;
  value: unknown;
}

function toText(value: unknown, options?: DisplayFieldMetadata['options']): string {
  if (value === undefined || value === null) return '';
  const label = (item: unknown) =>
    options?.find((option) => String(option.value) === String(item))?.label ?? String(item);
  if (Array.isArray(value)) return value.map(label).join(', ');
  return label(value);
}

/** The value of a `display` field: inline text or a tinted callout, plain or markdown. */
export function DisplayValue({ field, value }: DisplayValueProps) {
  const raw = toText(value, field.options);
  const text = raw.trim() === '' ? (field.emptyText ?? '') : raw;
  if (text === '') return null;

  const body =
    field.format === 'markdown' ? (
      <Markdown className="text-sm text-foreground">{text}</Markdown>
    ) : (
      <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>
    );

  if (field.callout) {
    return (
      <Alert role="note" aria-labelledby={`${field.name}-label`} data-slot="display-callout">
        {field.badge ? (
          <div className="mb-2 flex justify-end">
            <Badge variant="secondary">{field.badge}</Badge>
          </div>
        ) : null}
        {body}
      </Alert>
    );
  }
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="group" names the value without fieldset chrome
    <div
      data-slot="display-value"
      role="group"
      aria-labelledby={`${field.name}-label`}
      className="flex items-start gap-2"
    >
      {body}
      {field.badge ? <Badge variant="secondary">{field.badge}</Badge> : null}
    </div>
  );
}
