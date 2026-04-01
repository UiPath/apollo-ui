import type { Meta } from '@storybook/react-vite';
import { ScrollArea } from './scroll-area';
import { Separator } from './separator';

const meta: Meta<typeof ScrollArea> = {
  title: 'Components/Layout/Scroll Area',
  component: ScrollArea,
  tags: ['autodocs'],
};

export default meta;

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

export const Default = {
  args: {},
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <>
            <div key={tag} className="text-sm">
              {tag}
            </div>
            <Separator className="my-2" />
          </>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const HorizontalOverflow = {
  args: {},
  render: () => (
    <ScrollArea className="w-96 rounded-md border">
      <div className="flex gap-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex h-20 w-36 shrink-0 items-center justify-center rounded-md border bg-muted text-sm"
          >
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const BothAxesOverflow = {
  args: {},
  render: () => (
    <ScrollArea className="h-72 w-96 rounded-md border">
      <div className="p-4">
        {Array.from({ length: 20 }).map((_, row) => (
          <div key={row} className="flex gap-4 py-2">
            {Array.from({ length: 10 }).map((_, col) => (
              <div
                key={col}
                className="flex h-16 w-32 shrink-0 items-center justify-center rounded-md border bg-muted text-sm"
              >
                {row + 1}, {col + 1}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
