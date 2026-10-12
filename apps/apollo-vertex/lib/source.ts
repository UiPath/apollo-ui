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
});

export function getDocsPage(slug: string[] | undefined) {
  const page = source.getPage(slug);
  if (!page) notFound();
  return page;
}
