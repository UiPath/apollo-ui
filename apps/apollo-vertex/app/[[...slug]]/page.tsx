import type { Metadata } from "next";
import { getDocsPage, source } from "../../lib/source";
import { DocsPageView } from "../_components/docs-page-view";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page(props: Props) {
  const { slug } = await props.params;
  return <DocsPageView slug={slug} />;
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
