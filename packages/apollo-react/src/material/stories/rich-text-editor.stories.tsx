import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ApRichTextEditor } from '../components';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Lexical-based rich text editor with a formatting toolbar, markdown
 * shortcuts, lists, links, inline code, and tables. Emits both markdown and
 * HTML on change.
 *
 * Apollo-only component:
 * `import { ApRichTextEditor } from '@uipath/apollo-react/material/components';`
 */
const meta: Meta = {
  title: 'Components/Rich Text Editor',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const INITIAL_MARKDOWN = `# Welcome

This is the **Apollo** rich text editor, ported from portal-shell.

- Supports _markdown_ shortcuts
- Lists, [links](https://uipath.com) and \`inline code\`

> Try the toolbar above.`;

function LabeledBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function OutputBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={(theme) => ({
          m: 0,
          p: 1.5,
          borderRadius: 1,
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 160,
          overflow: 'auto',
          color: theme.palette.semantic.colorForeground,
          backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
        })}
      >
        {value}
      </Box>
    </Box>
  );
}

function InteractiveDemo() {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [html, setHtml] = useState('');

  return (
    <Stack spacing={2}>
      <ApRichTextEditor
        label="Description"
        placeholder="Start typing…"
        initialContent={INITIAL_MARKDOWN}
        helperText="Markdown shortcuts are supported"
        onMarkdownChange={setMarkdown}
        onHtmlChange={setHtml}
      />
      <OutputBlock label="Markdown output" value={markdown} />
      <OutputBlock label="HTML output" value={html} />
    </Stack>
  );
}

export const Interactive: Story = {
  render: () => (
    <Section
      title="Interactive"
      description="Markdown editor — edit and watch the markdown and HTML outputs update."
    >
      <InteractiveDemo />
    </Section>
  ),
};

export const States: Story = {
  render: () => (
    <Section title="States" description="Required, error, disabled and loading states.">
      <Stack spacing={3}>
        <LabeledBlock label="Required">
          <ApRichTextEditor label="Required field" required placeholder="Required…" />
        </LabeledBlock>
        <LabeledBlock label="Error">
          <ApRichTextEditor label="With error" error errorMessage="This field is required" />
        </LabeledBlock>
        <LabeledBlock label="Disabled">
          <ApRichTextEditor
            label="Disabled"
            disabled
            initialContent="You **cannot** edit this content."
          />
        </LabeledBlock>
        <LabeledBlock label="Loading">
          <ApRichTextEditor label="Loading" loading />
        </LabeledBlock>
      </Stack>
    </Section>
  ),
};

export const HtmlInputFormat: Story = {
  render: () => (
    <Section
      title="HTML input format"
      description="Seed the editor from HTML content via inputFormat='html'."
    >
      <ApRichTextEditor
        label="HTML content"
        inputFormat="html"
        initialContent="<h2>HTML heading</h2><p>Seeded with <strong>HTML</strong> content.</p>"
      />
    </Section>
  ),
};
