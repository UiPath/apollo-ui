/// <reference types="vite/client" />

// CSS modules
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
