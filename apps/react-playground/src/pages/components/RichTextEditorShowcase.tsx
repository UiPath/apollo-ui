import { ApRichTextEditor } from "@uipath/apollo-react/material/components";
import { useState } from "react";
import styled from "styled-components";
import {
	PageContainer,
	PageDescription,
	PageTitle,
} from "../../components/SharedStyles";

const ShowcaseSection = styled.div`
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: var(--color-primary);
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
`;

const ComponentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-background);
  border-radius: 12px;
  border: 2px solid var(--color-border);
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-foreground-de-emp);
  font-weight: 600;
  margin-bottom: 8px;
`;

const OutputPre = styled.pre`
  margin: 0;
  padding: 12px;
  background: var(--color-background-secondary);
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-foreground);
  max-height: 160px;
  overflow: auto;
`;

const INITIAL_MARKDOWN = `# Welcome

This is the **Apollo** rich text editor, ported from portal-shell.

- Supports _markdown_ shortcuts
- Lists, [links](https://uipath.com) and \`inline code\`

> Try the toolbar above.`;

export function RichTextEditorShowcase() {
	const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
	const [html, setHtml] = useState("");

	return (
		<PageContainer>
			<PageTitle>Rich Text Editor</PageTitle>
			<PageDescription>
				Lexical-based rich text editor with a formatting toolbar, markdown
				shortcuts, lists, links, inline code, and tables. Emits both markdown
				and HTML on change.
			</PageDescription>

			<ShowcaseSection>
				<SectionTitle>Interactive</SectionTitle>
				<ComponentRow>
					<Label>Markdown editor (edit and watch the output update)</Label>
					<ApRichTextEditor
						label="Description"
						placeholder="Start typing…"
						initialContent={INITIAL_MARKDOWN}
						helperText="Markdown shortcuts are supported"
						onMarkdownChange={setMarkdown}
						onHtmlChange={setHtml}
					/>
					<div>
						<Label>Markdown output</Label>
						<OutputPre>{markdown}</OutputPre>
					</div>
					<div>
						<Label>HTML output</Label>
						<OutputPre>{html}</OutputPre>
					</div>
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>States</SectionTitle>
				<ComponentRow>
					<Label>Required</Label>
					<ApRichTextEditor
						label="Required field"
						required
						placeholder="Required…"
					/>

					<Label>Error</Label>
					<ApRichTextEditor
						label="With error"
						error
						errorMessage="This field is required"
					/>

					<Label>Disabled</Label>
					<ApRichTextEditor
						label="Disabled"
						disabled
						initialContent="You **cannot** edit this content."
					/>

					<Label>Loading</Label>
					<ApRichTextEditor label="Loading" loading />
				</ComponentRow>
			</ShowcaseSection>

			<ShowcaseSection>
				<SectionTitle>HTML input format</SectionTitle>
				<ComponentRow>
					<Label>Seeded from HTML</Label>
					<ApRichTextEditor
						label="HTML content"
						inputFormat="html"
						initialContent="<h2>HTML heading</h2><p>Seeded with <strong>HTML</strong> content.</p>"
					/>
				</ComponentRow>
			</ShowcaseSection>
		</PageContainer>
	);
}
