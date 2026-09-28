'use client';

import { Button } from '@uipath/apollo-wind';

export function WindButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6 rounded-lg border border-border bg-card">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
