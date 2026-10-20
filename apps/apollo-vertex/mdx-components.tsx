import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { PackageInstall } from "./app/_components/package-install";
import { Preview } from "./app/_components/preview";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    PackageInstall,
    Preview,
    ...components,
  } satisfies MDXComponents;
}
