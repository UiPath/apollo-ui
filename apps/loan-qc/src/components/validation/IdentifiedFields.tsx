import type { IdentifiedField } from '@/lib/types';

interface IdentifiedFieldsProps {
  fields: IdentifiedField[];
}

export function IdentifiedFields({ fields }: IdentifiedFieldsProps) {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div className="text-xs font-normal leading-4 tracking-[0.12px] w-full flex flex-col gap-2">
      {fields.map((field, index) => {
        // If field has sourceValue/targetValue, show comparison format
        if (field.sourceValue !== undefined || field.targetValue !== undefined) {
          const sourceLabel = 'Source';
          const targetLabel = 'Target';

          return (
            <div key={index} className="flex flex-col gap-1">
              <span className="leading-4">{field.label}</span>
              <div className="flex flex-col gap-0.5 pl-2 mb-2 border-l border-border">
                {field.sourceValue !== undefined && (
                  <span className="leading-4">
                    <span className="text-muted-foreground">{sourceLabel}: </span>
                    <span className="font-semibold">{field.sourceValue}</span>
                  </span>
                )}
                {field.targetValue !== undefined && (
                  <span className="leading-4">
                    <span className="text-muted-foreground">{targetLabel}: </span>
                    <span className="font-semibold">{field.targetValue}</span>
                  </span>
                )}
              </div>
            </div>
          );
        }

        // Otherwise show simple format
        return (
          <span key={index} className="block leading-4">
            <span className="leading-4">{field.label}: </span>
            <span className="font-semibold leading-4">{field.value}</span>
          </span>
        );
      })}
    </div>
  );
}
