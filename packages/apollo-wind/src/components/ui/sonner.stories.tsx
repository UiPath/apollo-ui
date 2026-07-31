import type { Meta } from '@storybook/react-vite';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toaster as SonnerToaster } from 'sonner';
import apolloWindCss from '@/styles/tailwind.css?inline';
import { Button } from './button';
import { toast, Toaster } from './sonner';

const meta: Meta<typeof Toaster> = {
  title: 'Components/Feedback/Toast (Sonner)',
  component: Toaster,
  tags: ['autodocs'],
};

export default meta;

const SHADOW_TOASTER_ID = 'apollo-wind-sonner-shadow-story';
const DARK_THEMES = new Set(['dark', 'dark-hc', 'future-dark']);

function ShadowDomToastDemo({ theme }: { theme: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setShadowRoot(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
  }, []);

  const options = { toasterId: SHADOW_TOASTER_ID };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toast controls and the toaster below are rendered inside an open Shadow Root.
      </p>
      <div ref={hostRef} className="min-h-48 rounded-lg border" />
      {shadowRoot &&
        createPortal(
          <>
            <style>{apolloWindCss}</style>
            <div className={`${theme} min-h-48 p-4`}>
              <Toaster
                id={SHADOW_TOASTER_ID}
                theme={DARK_THEMES.has(theme) ? 'dark' : 'light'}
                position="top-right"
                closeButton
                richColors
                visibleToasts={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => toast.success('Saved', options)}>
                  Success
                </Button>
                <Button size="sm" onClick={() => toast.info('Information', options)}>
                  Info
                </Button>
                <Button size="sm" onClick={() => toast.warning('Warning', options)}>
                  Warning
                </Button>
                <Button size="sm" onClick={() => toast.error('Failed', options)}>
                  Error
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    for (let index = 1; index <= 5; index += 1) {
                      toast.error(`Burst ${index}`, options);
                    }
                  }}
                >
                  Burst 5
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    toast.warning('Persistent', {
                      ...options,
                      duration: Number.POSITIVE_INFINITY,
                    })
                  }
                >
                  Persistent
                </Button>
              </div>
            </div>
          </>,
          shadowRoot
        )}
    </div>
  );
}

// ============================================================================
// Basic Toast Types
// ============================================================================

export const BasicToastTypes = {
  name: 'Basic Toast Types',
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('Event has been created', {
              description: 'Sunday, December 03, 2023 at 9:00 AM',
            })
          }
        >
          Default
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Changes saved successfully')}
        >
          Success
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.error('Something went wrong')}>
          Error
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.warning('Your session is about to expire')}
        >
          Warning
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('A new version is available')}
        >
          Info
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.loading('Loading data…')}>
          Loading
        </Button>
      </div>
    </>
  ),
};

// ============================================================================
// Action Toast
// ============================================================================

export const ActionToast = {
  name: 'Action Toast',
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('File deleted', {
              description: 'report-q4.pdf has been moved to trash.',
              action: {
                label: 'Undo',
                onClick: () => toast.success('File restored'),
              },
            })
          }
        >
          With Undo Action
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.error('Upload failed', {
              description: 'The file could not be uploaded.',
              action: {
                label: 'Retry',
                onClick: () => toast.loading('Retrying upload…'),
              },
            })
          }
        >
          With Retry Action
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('New update available', {
              description: 'Version 2.4.0 is ready to install.',
              action: {
                label: 'Update',
                onClick: () => toast.success('Updating…'),
              },
              cancel: {
                label: 'Dismiss',
                onClick: () => {},
              },
            })
          }
        >
          With Action & Cancel
        </Button>
      </div>
    </>
  ),
};

// ============================================================================
// Promise Toast
// ============================================================================

export const PromiseToast = {
  name: 'Promise Toast',
  render: () => {
    function simulateSuccess() {
      return new Promise((resolve) => setTimeout(resolve, 2000));
    }

    function simulateFailure() {
      return new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 2000));
    }

    return (
      <>
        <Toaster />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.promise(simulateSuccess(), {
                loading: 'Saving changes…',
                success: 'Changes saved successfully!',
                error: 'Failed to save changes.',
              })
            }
          >
            Promise (Success)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.promise(simulateFailure(), {
                loading: 'Uploading file…',
                success: 'File uploaded!',
                error: 'Upload failed. Please try again.',
              })
            }
          >
            Promise (Failure)
          </Button>
        </div>
      </>
    );
  },
};

// ============================================================================
// Rich Content Toast
// ============================================================================

export const RichContentToast = {
  name: 'Rich Content Toast',
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('Deployment Complete', {
              description: (
                <div className="mt-1 space-y-1 text-xs">
                  <p>
                    Environment: <span className="font-medium">Production</span>
                  </p>
                  <p>
                    Version: <span className="font-medium">v2.4.0</span>
                  </p>
                  <p>
                    Duration: <span className="font-medium">1m 23s</span>
                  </p>
                </div>
              ),
            })
          }
        >
          Rich Description
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success('Team member added', {
              description: 'jane.doe@company.com has been invited to the project.',
            })
          }
        >
          With Long Description
        </Button>
      </div>
    </>
  ),
};

// ============================================================================
// Multiple Toasts
// ============================================================================

export const MultipleToasts = {
  name: 'Multiple Toasts',
  render: () => {
    function fireAll() {
      toast.success('File uploaded');
      setTimeout(() => toast.info('Processing started'), 300);
      setTimeout(() => toast.warning('Large file detected'), 600);
      setTimeout(() => toast('Estimated time: 2 minutes'), 900);
    }

    return (
      <>
        <Toaster />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fireAll}>
            Fire Multiple Toasts
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss()}>
            Dismiss All
          </Button>
        </div>
      </>
    );
  },
};

// ============================================================================
// Toast Positioning
// ============================================================================

export const ToastPositioning = {
  name: 'Toast Positioning',
  render: () => (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="space-y-2">
        <p className="text-sm font-medium">Bottom Right</p>
        <p className="text-xs text-muted-foreground">
          Used for background notifications, system events, and non-critical feedback.
        </p>
        <SonnerToaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            },
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast('Background sync complete', { position: 'bottom-right' })}
        >
          Bottom Right Toast
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Top Center</p>
        <p className="text-xs text-muted-foreground">
          Used for important confirmations, form submissions, and user-initiated actions that need
          prominent visibility.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Profile updated', { position: 'top-center' })}
        >
          Top Center Toast
        </Button>
      </div>
    </div>
  ),
};

// ============================================================================
// Toast Duration
// ============================================================================

export const ToastDuration = {
  name: 'Toast Duration',
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast('Quick notification', { duration: 2000 })}
        >
          Short (2s)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast('Standard notification', { duration: 4000 })}
        >
          Default (4s)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('This toast stays longer for important messages', { duration: 8000 })
          }
        >
          Long (8s)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('This toast will not auto-dismiss', {
              duration: Number.POSITIVE_INFINITY,
              action: { label: 'Dismiss', onClick: () => {} },
            })
          }
        >
          Persistent
        </Button>
      </div>
    </>
  ),
};

// ============================================================================
// Usage Examples — Form Submissions
// ============================================================================

export const FormSubmissions = {
  name: 'Form Submissions',
  render: () => {
    function simulateSave() {
      return new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return (
      <>
        <Toaster />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.promise(simulateSave(), {
                loading: 'Saving profile…',
                success: 'Profile updated successfully!',
                error: 'Failed to update profile.',
              })
            }
          >
            Save Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success('Settings saved', {
                description: 'Your notification preferences have been updated.',
              })
            }
          >
            Save Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.error('Validation failed', {
                description: 'Please fix the errors in the form before submitting.',
              })
            }
          >
            Validation Error
          </Button>
        </div>
      </>
    );
  },
};

// ============================================================================
// Usage Examples — File Operations
// ============================================================================

export const FileOperations = {
  name: 'File Operations',
  render: () => {
    function simulateUpload() {
      return new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return (
      <>
        <Toaster />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.promise(simulateUpload(), {
                loading: 'Uploading report.pdf…',
                success: 'File uploaded successfully!',
                error: 'Upload failed. Check your connection.',
              })
            }
          >
            Upload File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('File moved to trash', {
                description: 'quarterly-report.pdf',
                action: {
                  label: 'Undo',
                  onClick: () => toast.success('File restored'),
                },
              })
            }
          >
            Delete File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success('Export complete', {
                description: 'data-export.csv has been downloaded.',
              })
            }
          >
            Export Data
          </Button>
        </div>
      </>
    );
  },
};

// ============================================================================
// Usage Examples — User Actions
// ============================================================================

export const UserActions = {
  name: 'User Actions',
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success('Invitation sent', {
              description: 'An invite has been sent to jane@company.com.',
            })
          }
        >
          Invite Member
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast('Link copied to clipboard', { duration: 2000 })}
        >
          Copy Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.warning('Are you sure?', {
              description: 'This action cannot be undone.',
              action: {
                label: 'Confirm',
                onClick: () => toast.success('Item permanently deleted'),
              },
              cancel: {
                label: 'Cancel',
                onClick: () => {},
              },
              duration: Number.POSITIVE_INFINITY,
            })
          }
        >
          Destructive Action
        </Button>
      </div>
    </>
  ),
};

// ============================================================================
// Shadow DOM
// ============================================================================

export const ShadowDom = {
  name: 'Shadow DOM',
  render: (_args: unknown, { globals }: { globals: { theme?: string } }) => (
    <ShadowDomToastDemo theme={globals.theme ?? 'future-dark'} />
  ),
};
