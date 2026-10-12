import {
  DocsBody,
  DocsPage,
  EditOnGitHub,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { getMDXComponents } from "../../../mdx-components";
import { getDocsPage, source } from "../../../lib/source";

const docsRepositoryBase =
  "https://github.com/UiPath/apollo-ui/blob/main/apps/apollo-vertex/content/docs";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page(props: Props) {
  const { slug } = await props.params;
  const page = getDocsPage(slug);
  const { body: MDX, toc } = await page.data.load();

  return (
    <DocsPage
      // The page H1 is the title, so leave it out of "On this page".
      toc={toc.filter((item) => item.depth > 1)}
      full={page.data.full}
      tableOfContent={{
        footer: <EditOnGitHub href={`${docsRepositoryBase}/${page.path}`} />,
      }}
    >
      {/* Pages render their own H1, so the frontmatter title is not repeated. */}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const page = getDocsPage(slug);

  return {
    title: page.data.metaTitle ?? page.data.title,
    description: page.data.description,
  };
}
