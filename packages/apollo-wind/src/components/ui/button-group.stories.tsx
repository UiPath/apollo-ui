import type { Meta } from '@storybook/react-vite';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Save,
  FileDown,
  Send,
  Play,
  Plus,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { Button } from './button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Switch } from './switch';
import { Label } from './label';
import { Separator } from './separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

const meta = {
  title: 'Components/Core/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;

export const Default = {
  args: {},
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
};

export const Horizontal = {
  args: {},
  render: () => (
    <ButtonGroup orientation="horizontal">
      <Button variant="outline">One</Button>
      <Button variant="outline">Two</Button>
      <Button variant="outline">Three</Button>
    </ButtonGroup>
  ),
};

export const Vertical = {
  args: {},
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup>
  ),
};

export const WithIcons = {
  args: {},
  render: () => (
    <ButtonGroup>
      <Button variant="outline" size="icon">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Underline className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  ),
};

export const TextAlignment = {
  args: {},
  render: () => (
    <ButtonGroup>
      <Button variant="outline" size="icon">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <AlignRight className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  ),
};

export const WithSeparator = {
  args: {},
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Save</Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Save as draft</DropdownMenuItem>
          <DropdownMenuItem>Save and publish</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ),
};

export const SplitButton = {
  args: {},
  render: () => (
    <ButtonGroup>
      <Button>
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Save className="h-4 w-4 mr-2" />
            Save
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileDown className="h-4 w-4 mr-2" />
            Save as...
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Send className="h-4 w-4 mr-2" />
            Save and send
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ),
};

export const Variants = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4">
      <ButtonGroup>
        <Button>Primary</Button>
        <Button>Group</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary">Secondary</Button>
        <Button variant="secondary">Group</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Outline</Button>
        <Button variant="outline">Group</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive">Group</Button>
      </ButtonGroup>
    </div>
  ),
};

export const Sizes = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Small
        </Button>
        <Button variant="outline" size="sm">
          Group
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Group</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button variant="outline" size="lg">
          Group
        </Button>
      </ButtonGroup>
    </div>
  ),
};

export const WithText = {
  args: {},
  render: () => (
    <div className="flex items-center gap-2 rounded-md border p-1">
      <ButtonGroupText>Page</ButtonGroupText>
      <ButtonGroup>
        <Button variant="ghost" size="sm">
          1
        </Button>
        <Button variant="ghost" size="sm">
          2
        </Button>
        <Button variant="ghost" size="sm">
          3
        </Button>
      </ButtonGroup>
    </div>
  ),
};

export const MixedContent = {
  args: {},
  render: () => (
    <ButtonGroup>
      <Button variant="outline">
        <Bold className="h-4 w-4 mr-2" />
        Bold
      </Button>
      <Button variant="outline">
        <Italic className="h-4 w-4 mr-2" />
        Italic
      </Button>
    </ButtonGroup>
  ),
};

export const CanvasModeToolbar = {
  args: {},
  render: () => (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      <ToggleGroup type="single" defaultValue="build" className="gap-0">
        <ToggleGroupItem
          value="build"
          className="h-8 rounded-md px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          Build
        </ToggleGroupItem>
        <ToggleGroupItem
          value="evaluate"
          className="h-8 rounded-md px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          Evaluate
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Play className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Plus className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const CanvasPublishToolbar = {
  args: {},
  render: () => (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-1 pl-3">
      <Label htmlFor="toolbar-active" className="text-sm font-medium">
        Active
      </Label>
      <Switch id="toolbar-active" />

      <Separator orientation="vertical" className="h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};
