import type * as PageTree from "fumadocs-core/page-tree";
import { loader } from "fumadocs-core/source";
import { pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { notFound } from "next/navigation";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // Compile page bodies on demand instead of bundling every page up front.
    async: true,
    schema: pageSchema.extend({
      // Browser tab title, when it differs from the sidebar title.
      metaTitle: z.string().optional(),
    }),
  },
});

export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  pageTree: {
    transformers: [{ folder: groupSeparators }],
  },
});

// Turns each separator in a folder, and the pages after it, into a
// collapsible sub-folder.
function groupSeparators(folder: PageTree.Folder): PageTree.Folder {
  if (!folder.children.some((node) => node.type === "separator")) {
    return folder;
  }

  const children: PageTree.Node[] = [];
  let group: PageTree.Folder | undefined;

  for (const node of folder.children) {
    if (node.type === "separator") {
      group = {
        type: "folder",
        $id: node.$id,
        name: node.name,
        icon: node.icon,
        collapsible: true,
        children: [],
      };
      children.push(group);
    } else if (group) {
      group.children.push(node);
    } else {
      children.push(node);
    }
  }

  return { ...folder, children };
}

export function getDocsPage(slug: string[] | undefined) {
  const page = source.getPage(slug);
  if (!page) notFound();
  return page;
}
