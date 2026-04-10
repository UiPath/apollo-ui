'use client';

interface TabMetaProps {
  storybook?: {
    label: string;
    url: string;
  };
  theme: string;
}

export function TabMeta({ storybook, theme }: TabMetaProps) {
  return (
    <ul className="mt-6 mb-6 space-y-2 text-sm list-none p-0 m-0">
      {storybook && (
        <li className="flex items-center gap-2">
          <span className="text-muted-foreground">Storybook</span>
          <span className="text-muted-foreground">—</span>
          <a
            href={storybook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {storybook.label}
          </a>
        </li>
      )}
      <li className="flex items-center gap-2">
        <span className="text-muted-foreground">Theme</span>
        <span className="text-muted-foreground">—</span>
        <span className="font-mono text-xs">{theme}</span>
      </li>
    </ul>
  );
}
