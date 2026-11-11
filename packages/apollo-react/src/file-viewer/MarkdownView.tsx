import {
  CodeBlock,
  Markdown,
  type MarkdownImagePolicy,
  type MarkdownStrings,
} from '@uipath/apollo-wind';

import { splitFrontmatter } from './frontmatter';

export interface MarkdownViewProps {
  content: string;
  images: MarkdownImagePolicy;
  strings?: Partial<MarkdownStrings>;
}

/** The rendered markdown, with its frontmatter shown apart as YAML above the body. */
export function MarkdownView({ content, images, strings }: MarkdownViewProps) {
  const { frontmatter, body } = splitFrontmatter(content);
  const hasFrontmatter = frontmatter !== null;

  return (
    <div className="h-full min-h-0 overflow-auto p-6" data-testid="file-viewer-rendered">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {hasFrontmatter && <CodeBlock code={frontmatter} language="yaml" strings={strings} />}
        <Markdown images={images} strings={strings}>
          {body}
        </Markdown>
      </div>
    </div>
  );
}
