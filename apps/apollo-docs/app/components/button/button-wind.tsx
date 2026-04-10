'use client';

import { Button } from '@uipath/apollo-wind';
import { ChevronRight, Download, Loader2, Plus, Settings, Trash2 } from 'lucide-react';
import { DemoSection } from '../../../components/DemoSection';
import { TabMeta } from '../../../components/TabMeta';

export function WindButtonDemo() {
  return (
    <div>
      <TabMeta
        storybook={{ label: 'Components / Core / Button', url: 'https://apollo-wind.vercel.app/?path=/docs/components-core-button--docs' }}
        theme="future-dark / future-light"
      />
      <DemoSection label="Variants">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </DemoSection>

      <DemoSection label="Sizes">
        <Button size="lg">Large</Button>
        <Button size="default">Default</Button>
        <Button size="sm">Small</Button>
        <Button size="xs">X-Small</Button>
        <Button size="2xs">2X-Small</Button>
        <Button size="3xs">3X-Small</Button>
      </DemoSection>

      <DemoSection label="With Icon">
        <Button><Download /> Download</Button>
        <Button variant="secondary"><Plus /> Add Item</Button>
        <Button variant="outline"><Settings /> Settings</Button>
        <Button variant="destructive"><Trash2 /> Delete</Button>
        <Button variant="ghost"><ChevronRight /> More</Button>
        <Button variant="outline"><Loader2 className="animate-spin" /> Loading</Button>
      </DemoSection>

      <DemoSection label="Icon Only">
        <Button icon size="lg"><Settings /></Button>
        <Button icon><Settings /></Button>
        <Button icon size="sm"><Settings /></Button>
        <Button icon size="xs"><Settings /></Button>
        <Button icon variant="outline"><Plus /></Button>
        <Button icon variant="ghost"><Trash2 /></Button>
        <Button icon variant="destructive"><Trash2 /></Button>
      </DemoSection>

      <DemoSection label="Disabled">
        <Button disabled>Default</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="outline" disabled>Outline</Button>
        <Button variant="ghost" disabled>Ghost</Button>
        <Button variant="destructive" disabled>Destructive</Button>
      </DemoSection>
    </div>
  );
}
