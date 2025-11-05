// Apollo Utils - Shared utilities and helpers

// Formatting utilities
export const formatDate = (date: Date, _format: string): string => {
  // Placeholder implementation
  return date.toLocaleDateString();
};

export const formatNumber = (num: number): string => {
  // Placeholder implementation
  return num.toLocaleString();
};

export const formatCurrency = (amount: number, currency: string): string => {
  // Placeholder implementation
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Accessibility helpers
export const generateId = (prefix: string): string => {
  // Placeholder implementation
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getFocusableElements = (_container: HTMLElement): HTMLElement[] => {
  // Placeholder implementation
  return [];
};

// Common helpers
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

export const classNames = (
  ...classes: (string | Record<string, boolean> | undefined)[]
): string => {
  return classes
    .flatMap((cls) => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
};
