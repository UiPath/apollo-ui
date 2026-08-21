import type { Meta } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from './button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

const meta: Meta<typeof Drawer> = {
  title: 'Components/Overlays/Drawer (Bottom)',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A bottom drawer built on vaul. It slides up from the bottom edge and supports ' +
          'drag-to-dismiss via the handle. For side panels, see the Drawer (Sheet) component instead.',
      },
    },
  },
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Move Goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <p className="text-sm text-muted-foreground">
              Drag the handle down or press Escape to dismiss the drawer.
            </p>
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};

// ============================================================================
// Destructive Confirmation
// ============================================================================

export const DestructiveConfirmation = {
  name: 'Destructive Confirmation',
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>
              This action cannot be undone. This will permanently delete your account and remove
              your data from our servers.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="destructive">Yes, delete account</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};

// ============================================================================
// Controlled
// ============================================================================

function ControlledDrawerExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open from outside
        </Button>
        <span className="text-sm text-muted-foreground">State: {open ? 'open' : 'closed'}</span>
      </div>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Controlled Drawer</DrawerTitle>
              <DrawerDescription>
                The open state lives in the parent component and is passed via the open and
                onOpenChange props.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export const Controlled = {
  name: 'Controlled',
  render: () => <ControlledDrawerExample />,
};
