import { createContext } from 'react';

/**
 * Reads another field's value the way rules and data sources do: its fixed value when it has value
 * modes. MetadataForm provides it; a control outside one reads values as stored.
 */
export const LiteralValueContext = createContext<(name: string, stored: unknown) => unknown>(
  (_name, stored) => stored
);
