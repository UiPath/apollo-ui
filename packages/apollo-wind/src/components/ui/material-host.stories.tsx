import type { Meta } from '@storybook/react-vite';
import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
import { Alert, AlertDescription, AlertTitle } from './alert';
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
import { FormField, FormFieldDescription, FormFieldHeader } from './form-field';
import { Input } from './input';
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

// Subset of the Angular Material prebuilt typography, unlayered like the real host injection.
const MATERIAL_TYPOGRAPHY_CSS = `
.mat-typography { font: 400 14px/20px Roboto, sans-serif; letter-spacing: 0.0178571429em; }
.mat-typography h2 { font: 500 20px/32px Roboto, sans-serif; letter-spacing: 0.0125em; margin: 0 0 16px; }
.mat-typography h3 { font: 400 16px/28px Roboto, sans-serif; letter-spacing: 0.009375em; margin: 0 0 16px; }
.mat-typography h4 { font: 400 16px/24px Roboto, sans-serif; letter-spacing: 0.03125em; margin: 0 0 16px; }
.mat-typography h5 { font: 400 11.62px/20px Roboto, sans-serif; margin: 0 0 12px; }
.mat-typography p { margin: 0 0 12px; }
`;

function MaterialHost({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = MATERIAL_TYPOGRAPHY_CSS;
    document.head.appendChild(style);
    document.body.classList.add('mat-typography');
    return () => {
      style.remove();
      document.body.classList.remove('mat-typography');
    };
  }, []);
  return <>{children}</>;
}

const meta = {
  title: 'Components/Overlays/Angular Material Host',
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MaterialHost>
        <Story />
      </MaterialHost>
    ),
  ],
} satisfies Meta;

export default meta;

function ExportDetails() {
  return (
    <div className="grid gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <span>Dataset</span>
        <span>golden-set-2026-09</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Rows</span>
        <span>12,480</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Format</span>
        <span>JSONL, gzip</span>
      </div>
    </div>
  );
}

function ExportForm() {
  return (
    <div className="grid gap-4">
      <Alert variant="info">
        <AlertTitle>Large export</AlertTitle>
        <AlertDescription>Exports above 10,000 rows run in the background.</AlertDescription>
      </Alert>
      <FormField>
        <FormFieldHeader label="File name" htmlFor="export-file-name" />
        <Input id="export-file-name" defaultValue="golden-set-2026-09" />
        <FormFieldDescription>Letters, digits and dashes.</FormFieldDescription>
      </FormField>
      <ExportDetails />
    </div>
  );
}

function AngularMaterialHostStory() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export dataset</DialogTitle>
              <DialogDescription>
                Choose a format. Large exports run in the background.
              </DialogDescription>
            </DialogHeader>
            <ExportForm />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Export</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open takeover modal</Button>
          </DialogTrigger>
          <DialogContent variant="takeover" headerTitle="Export dataset">
            <div className="max-w-md p-6">
              <ExportForm />
            </div>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>Export dataset</SheetTitle>
              <SheetDescription>
                Choose a format. Large exports run in the background.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 py-6">
              <ExportForm />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button>Export</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Open alert dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete dataset?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes golden-set-2026-09 and its 12,480 rows. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>Export dataset</DrawerTitle>
                <DrawerDescription>
                  Choose a format. Large exports run in the background.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4">
                <ExportDetails />
              </div>
              <DrawerFooter>
                <Button>Export</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <Accordion type="single" collapsible className="max-w-md">
        <AccordionItem value="format">
          <AccordionTrigger>Export format</AccordionTrigger>
          <AccordionContent>JSONL, gzip compressed. One record per line.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="schedule">
          <AccordionTrigger>Schedule</AccordionTrigger>
          <AccordionContent>Runs in the background and notifies you when done.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export const AllShieldedComponents = {
  name: 'Modal, Takeover, Sheet, Alert Dialog, Drawer, Accordion',
  render: () => <AngularMaterialHostStory />,
};
