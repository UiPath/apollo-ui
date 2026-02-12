import type { Meta } from '@storybook/react-vite';
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  FileText,
  Clock,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Separator } from './separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

const meta: Meta<typeof Sheet> = {
  title: 'Components/Overlays/Drawer (Sheet)',
  component: Sheet,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a basic sheet component. It slides in from the side of the screen.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <p className="text-sm text-muted-foreground">
            Sheet content goes here. Use sheets for supplementary content that doesn't require a full page.
          </p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// ============================================================================
// Right Side
// ============================================================================

export const RightSide = {
  name: 'Right Side',
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Right Sheet</SheetTitle>
          <SheetDescription>
            Slides in from the right edge of the screen. This is the standard position for detail panels, forms, and supplementary content.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

// ============================================================================
// Examples — With Form
// ============================================================================

export const WithForm = {
  name: 'With Form',
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Update your personal information. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="form-name">Full Name</Label>
            <Input id="form-name" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-email">Email</Label>
            <Input id="form-email" type="email" defaultValue="john@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-username">Username</Label>
            <Input id="form-username" defaultValue="@johndoe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-bio">Bio</Label>
            <Input id="form-bio" placeholder="Tell us about yourself" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// ============================================================================
// Examples — With Information
// ============================================================================

export const WithInformation = {
  name: 'With Information',
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">View Details</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Order #ORD-2024-1847</SheetTitle>
          <SheetDescription>
            Placed on February 10, 2026
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              In Transit
            </span>
            <span className="text-xs text-muted-foreground">Est. delivery: Feb 15, 2026</span>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Items</h4>
            {[
              { name: 'Wireless Keyboard', qty: 1, price: '$79.99' },
              { name: 'USB-C Hub (7-port)', qty: 2, price: '$45.00' },
              { name: 'Monitor Stand', qty: 1, price: '$34.99' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div>
                  <span>{item.name}</span>
                  <span className="ml-2 text-muted-foreground">x{item.qty}</span>
                </div>
                <span className="tabular-nums">{item.price}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">$204.98</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="tabular-nums">$9.99</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">$17.42</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="tabular-nums">$232.39</span>
            </div>
          </div>

          <Separator />

          {/* Shipping */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Shipping Address</h4>
            <p className="text-sm text-muted-foreground">
              John Doe<br />
              123 Main Street, Apt 4B<br />
              New York, NY 10001
            </p>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Track Order
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// ============================================================================
// Examples — Settings Panel
// ============================================================================

export const SettingsPanel = {
  name: 'Settings Panel',
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your account preferences.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          {[
            { icon: <User className="h-4 w-4" />, label: 'Profile', desc: 'Name, email, avatar' },
            { icon: <Bell className="h-4 w-4" />, label: 'Notifications', desc: 'Email and push preferences' },
            { icon: <Shield className="h-4 w-4" />, label: 'Security', desc: 'Password, 2FA, sessions' },
            { icon: <CreditCard className="h-4 w-4" />, label: 'Billing', desc: 'Plans, invoices, payment' },
            { icon: <Tag className="h-4 w-4" />, label: 'Tags & Labels', desc: 'Organize your content' },
            { icon: <FileText className="h-4 w-4" />, label: 'API Keys', desc: 'Manage integrations' },
            { icon: <Clock className="h-4 w-4" />, label: 'Activity Log', desc: 'Recent account activity' },
          ].map((item, i) => (
            <button
              type="button"
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm hover:bg-accent transition-colors ${i === 0 ? 'bg-accent' : ''}`}
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

