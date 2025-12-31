import { useState } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle, FileEdit, Eye, Database } from 'lucide-react';

/**
 * FormStateViewer Component
 *
 * Displays React Hook Form state in a user-friendly way
 * Shows values, errors, dirty fields, and form metadata
 */

interface FormStateViewerProps {
  form: UseFormReturn<FieldValues>;
  title?: string;
  className?: string;
  compact?: boolean;
}

export function FormStateViewer({
  form,
  title = 'Form State',
  className = '',
  compact = false,
}: FormStateViewerProps) {
  const [activeTab, setActiveTab] = useState('values');
  const { formState, watch } = form;
  const values = watch();

  const stats = {
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    isValidating: formState.isValidating,
    submitCount: formState.submitCount,
    errorCount: Object.keys(formState.errors).length,
    dirtyFieldsCount: Object.keys(formState.dirtyFields).length,
    touchedFieldsCount: Object.keys(formState.touchedFields).length,
  };

  if (compact) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{title}</h3>
            <div className="flex gap-2">
              {stats.isValid ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Invalid
                </Badge>
              )}
              {stats.isDirty && (
                <Badge variant="secondary">
                  <FileEdit className="w-3 h-3 mr-1" />
                  Dirty
                </Badge>
              )}
            </div>
          </div>

          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(values, null, 2)}
          </pre>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex gap-2">
            {stats.isValid ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.errorCount} Error{stats.errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {stats.isDirty && (
              <Badge variant="secondary">
                <FileEdit className="w-3 h-3 mr-1" />
                {stats.dirtyFieldsCount} Changed
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold text-lg">{stats.submitCount}</div>
            <div className="text-muted-foreground">Submits</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold text-lg">{stats.errorCount}</div>
            <div className="text-muted-foreground">Errors</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold text-lg">{stats.dirtyFieldsCount}</div>
            <div className="text-muted-foreground">Dirty</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-semibold text-lg">{stats.touchedFieldsCount}</div>
            <div className="text-muted-foreground">Touched</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="values" className="gap-2">
            <Database className="w-4 h-4" />
            Values
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Errors
            {stats.errorCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5">
                {stats.errorCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="state" className="gap-2">
            <Eye className="w-4 h-4" />
            State
          </TabsTrigger>
          <TabsTrigger value="fields" className="gap-2">
            <FileEdit className="w-4 h-4" />
            Fields
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px]">
          <TabsContent value="values" className="p-4 m-0">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Current form values (updates in real-time)
              </p>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="p-4 m-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Validation errors from Zod schema
              </p>
              {Object.keys(formState.errors).length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/10 rounded text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">No validation errors</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(formState.errors).map(([field, error]) => (
                    <div
                      key={field}
                      className="p-3 bg-destructive/10 rounded border border-destructive/20"
                    >
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <div className="font-mono text-sm font-semibold">{field}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {(error as { message?: string })?.message || 'Invalid value'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="state" className="p-4 m-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">React Hook Form internal state</p>
              <div className="space-y-2">
                <StateItem label="Is Valid" value={stats.isValid} />
                <StateItem label="Is Dirty" value={stats.isDirty} />
                <StateItem label="Is Submitting" value={stats.isSubmitting} />
                <StateItem label="Is Validating" value={stats.isValidating} />
                <StateItem label="Is Submitted" value={formState.isSubmitted} />
                <StateItem label="Is Submit Successful" value={formState.isSubmitSuccessful} />
                <StateItem label="Submit Count" value={stats.submitCount} type="number" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fields" className="p-4 m-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">Field-level state tracking</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileEdit className="w-4 h-4" />
                    Dirty Fields ({stats.dirtyFieldsCount})
                  </h4>
                  {Object.keys(formState.dirtyFields).length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-2 bg-muted rounded">
                      No fields modified yet
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(formState.dirtyFields).map((field) => (
                        <Badge key={field} variant="secondary">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Touched Fields ({stats.touchedFieldsCount})
                  </h4>
                  {Object.keys(formState.touchedFields).length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-2 bg-muted rounded">
                      No fields touched yet
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(formState.touchedFields).map((field) => (
                        <Badge key={field} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}

function StateItem({
  label,
  value,
  type = 'boolean',
}: {
  label: string;
  value: boolean | number;
  type?: 'boolean' | 'number';
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded">
      <span className="text-sm font-medium">{label}</span>
      {type === 'boolean' ? (
        value ? (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            True
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            False
          </Badge>
        )
      ) : (
        <Badge variant="outline">{value}</Badge>
      )}
    </div>
  );
}
