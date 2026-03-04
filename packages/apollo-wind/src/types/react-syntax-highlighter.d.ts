/**
 * Type declaration for the react-syntax-highlighter Prism styles barrel.
 *
 * The bare directory import (`…/styles/prism`) isn't supported by Node's
 * ESM resolver, which breaks vitest / Jest in consuming projects.
 * Pointing at the explicit `index.js` fixes the resolution while keeping
 * the same named-export API. DefinitelyTyped only types the directory
 * path, so we need this ambient declaration for the `.js` variant.
 */

declare module 'react-syntax-highlighter/dist/esm/styles/prism/index.js' {
  export * from 'react-syntax-highlighter/dist/esm/styles/prism';
}
