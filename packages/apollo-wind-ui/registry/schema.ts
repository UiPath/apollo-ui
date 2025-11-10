/**
 * TypeScript types for shadcn/ui registry schema
 * Based on: https://ui.shadcn.com/schema/registry.json
 */

export type RegistryType =
  | 'registry:ui'
  | 'registry:component'
  | 'registry:block'
  | 'registry:lib'
  | 'registry:hook'
  | 'registry:page'
  | 'registry:file'
  | 'registry:style'
  | 'registry:theme'
  | 'registry:item';

export interface RegistryFile {
  path: string;
  type: RegistryType;
  content?: string;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: RegistryType;
  files: RegistryFile[];
  title?: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: string;
  tailwind?: Record<string, unknown>;
  envVars?: Record<string, string>;
  docs?: string;
  categories?: string[];
  meta?: Record<string, unknown>;
}

export interface Registry {
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryItem[];
}
