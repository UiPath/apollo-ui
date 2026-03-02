import { useState, forwardRef } from 'react';
import type { Meta } from '@storybook/react-vite';
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Pencil,
  Share2,
  Download,
  FolderOpen,
  FileText,
  Image,
  Film,
  Star,
  Eye,
  EyeOff,
  ArrowUpRight,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Components/Navigation/Context Menu',
  component: ContextMenu,
  tags: ['autodocs'],
};

export default meta;

/** Reusable trigger area — forwards ref so Radix asChild can attach event handlers */
const TriggerArea = forwardRef<HTMLDivElement, { label?: string } & React.HTMLAttributes<HTMLDivElement>>(
  ({ label = 'Right click here', ...props }, ref) => (
    <div
      ref={ref}
      className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
      {...props}
    >
      {label}
    </div>
  )
);
TriggerArea.displayName = 'TriggerArea';

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TriggerArea />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuItem>Forward</ContextMenuItem>
        <ContextMenuItem>Reload</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Save As…</ContextMenuItem>
        <ContextMenuItem>Print</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>View Page Source</ContextMenuItem>
        <ContextMenuItem>Inspect</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ============================================================================
// Icons
// ============================================================================

export const Icons = {
  name: 'Icons',
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TriggerArea />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </ContextMenuItem>
        <ContextMenuItem>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem>
          <Download className="mr-2 h-4 w-4" />
          Download
        </ContextMenuItem>
        <ContextMenuItem>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ============================================================================
// Submenu
// ============================================================================

export const Submenu = {
  name: 'Submenu',
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TriggerArea />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Open
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open With
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>Text Editor</ContextMenuItem>
            <ContextMenuItem>Code Editor</ContextMenuItem>
            <ContextMenuItem>Preview</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Choose Application…</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>Copy Link</ContextMenuItem>
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Slack</ContextMenuItem>
            <ContextMenuItem>Teams</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Download className="mr-2 h-4 w-4" />
            Export As
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>PDF</ContextMenuItem>
            <ContextMenuItem>CSV</ContextMenuItem>
            <ContextMenuItem>JSON</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ============================================================================
// Shortcuts
// ============================================================================

export const Shortcuts = {
  name: 'Shortcuts',
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TriggerArea />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem>
          <RotateCcw className="mr-2 h-4 w-4" />
          Undo
          <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <RotateCw className="mr-2 h-4 w-4" />
          Redo
          <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          Select All
          <ContextMenuShortcut>⌘A</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

// ============================================================================
// Groups
// ============================================================================

export const Groups = {
  name: 'Groups',
  render: () => {
    const [showHidden, setShowHidden] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [sortBy, setSortBy] = useState('name');

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TriggerArea />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuGroup>
            <ContextMenuLabel>View</ContextMenuLabel>
            <ContextMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
              <EyeOff className="mr-2 h-4 w-4" />
              Show Hidden Files
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem checked={showPreview} onCheckedChange={setShowPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Show Preview
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Sort By</ContextMenuLabel>
            <ContextMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
              <ContextMenuRadioItem value="date">Date Modified</ContextMenuRadioItem>
              <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
              <ContextMenuRadioItem value="type">Type</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem>
              <FolderOpen className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              New File
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => {
    const [starred, setStarred] = useState(false);

    const files = [
      { name: 'Project Brief.pdf', icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
      { name: 'Hero Banner.png', icon: <Image className="h-4 w-4 text-muted-foreground" /> },
      { name: 'Demo Recording.mp4', icon: <Film className="h-4 w-4 text-muted-foreground" /> },
    ];

    return (
      <div className="flex flex-col gap-1 w-[320px] rounded-lg border p-2">
        {files.map((file) => (
          <ContextMenu key={file.name}>
            <ContextMenuTrigger asChild>
              <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent cursor-default">
                {file.icon}
                <span>{file.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52">
              <ContextMenuItem>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Open
              </ContextMenuItem>
              <ContextMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
                <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
                <ContextMenuShortcut>⌘D</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-44">
                  <ContextMenuItem>Copy Link</ContextMenuItem>
                  <ContextMenuItem>Email</ContextMenuItem>
                  <ContextMenuItem>Slack</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem
                checked={starred}
                onCheckedChange={setStarred}
              >
                <Star className="mr-2 h-4 w-4" />
                Starred
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
                <ContextMenuShortcut>⌫</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    );
  },
};
