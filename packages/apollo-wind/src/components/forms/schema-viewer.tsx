import { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FormSchema } from './form-schema';
import { schemaToJson } from './schema-serializer';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SchemaViewerProps {
  schema: FormSchema;
  triggerLabel?: string;
}

/**
 * SchemaViewer - Displays form schema JSON with copy functionality
 *
 * Shows the backing JSON schema in a slide-out sheet panel.
 * Includes syntax highlighting and one-click copy to clipboard.
 */
export function SchemaViewer({ schema, triggerLabel = 'View Schema' }: SchemaViewerProps) {
  const [copied, setCopied] = useState(false);
  const jsonString = schemaToJson(schema);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success('Schema copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy schema');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Code2 className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>Schema JSON</span>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </SheetTitle>
          <SheetDescription>JSON representation of the form schema.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-10rem)] rounded-md border bg-muted/50">
          <pre className="p-2 text-sm font-mono whitespace-pre-wrap break-words">
            <code>{jsonString}</code>
          </pre>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * withSchemaViewer - HOC to wrap a form component with schema viewer
 *
 * Adds a "View Schema" button above the form.
 */
export function withSchemaViewer<P extends { schema: FormSchema }>(
  WrappedComponent: React.ComponentType<P>,
) {
  return function WithSchemaViewer(props: P) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <SchemaViewer schema={props.schema} />
        </div>
        <WrappedComponent {...props} />
      </div>
    );
  };
}

/**
 * FormWithSchemaViewer - Render children with a schema viewer button
 */
interface FormWithSchemaViewerProps {
  schema: FormSchema;
  children: React.ReactNode;
}

export function FormWithSchemaViewer({ schema, children }: FormWithSchemaViewerProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SchemaViewer schema={schema} />
      </div>
      {children}
    </div>
  );
}
