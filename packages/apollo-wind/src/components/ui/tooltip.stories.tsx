import type { Meta } from '@storybook/react-vite';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Download,
  Heart,
  Info,
  Pencil,
  Plus,
  Settings,
  Share2,
  Trash2,
  Undo,
  Redo,
  Keyboard,
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Separator } from './separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

// ============================================================================
// Position
// ============================================================================

export const Position = {
  name: 'Position',
  render: () => (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-6 py-16">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Tooltip on top</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Tooltip on bottom</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Tooltip on left</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Tooltip on right</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

// ============================================================================
// Tooltip with Icons
// ============================================================================

export const TooltipWithIcons = {
  name: 'Tooltip with Icons',
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {[
          { icon: <Bold className="h-4 w-4" />, label: 'Bold' },
          { icon: <Italic className="h-4 w-4" />, label: 'Italic' },
          { icon: <Underline className="h-4 w-4" />, label: 'Underline' },
          { divider: true },
          { icon: <AlignLeft className="h-4 w-4" />, label: 'Align Left' },
          { icon: <AlignCenter className="h-4 w-4" />, label: 'Align Center' },
          { icon: <AlignRight className="h-4 w-4" />, label: 'Align Right' },
        ].map((item, i) =>
          'divider' in item ? (
            <Separator key={i} orientation="vertical" className="mx-1 h-6" />
          ) : (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>
    </TooltipProvider>
  ),
};

// ============================================================================
// Tooltip with Rich Content
// ============================================================================

export const TooltipWithRichContent = {
  name: 'Tooltip with Rich Content',
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="mr-2 h-4 w-4" />
              API Limits
            </Button>
          </TooltipTrigger>
          <TooltipContent className="w-64 p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Rate Limiting</p>
              <p className="text-xs text-muted-foreground">
                Your current plan allows 1,000 requests per minute. Exceeding this limit will result in 429 errors.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                Press ⌘K to view full docs
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="mr-2 h-4 w-4" />
              Storage
            </Button>
          </TooltipTrigger>
          <TooltipContent className="w-56 p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Storage Usage</p>
              <div className="h-1.5 w-full rounded-full bg-secondary">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                7.5 GB of 10 GB used
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

// ============================================================================
// Tooltip with Different Content
// ============================================================================

export const TooltipWithDifferentContent = {
  name: 'Tooltip with Different Content',
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        {/* Short text */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Short</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save</p>
          </TooltipContent>
        </Tooltip>

        {/* With shortcut */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">With Shortcut</Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <span>Save</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘S</kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Multi-line */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Multi-line</Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[200px]">
            <p>This tooltip has a longer description that wraps across multiple lines.</p>
          </TooltipContent>
        </Tooltip>

        {/* Disabled state info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button variant="outline" size="sm" disabled>Disabled</Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>You need admin access to perform this action.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

// ============================================================================
// Tooltip with Form Elements
// ============================================================================

export const TooltipWithFormElements = {
  name: 'Tooltip with Form Elements',
  render: () => (
    <TooltipProvider>
      <div className="flex flex-col gap-4 max-w-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="api-key" className="text-sm font-medium">API Key</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <p>Your API key is used to authenticate requests. Keep it secret.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input id="api-key" placeholder="sk-..." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="webhook" className="text-sm font-medium">Webhook URL</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <p>We'll send POST requests to this URL when events occur.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input id="webhook" placeholder="https://..." />
        </div>
      </div>
    </TooltipProvider>
  ),
};

// ============================================================================
// Tooltip with Delay (Instant)
// ============================================================================

export const TooltipWithDelay = {
  name: 'Tooltip with Delay',
  render: () => (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Instant Tooltip</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This tooltip appears immediately with zero delay.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => (
    <TooltipProvider>
      <div className="flex flex-col gap-8">
        {/* Toolbar */}
        <div>
          <p className="text-sm font-medium mb-3">Toolbar</p>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {[
              { icon: <Undo className="h-4 w-4" />, label: 'Undo', shortcut: '⌘Z' },
              { icon: <Redo className="h-4 w-4" />, label: 'Redo', shortcut: '⇧⌘Z' },
              { divider: true },
              { icon: <Plus className="h-4 w-4" />, label: 'Add item', shortcut: '⌘N' },
              { icon: <Pencil className="h-4 w-4" />, label: 'Edit', shortcut: '⌘E' },
              { icon: <Copy className="h-4 w-4" />, label: 'Duplicate', shortcut: '⌘D' },
              { divider: true },
              { icon: <Share2 className="h-4 w-4" />, label: 'Share' },
              { icon: <Download className="h-4 w-4" />, label: 'Download' },
              { divider: true },
              { icon: <Trash2 className="h-4 w-4" />, label: 'Delete', shortcut: '⌫' },
            ].map((item, i) =>
              'divider' in item ? (
                <Separator key={i} orientation="vertical" className="mx-0.5 h-6" />
              ) : (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {item.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">{item.shortcut}</kbd>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div>
          <p className="text-sm font-medium mb-3">Action Buttons</p>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <Heart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to favorites</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share project</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="icon" variant="outline" disabled>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select items to delete</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  ),
};
