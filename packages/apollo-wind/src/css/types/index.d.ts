/**
 * TypeScript type definitions for Apollo Wind
 * These types ensure type safety when using Apollo Wind with Tailwind CSS
 */

import type { Config } from 'tailwindcss';

/**
 * Apollo Wind preset configuration
 */
export type ApolloWindPreset = Partial<Config>;

/**
 * Apollo color token type
 */
export interface ApolloColor {
  [key: string]: string | ApolloColor;
}

/**
 * Apollo typography configuration
 */
export interface ApolloTypography {
  [key: string]: string | string[];
}

/**
 * Apollo spacing scale
 */
export interface ApolloSpacing {
  [key: string]: string;
}

/**
 * Apollo shadow configuration
 */
export interface ApolloShadow {
  [key: string]: string;
}

/**
 * Apollo animation configuration
 */
export interface ApolloAnimation {
  [key: string]: string;
}

/**
 * Plugin function type
 */
export type ApolloPlugin = ReturnType<Config['plugins']>[number];

/**
 * Re-export Tailwind Config type for convenience
 */
export type { Config as TailwindConfig } from 'tailwindcss';
