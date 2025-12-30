type ClassPrimitive = string | number | null | undefined | boolean;
type ClassObject = Record<string, boolean | null | undefined>;
type ClassValue = ClassPrimitive | ClassObject | ClassValue[];

function processClassValue(value: ClassValue, result: string[]): void {
  if (!value && value !== 0) return;

  if (typeof value === 'string' || typeof value === 'number') {
    result.push(String(value));
  } else if (Array.isArray(value)) {
    for (const v of value) processClassValue(v, result);
  } else if (typeof value === 'object') {
    for (const [key, isActive] of Object.entries(value)) {
      if (isActive) result.push(key);
    }
  }
}

export function cx(...classes: ClassValue[]): string {
  const result: string[] = [];
  for (const c of classes) processClassValue(c, result);
  return result.join(' ');
}
