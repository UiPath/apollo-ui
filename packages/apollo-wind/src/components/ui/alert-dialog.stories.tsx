import { useState } from 'react';
import type { Meta } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { buttonVariants } from './button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';

const meta: Meta<typeof AlertDialog> = {
  title: 'Components/Overlays/Alert Dialog',
  component: AlertDialog,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will apply the changes to your account settings. You can update them again at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// ============================================================================
// Delete (Destructive)
// ============================================================================

export const Destructive = {
  name: 'Delete (Destructive)',
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account, all your projects, and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: 'destructive' })}>
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// ============================================================================
// Sizes
// ============================================================================

export const Sizes = {
  name: 'Sizes',
  render: () => (
    <div className="flex flex-wrap gap-3">
      {/* Small */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Small Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Default */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Default Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update the project settings. This will affect all team members currently working on this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Large */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Large Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Review and confirm</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to publish this workflow to production. Please review the following details before confirming. This action will deploy the latest version and may affect active users. Ensure all tests have passed and the staging environment has been verified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction>Publish to Production</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => (
    <div className="flex flex-wrap gap-3">
      {/* Unsaved changes */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Unsaved Changes</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, your changes will be lost. Do you want to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction>Leave Without Saving</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove team member */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Remove Member</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Jane Doe will lose access to all projects and resources in this workspace. You can invite them back at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sign out */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Sign Out</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to defaults */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Reset Settings</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to default settings?</AlertDialogTitle>
            <AlertDialogDescription>
              All your custom preferences, themes, and notification settings will be restored to their default values. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Settings</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })}>
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
};

// ============================================================================
// Examples — Data Grid Delete
// ============================================================================

const initialRows = [
  { id: '1', name: 'Q4 Revenue Report', type: 'Document', modified: 'Feb 10, 2026' },
  { id: '2', name: 'Marketing Assets', type: 'Folder', modified: 'Feb 8, 2026' },
  { id: '3', name: 'User Research Notes', type: 'Document', modified: 'Feb 5, 2026' },
  { id: '4', name: 'Brand Guidelines v2', type: 'Document', modified: 'Jan 28, 2026' },
  { id: '5', name: 'Sprint Retrospective', type: 'Spreadsheet', modified: 'Jan 22, 2026' },
];

export const DataGridDelete = {
  name: 'Data Grid Delete',
  render: () => {
    const [rows, setRows] = useState(initialRows);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [dialogOpen, setDialogOpen] = useState(false);

    const allSelected = rows.length > 0 && selected.size === rows.length;

    function toggleAll() {
      if (allSelected) {
        setSelected(new Set());
      } else {
        setSelected(new Set(rows.map((r) => r.id)));
      }
    }

    function toggleRow(id: string) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    function handleDelete() {
      setRows((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
      setDialogOpen(false);
    }

    return (
      <div className="w-[600px] space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} of ${rows.length} selected`
              : `${rows.length} items`}
          </p>
          {selected.size > 0 && (
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selected.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selected.size} {selected.size === 1 ? 'item' : 'items'}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {selected.size === 1
                      ? 'This item will be permanently deleted. This action cannot be undone.'
                      : `These ${selected.size} items will be permanently deleted. This action cannot be undone.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: 'destructive' })}
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Data grid */}
        <div className="rounded-lg border">
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="w-[200px]">Name</span>
            <span className="w-[100px]">Type</span>
            <span className="ml-auto w-[120px] text-right">Modified</span>
          </div>
          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.id}
              className={`flex items-center gap-3 border-b last:border-0 px-3 py-2.5 text-sm transition-colors ${
                selected.has(row.id) ? 'bg-muted/30' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggleRow(row.id)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="w-[200px] font-medium truncate">{row.name}</span>
              <span className="w-[100px] text-muted-foreground">{row.type}</span>
              <span className="ml-auto w-[120px] text-right text-muted-foreground">{row.modified}</span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No items remaining.
            </div>
          )}
        </div>
      </div>
    );
  },
};
