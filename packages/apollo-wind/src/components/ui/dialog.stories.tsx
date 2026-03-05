import type { Meta } from '@storybook/react-vite';
import { ExternalLink } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic Dialog
// ============================================================================

export const BasicDialog = {
  name: 'Basic Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" defaultValue="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input id="username" defaultValue="@johndoe" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================================================
// Complex Dialog
// ============================================================================

export const ComplexDialog = {
  name: 'Complex Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to set up your new project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" placeholder="My Awesome Project" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-desc">Description</Label>
            <Input id="project-desc" placeholder="A brief description of the project" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="team">Team</Label>
              <Input id="team" placeholder="Engineering" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Input id="visibility" placeholder="Private" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" placeholder="react, typescript, design-system" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================================================
// Link Dialog
// ============================================================================

export const LinkDialog = {
  name: 'Link Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Share Link</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Link</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this document.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            defaultValue="https://app.example.com/share/abc123xyz"
            className="flex-1"
          />
          <Button size="sm">Copy</Button>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Browser
          </Button>
          <p className="text-xs text-muted-foreground">Link expires in 7 days</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================================================
// No Button Dialog
// ============================================================================

export const NoButtonDialog = {
  name: 'No Button Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">What's New</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What's New in v2.4</DialogTitle>
          <DialogDescription>
            Here's a summary of the latest updates and improvements.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
            <div>
              <p className="text-sm font-medium">Improved Performance</p>
              <p className="text-xs text-muted-foreground">Pages now load 40% faster with optimized data fetching.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
            <div>
              <p className="text-sm font-medium">Dark Mode Support</p>
              <p className="text-xs text-muted-foreground">Full dark mode is now available across all pages and components.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
            <div>
              <p className="text-sm font-medium">New Export Options</p>
              <p className="text-xs text-muted-foreground">Export your data as CSV, JSON, or PDF with a single click.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================================================
// Scrollable Content Dialog
// ============================================================================

export const ScrollableContentDialog = {
  name: 'Scrollable Content Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Terms of Service</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Please read and accept the terms of service to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 py-4 text-sm text-muted-foreground">
          <div>
            <h4 className="mb-1 font-medium text-foreground">1. Acceptance of Terms</h4>
            <p>By accessing and using this service, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use this service. We reserve the right to modify these terms at any time, and your continued use of the service constitutes acceptance of any changes.</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">2. Description of Service</h4>
            <p>Our platform provides cloud-based automation tools for enterprise workflows. The service includes, but is not limited to, process automation, document understanding, and AI-powered decision making. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">3. User Accounts</h4>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security. We cannot and will not be liable for any loss or damage arising from your failure to comply with this requirement.</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">4. Privacy Policy</h4>
            <p>Your use of the service is also governed by our Privacy Policy, which is incorporated into these terms by reference. Please review our Privacy Policy to understand our practices regarding the collection, use, and disclosure of your personal information.</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">5. Intellectual Property</h4>
            <p>All content, features, and functionality of the service are owned by us, our licensors, or other providers. These materials are protected by copyright, trademark, patent, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">6. Limitation of Liability</h4>
            <p>In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
          </div>
          <div>
            <h4 className="mb-1 font-medium text-foreground">7. Governing Law</h4>
            <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is incorporated, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of that jurisdiction.</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Decline</Button>
          </DialogClose>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ============================================================================
// Sticky Footer Dialog
// ============================================================================

export const StickyFooterDialog = {
  name: 'Sticky Footer Dialog',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Invite Members</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Invite Team Members</DialogTitle>
          <DialogDescription>
            Add people to your workspace. They will receive an email invitation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {[
            { name: 'Jane Cooper', email: 'jane@company.com', role: 'Admin' },
            { name: 'Alex Morgan', email: 'alex@company.com', role: 'Editor' },
            { name: 'Sam Wilson', email: 'sam@company.com', role: 'Viewer' },
            { name: 'Taylor Kim', email: 'taylor@company.com', role: 'Editor' },
            { name: 'Jordan Lee', email: 'jordan@company.com', role: 'Viewer' },
            { name: 'Casey Brown', email: 'casey@company.com', role: 'Editor' },
            { name: 'Riley Chen', email: 'riley@company.com', role: 'Admin' },
            { name: 'Morgan Davis', email: 'morgan@company.com', role: 'Viewer' },
          ].map((person) => (
            <div key={person.email} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.email}</p>
              </div>
              <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">{person.role}</span>
            </div>
          ))}
        </div>
        <div className="border-t px-6 py-4 flex items-center gap-2">
          <Input placeholder="Enter email address" className="flex-1" />
          <Button>Send Invite</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
