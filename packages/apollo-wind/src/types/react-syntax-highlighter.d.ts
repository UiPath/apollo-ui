/**
 * DefinitelyTyped only declares react-syntax-highlighter's deep paths without an extension, but
 * Node's ESM resolver (SSR, consumer test runners that externalize this package) needs the `.js`.
 * These map the `.js` paths CodeBlock imports onto the typed ones.
 */

declare module 'react-syntax-highlighter/dist/esm/prism-light.js' {
  export { default } from 'react-syntax-highlighter/dist/esm/prism-light';
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*.js' {
  const language: unknown;
  export default language;
}
