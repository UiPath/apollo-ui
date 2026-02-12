import { useState } from 'react';
import type { Meta } from '@storybook/react-vite';
import {
  ChevronDown,
  Copy,
  Download,
  Edit,
  ExternalLink,
  FileText,
  LogOut,
  MoreHorizontal,
  Pencil,
  Settings,
  Share2,
  Star,
  Trash2,
  User,
  CreditCard,
  Users,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

const meta: Meta<typeof DropdownMenu> = {
  title: 'Components/Overlays/Dropdown',
  component: DropdownMenu,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic Dropdown
// ============================================================================

export const BasicDropdown = {
  name: 'Basic Dropdown',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Options
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>New File</DropdownMenuItem>
        <DropdownMenuItem>New Folder</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Import</DropdownMenuItem>
        <DropdownMenuItem>Export</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Preferences</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

// ============================================================================
// Dropdown with Actions
// ============================================================================

export const DropdownWithActions = {
  name: 'Dropdown with Actions',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Actions
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Star className="mr-2 h-4 w-4" />
          Add to Favorites
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuItem>Copy Link</DropdownMenuItem>
            <DropdownMenuItem>Email</DropdownMenuItem>
            <DropdownMenuItem>Slack</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

// ============================================================================
// Dropdown with Checkboxes
// ============================================================================

export const DropdownWithCheckboxes = {
  name: 'Dropdown with Checkboxes',
  render: () => {
    const [showStatus, setShowStatus] = useState(true);
    const [showActivity, setShowActivity] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(false);
    const [showTags, setShowTags] = useState(false);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Columns
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked disabled>
            Name
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
            Status
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showActivity} onCheckedChange={setShowActivity}>
            Activity
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showTimestamps} onCheckedChange={setShowTimestamps}>
            Timestamps
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showTags} onCheckedChange={setShowTags}>
            Tags
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

// ============================================================================
// Dropdown for Profile
// ============================================================================

export const DropdownForProfile = {
  name: 'Dropdown for Profile',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            JD
          </div>
          <span className="text-sm">John Doe</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">john.doe@company.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            Team
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Support
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

// ============================================================================
// Usage Examples — File Actions
// ============================================================================

export const FileActions = {
  name: 'File Actions',
  render: () => {
    const files = [
      { name: 'Q4 Revenue Report.pdf', type: 'PDF', size: '2.4 MB' },
      { name: 'Brand Guidelines.fig', type: 'Figma', size: '14.1 MB' },
      { name: 'User Research.xlsx', type: 'Excel', size: '890 KB' },
    ];

    return (
      <div className="w-[500px] rounded-lg border">
        {files.map((file, i) => (
          <div
            key={file.name}
            className={`flex items-center justify-between px-4 py-3 ${i < files.length - 1 ? 'border-b' : ''}`}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.type} · {file.size}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-40">
                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Slack</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  },
};

// ============================================================================
// Usage Examples — User Menu
// ============================================================================

export const UserMenu = {
  name: 'User Menu',
  render: () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              JD
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                JD
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          >
            {theme === 'dark' ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            Dark Mode
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help Center
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

// ============================================================================
// Usage Examples — Data Table
// ============================================================================

export const DataTable = {
  name: 'Data Table',
  render: () => {
    const rows = [
      { id: 'PRJ-001', name: 'Website Redesign', status: 'Active', owner: 'Jane C.' },
      { id: 'PRJ-002', name: 'Mobile App v2', status: 'Paused', owner: 'Alex M.' },
      { id: 'PRJ-003', name: 'API Migration', status: 'Active', owner: 'Sam W.' },
      { id: 'PRJ-004', name: 'Design System', status: 'Review', owner: 'Taylor K.' },
    ];

    return (
      <div className="w-[600px] rounded-lg border">
        {/* Header */}
        <div className="flex items-center gap-4 border-b bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground">
          <span className="w-[80px]">ID</span>
          <span className="flex-1">Project</span>
          <span className="w-[80px]">Status</span>
          <span className="w-[80px]">Owner</span>
          <span className="w-[40px]" />
        </div>
        {/* Rows */}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-4 border-b last:border-0 px-4 py-2.5 text-sm">
            <span className="w-[80px] tabular-nums text-muted-foreground">{row.id}</span>
            <span className="flex-1 font-medium">{row.name}</span>
            <span className="w-[80px]">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                row.status === 'Active' ? 'bg-primary/10 text-primary' :
                row.status === 'Paused' ? 'bg-muted text-muted-foreground' :
                'bg-yellow-500/10 text-yellow-600'
              }`}>
                {row.status}
              </span>
            </span>
            <span className="w-[80px] text-muted-foreground">{row.owner}</span>
            <span className="w-[40px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>
        ))}
      </div>
    );
  },
};
