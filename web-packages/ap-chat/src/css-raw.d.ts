/**
 * Type declarations for importing CSS files as raw strings using ?raw query parameter
 * This allows TypeScript to understand imports like:
 * import cssContent from './styles.css?raw'
 */
declare module "*.css?raw" {
  const content: string;
  export default content;
}
