import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { getMDXComponents } from "../../../mdx-components";
import { ComponentGuidance } from "../../_components/component-guidance";
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
  const isHome = page.slugs.length === 0;

  return (
    <DocsPage
      toc={toc}
      full={page.data.full}
      tableOfContent={{
        footer: <EditOnGitHub href={`${docsRepositoryBase}/${page.path}`} />,
      }}
    >
      {!isHome && (
        <>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
        </>
      )}
      <DocsBody>
        <ComponentGuidance
          whenToUse={page.data.whenToUse}
          avoidWhen={page.data.avoidWhen}
          example={page.data.example}
        />
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
