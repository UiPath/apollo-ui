// SVG Module Declarations
// Allows TypeScript to import SVG files

declare module '*.svg' {
  const content: string;
  export default content;
}
