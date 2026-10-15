import type { Meta, StoryObj } from '@storybook/react-vite';
import { Maximize2 } from 'lucide-react';
import { Button } from './button';
import { CodeBlock } from './code-block';

const meta: Meta<typeof CodeBlock> = {
  title: 'Chat/Components/Code Block',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A read-only, syntax highlighted code sample with a language label and a copy button. Highlighting is Prism (the light build of react-syntax-highlighter, the same engine as the Material chat) with ts, tsx, js, jsx, json, bash, python, css, html, yaml, sql, markdown, C#, VB.NET, PowerShell, Java, Go and diff registered; anything else renders as plain text. Token colors come from the --code-* theme variables, so the block follows light, dark and high contrast themes. For editable code use Monaco or CodeMirror with the Apollo editor themes.',
      },
    },
  },
  argTypes: {
    language: { control: 'text' },
    wrap: { control: 'boolean' },
    showLineNumbers: { control: 'boolean' },
    hideHeader: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="w-[560px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const TS_SAMPLE = `import { useState } from 'react';

interface Invoice {
  id: string;
  total: number;
  approved: boolean;
}

// Approve every invoice under the policy limit.
export function approveWithinPolicy(invoices: Invoice[], limit = 2500): Invoice[] {
  return invoices.map((invoice) =>
    invoice.total <= limit ? { ...invoice, approved: true } : invoice
  );
}
`;

const LONG_LINES = `const request = await fetch('https://cloud.uipath.com/organization/tenant/orchestrator_/odata/Jobs?$filter=State eq %27Faulted%27&$orderby=CreationTime desc&$top=50', { headers: { Authorization: \`Bearer \${token}\` } });
const faulted = (await request.json()).value.map((job: { Key: string; ReleaseName: string; Info: string }) => ({ key: job.Key, process: job.ReleaseName, reason: job.Info }));`;

export const Basic: Story = {
  args: {
    code: TS_SAMPLE,
    language: 'ts',
  },
};

export const LongLinesScroll: Story = {
  name: 'Long Lines: Scroll',
  args: {
    code: LONG_LINES,
    language: 'ts',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The default. Long lines keep their shape and the body scrolls horizontally. The body is focusable so keyboard users can scroll it.',
      },
    },
  },
};

export const LongLinesWrap: Story = {
  name: 'Long Lines: Wrap',
  args: {
    code: LONG_LINES,
    language: 'ts',
    wrap: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'With wrap, long lines break inside the block instead of scrolling.',
      },
    },
  },
};

export const LineNumbers: Story = {
  args: {
    code: `def approve_within_policy(invoices, limit=2500):
    """Approve every invoice under the policy limit."""
    approved = []
    for invoice in invoices:
        if invoice["total"] <= limit:
            approved.append({**invoice, "approved": True})
    return approved
`,
    language: 'python',
    showLineNumbers: true,
  },
};

export const Languages: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <CodeBlock
        language="json"
        code={'{\n  "id": "4021",\n  "total": 1240,\n  "approved": true,\n  "tags": null\n}'}
      />
      <CodeBlock language="bash" code={'pnpm add @uipath/apollo-wind\nexport TENANT="default"'} />
      <CodeBlock
        language="sql"
        code={
          'SELECT id, total\nFROM invoices\nWHERE approved = 0 AND total > 2500\nORDER BY total DESC;'
        }
      />
      <CodeBlock
        language="yaml"
        code={'policy:\n  limit: 2500\n  approvers:\n    - finance\n  enabled: true'}
      />
      <CodeBlock
        language="html"
        code={'<button class="primary" type="submit">\n  Approve\n</button>'}
      />
      <CodeBlock
        language="css"
        code={'.invoice {\n  color: var(--foreground);\n  padding: 8px;\n}'}
      />
      <CodeBlock
        language="cs"
        code={
          'var total = invoices.Where(i => !i.Approved).Sum(i => i.Total);\nConsole.WriteLine(total);'
        }
      />
      <CodeBlock
        language="vb"
        code={
          'Dim limit As Integer = 2500\nIf invoice.Total > limit Then\n    invoice.Approved = False\nEnd If'
        }
      />
      <CodeBlock
        language="powershell"
        code={'Get-ChildItem .\\invoices -Filter *.pdf |\n  Where-Object { $_.Length -gt 1MB }'}
      />
    </div>
  ),
};

export const WithActions: Story = {
  args: {
    code: '<button class="primary" type="submit">\n  Approve\n</button>',
    language: 'html',
    actions: (
      <Button variant="ghost" size="2xs" icon aria-label="Expand" title="Expand">
        <Maximize2 aria-hidden />
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Extra header actions, such as an HTML preview toggle or an expand button, go in actions. They sit before the copy button.',
      },
    },
  },
};

export const UnknownLanguage: Story = {
  args: {
    code: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. APPROVE.\nPROCEDURE DIVISION.\n    DISPLAY "Approved".\n    STOP RUN.',
    language: 'cobol',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A language that is not registered renders as plain text. The header still shows the language that was passed.',
      },
    },
  },
};

export const Strings: Story = {
  args: {
    code: 'Bonjour le monde',
    strings: { copy: 'Copier le code', copied: 'Copié', plainText: 'Texte' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'All visible and assistive copy is overridable through strings: the copy button label, the copied confirmation, and the label shown when there is no language.',
      },
    },
  },
};
