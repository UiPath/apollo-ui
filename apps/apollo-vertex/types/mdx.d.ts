// Typed default export for MDX page imports (e.g. the coded-app index pages).
declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
