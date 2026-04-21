import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib';
import type { Theme } from '@/foundation/Future/types';

// ============================================================================
// Types
// ============================================================================

export type FeedbackType =
  | 'bug-report'
  | 'improvement'
  | 'feature-request'
  | 'documentation'
  | 'accessibility'
  | 'other';

export const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'other', label: 'Other' },
];

export interface FeedbackFormData {
  name: string;
  email: string;
  subject: string;
  type: FeedbackType | '';
  description: string;
}

export interface FeedbackFormProps {
  theme?: Theme;
  onSubmit?: (data: FeedbackFormData) => void;
  onCancel?: () => void;
}

// ============================================================================
// FeedbackForm
// ============================================================================

export function FeedbackForm({ theme = 'future-dark', onSubmit, onCancel }: FeedbackFormProps) {
  const themeClass = theme ?? 'future-dark';

  const [formData, setFormData] = React.useState<FeedbackFormData>({
    name: '',
    email: '',
    subject: '',
    type: '',
    description: '',
  });

  const [submitted, setSubmitted] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<FeedbackFormData>>({});

  const updateField = (field: keyof FeedbackFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<FeedbackFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.type) newErrors.type = 'Please select a type';
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit?.(formData);
    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', subject: '', type: '', description: '' });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div
      className={cn(
        themeClass,
        'flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12'
      )}
    >
      <div className="w-full max-w-lg">
        {submitted ? (
          // ── Success state ──────────────────────────────────────────────────
          <Card className="border-border bg-surface text-foreground">
            <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-success-subtle,theme(colors.green.500/10))]">
                <CheckCircle2 className="h-7 w-7 text-green-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">Feedback received</h2>
                <p className="text-sm text-foreground-muted">
                  Thank you for helping improve Apollo. We review every submission and will follow up
                  if needed.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2 border-border text-foreground-muted hover:border-border-hover hover:bg-surface-hover hover:text-foreground"
                onClick={handleReset}
              >
                Submit another response
              </Button>
            </CardContent>
          </Card>
        ) : (
          // ── Form ──────────────────────────────────────────────────────────
          <Card className="border-border bg-surface text-foreground shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-foreground">
                Share your feedback
              </CardTitle>
              <CardDescription className="text-foreground-muted">
                Help us improve Apollo for everyone. Tell us what's working and what could be
                better.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fb-name" className="text-foreground">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="fb-name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={cn(
                      'border-border bg-surface-overlay text-foreground placeholder:text-foreground-subtle',
                      errors.name && 'border-red-400 focus-visible:ring-red-400/30'
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fb-email" className="text-foreground">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="fb-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={cn(
                      'border-border bg-surface-overlay text-foreground placeholder:text-foreground-subtle',
                      errors.email && 'border-red-400 focus-visible:ring-red-400/30'
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fb-subject" className="text-foreground">
                    Subject <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="fb-subject"
                    placeholder="e.g. Button accessibility, Token naming, Missing component..."
                    value={formData.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                    className={cn(
                      'border-border bg-surface-overlay text-foreground placeholder:text-foreground-subtle',
                      errors.subject && 'border-red-400 focus-visible:ring-red-400/30'
                    )}
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-400">{errors.subject}</p>
                  )}
                </div>

                {/* Product Type */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fb-type" className="text-foreground">
                    Product Type <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => updateField('type', value)}
                  >
                    <SelectTrigger
                      id="fb-type"
                      className={cn(
                        'border-border bg-surface-overlay text-foreground',
                        errors.type && 'border-red-400 focus:ring-red-400/30'
                      )}
                    >
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent className={cn(themeClass, 'border-border bg-surface-overlay text-foreground')}>
                      {FEEDBACK_TYPES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-xs text-red-400">{errors.type}</p>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fb-description" className="text-foreground">
                    Description <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="fb-description"
                    placeholder="Describe your feedback in detail. Include steps to reproduce issues, expected vs actual behaviour, or feature suggestions..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={cn(
                      'resize-none border-border bg-surface-overlay text-foreground placeholder:text-foreground-subtle',
                      errors.description && 'border-red-400 focus-visible:ring-red-400/30'
                    )}
                  />
                  {errors.description ? (
                    <p className="text-xs text-red-400">{errors.description}</p>
                  ) : (
                    <p className="text-xs text-foreground-subtle">
                      {formData.description.length} characters
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                    onClick={onCancel ?? handleReset}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-brand text-foreground-on-accent hover:bg-brand/90"
                  >
                    Submit feedback
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
