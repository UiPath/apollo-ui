import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import { Markdown } from './markdown';

const meta: Meta<typeof Markdown> = {
  title: 'Chat/Components/Markdown',
  component: Markdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders assistant markdown on apollo-wind tokens: GFM tables, task lists, strikethrough, autolinks and footnotes, TeX math, and fenced code through CodeBlock. Every element is styled through the react-markdown components map, and the components prop is merged over it so the chat layer can inject its own renderers (citations, resource chips). Math is rendered as MathML, as in the Material chat, so no KaTeX stylesheet is required. Raw HTML in the source is shown as text, except <br>, which becomes a line break. Unsafe link protocols are removed. Links open in a new tab, except in-page anchors and mail links, so the chat is never navigated away. Use codeWrap to wrap long code lines and renderCodeActions to add header actions to each code block.',
      },
    },
  },
  argTypes: {
    streaming: { control: 'boolean' },
    codeWrap: { control: 'boolean' },
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

export const Basic: Story = {
  args: {
    children: `# Invoice review

Three invoices are **within policy** and one exceeds the *auto-approval* threshold. Read the [approval policy](https://docs.uipath.com) or open the [review queue](/queue).

## What happens next

- Invoices 4021 and 4022 are approved.
- Invoice 4023 is ~~approved~~ waiting for review.
- You get a notification when the review closes.

### Steps for the reviewer

1. Open the review task.
2. Check the missing purchase order.
3. Approve or reject.

> Invoices above $2,500 always need a second approver. This applies to every cost centre.

---

That is everything for today.`,
  },
};

export const GfmTable: Story = {
  name: 'GFM Table',
  args: {
    children: `| Invoice | Vendor | Total | Status |
| :------ | :----- | ----: | :----: |
| 4021 | Northwind Traders | $1,240 | Approved |
| 4022 | Contoso Pharmaceuticals | $860 | Approved |
| 4023 | Fabrikam Industrial Supplies and Logistics | $5,600 | Needs review |

A wide table scrolls inside its own frame:

| Process | Robot | Folder | Started | Finished | Duration | State | Retries | Owner |
| ------- | ----- | ------ | ------- | -------- | -------: | ----- | ------: | ----- |
| Invoice intake | robot-01 | Finance/AP | 09:00 | 09:04 | 4 min | Successful | 0 | finance-ops |
| Vendor sync | robot-02 | Finance/Master data | 09:05 | 09:31 | 26 min | Faulted | 2 | data-team |`,
  },
};

export const TaskList: Story = {
  args: {
    children: `Month-end checklist:

- [x] Approve invoices within policy
- [x] Flag invoice 4023 for review
- [ ] Reconcile the budget
  - [x] Pull last week's totals
  - [ ] Hold next week's smaller invoices
- [ ] Close the month`,
  },
};

export const MathFormulas: Story = {
  name: 'Math',
  args: {
    children: `Inline math sits inside a sentence with double dollars: the remaining budget is $$b = B - \\sum_{i=1}^{n} t_i$$ for $$n$$ approved invoices. A single dollar stays literal, so $2,100 and $5,570 read as prices.

Block math goes on its own lines:

$$
\\text{overrun} = \\max\\left(0, \\sum_{i=1}^{n} t_i - B\\right)
$$

$$
\\begin{aligned}
  B &= 24{,}000 \\\\
  \\sum t_i &= 24{,}030 \\\\
  \\text{overrun} &= 30
\\end{aligned}
$$`,
  },
};

export const NestedLists: Story = {
  args: {
    children: `1. Intake
   - Read the invoice
   - Match it to a purchase order
     1. By order number
     2. By vendor and amount
2. Approval
   - Within policy: approve automatically
   - Above the limit: send to review

     The reviewer sees the blocking reason first.
3. Payment`,
  },
};

export const WithCode: Story = {
  args: {
    children: `Install the package with \`pnpm\`:

\`\`\`bash
pnpm add @uipath/apollo-wind
\`\`\`

Then approve the invoices under the limit:

\`\`\`ts
export function approveWithinPolicy(invoices: Invoice[], limit = 2500) {
  return invoices.filter((invoice) => invoice.total <= limit);
}
\`\`\`

The same in Python:

\`\`\`python
def approve_within_policy(invoices, limit=2500):
    return [i for i in invoices if i["total"] <= limit]
\`\`\`

The payload the API returns:

\`\`\`json
{ "approved": ["4021", "4022"], "review": ["4023"] }
\`\`\`

A block without a language:

\`\`\`
Approved: 2
Review: 1
\`\`\``,
  },
};

const STREAMED = `## Month-end summary

The two approved invoices total **$2,100**. Together with last week they bring the month to $18,430 against a budget of $24,000.

| Item | Amount |
| ---- | -----: |
| Approved this week | $2,100 |
| Month to date | $18,430 |
| Budget left | $5,570 |

If invoice 4023 is approved the month closes at $$24{,}030$$, which is over budget. Options:

- [ ] Hold one of next week's smaller invoices
- [ ] Ask finance to raise the limit

Here is the query I used:

\`\`\`sql
SELECT SUM(total) AS month_to_date
FROM invoices
WHERE approved = 1 AND created_at >= '2026-10-01';
\`\`\`

Let me know which option you prefer and I will prepare it.`;

const CHUNK_SIZE = 6;
const CHUNK_INTERVAL_MS = 40;

function StreamingDemo() {
  const [length, setLength] = React.useState(0);
  const streaming = length < STREAMED.length;

  React.useEffect(() => {
    if (length >= STREAMED.length) return;
    const id = setTimeout(
      () => setLength(Math.min(length + CHUNK_SIZE, STREAMED.length)),
      CHUNK_INTERVAL_MS
    );
    return () => clearTimeout(id);
  }, [length]);

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        size="xs"
        className="self-start"
        onClick={() => setLength(0)}
        disabled={streaming}
      >
        Replay
      </Button>
      <Markdown streaming={streaming}>{STREAMED.slice(0, length)}</Markdown>
    </div>
  );
}

export const Streaming: Story = {
  args: { children: '' },
  parameters: {
    docs: {
      description: {
        story:
          'A timer reveals the reply a few characters at a time. While streaming is true a caret follows the last text (or sits after a trailing code block) and the region is marked aria-busy. Partial markdown is rendered as it arrives: an unclosed fence is already a code block and half a table is still a table. The caret stops blinking when the reader prefers reduced motion.',
      },
    },
  },
  render: () => <StreamingDemo />,
};

export const ComponentsOverride: Story = {
  args: {
    children:
      'Approval rules are in the [finance policy](https://docs.uipath.com) and the [review guide](https://docs.uipath.com/guide).',
    components: {
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium text-foreground no-underline hover:bg-surface-hover"
        >
          {children}
          <ExternalLink aria-hidden className="size-3" />
        </a>
      ),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The components prop is merged over the built-in renderers. Here links render as chips, the same hook the chat layer uses for citations and resource chips (paired with remarkPlugins for custom syntax).',
      },
    },
  },
};

export const Images: Story = {
  args: {
    children:
      'By default an image renders as a link:\n\n![Quarterly chart](https://cdn.example.com/chart.png)\n\nSet images to same-origin, all or a predicate to load it inline.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Chat markdown comes from a model. A cross-origin image URL can carry conversation data to a third party, and a same-origin one can fire an authenticated request, both without any click. By default no image loads and each renders as a link the reader can open. Opt in with images set to same-origin, all for trusted content, or a predicate for an allowlist.',
      },
    },
  },
};
