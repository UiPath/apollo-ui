import type { Meta } from '@storybook/react-vite';
import { Settings, Bell, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Separator } from './separator';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta<typeof Popover> = {
  title: 'Components/Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Popover Title</h4>
          <p className="text-sm text-muted-foreground">
            This is a basic popover. It opens on click and displays supplementary content.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// ============================================================================
// Align
// ============================================================================

export const Align = {
  name: 'Align',
  render: () => (
    <div className="flex items-center justify-center gap-6 py-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60">
          <p className="text-sm">Aligned to the <span className="font-medium">start</span> (left edge) of the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-60">
          <p className="text-sm">Aligned to the <span className="font-medium">center</span> of the trigger. This is the default.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60">
          <p className="text-sm">Aligned to the <span className="font-medium">end</span> (right edge) of the trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

// ============================================================================
// With Form
// ============================================================================

export const WithForm = {
  name: 'With Form',
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Dimensions
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Dimensions</h4>
            <p className="text-xs text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input id="maxHeight" defaultValue="none" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    return (
      <div className="flex flex-wrap gap-4">
        {/* Share link */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Share Link</h4>
                <p className="text-xs text-muted-foreground">Anyone with the link can view this.</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  defaultValue="https://app.example.com/s/abc123"
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-3 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Notification settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Notification Preferences</h4>
              <Separator />
              {[
                { label: 'Email notifications', desc: 'Receive updates via email', defaultChecked: true },
                { label: 'Push notifications', desc: 'Browser push alerts', defaultChecked: false },
                { label: 'Weekly digest', desc: 'Summary every Monday', defaultChecked: true },
              ].map((item) => (
                <label key={item.label} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.defaultChecked}
                    className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Quick Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Display Settings</h4>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="density" className="text-xs">Density</Label>
                <div className="flex gap-2">
                  {['Compact', 'Default', 'Comfortable'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        opt === 'Default' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rows" className="text-xs">Rows per page</Label>
                <Input id="rows" defaultValue="25" className="h-8" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};
