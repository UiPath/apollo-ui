import { useState } from 'react';
import type { Meta } from '@storybook/react-vite';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Terminal,
  Rocket,
  X,
  ExternalLink,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

const meta: Meta<typeof Alert> = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic Alert
// ============================================================================

export const BasicAlert = {
  name: 'Basic Alert',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>
          This is a default alert — use it for general information.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>
          This is a destructive alert — use it for errors or critical warnings.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Alert with Icons
// ============================================================================

export const AlertWithIcons = {
  name: 'Alert with Icons',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Terminal</AlertTitle>
        <AlertDescription>
          You can add components to your app using the CLI.
        </AlertDescription>
      </Alert>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Your account is currently on the free plan. Upgrade for more features.
        </AlertDescription>
      </Alert>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your storage is almost full. Consider upgrading your plan.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your session has expired. Please log in again.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Dismissible Alert
// ============================================================================

export const DismissibleAlert = {
  name: 'Dismissible Alert',
  render: () => {
    const [alerts, setAlerts] = useState([
      { id: 1, title: 'Tip', description: 'You can dismiss this alert by clicking the X button.' },
      { id: 2, title: 'Reminder', description: 'Your trial expires in 3 days. Upgrade to keep access.' },
      { id: 3, title: 'Notice', description: 'Scheduled maintenance this Saturday from 2–4 AM UTC.' },
    ]);

    const dismiss = (id: number) => setAlerts((prev) => prev.filter((a) => a.id !== id));

    return (
      <div className="flex flex-col gap-4 max-w-xl">
        {alerts.map((alert) => (
          <Alert key={alert.id} className="relative pr-10">
            <Info className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
            <button
              className="absolute right-3 top-3 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:opacity-100"
              onClick={() => dismiss(alert.id)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </Alert>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground">All alerts dismissed.</p>
        )}
      </div>
    );
  },
};

// ============================================================================
// Alert with Actions
// ============================================================================

export const AlertWithActions = {
  name: 'Alert with Actions',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            A new version of the application is available. Update now to get the latest features and bug fixes.
          </p>
          <div className="flex gap-2">
            <Button size="sm">Update Now</Button>
            <Button size="sm" variant="outline">Later</Button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            We were unable to process your payment. Please update your billing information.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive">Update Billing</Button>
            <Button size="sm" variant="outline" className="text-foreground">Contact Support</Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Alert with Links
// ============================================================================

export const AlertWithLinks = {
  name: 'Alert with Links',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>New Documentation</AlertTitle>
        <AlertDescription>
          We've updated our API documentation.{' '}
          <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">
            Read the docs <ExternalLink className="inline h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Getting Started</AlertTitle>
        <AlertDescription>
          New to the platform? Check out our{' '}
          <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">quick start guide</a>
          {' '}or browse the{' '}
          <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">component library</a>.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Usage Examples — Form Validation
// ============================================================================

export const FormValidation = {
  name: 'Form Validation',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>There were 3 errors with your submission</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
            <li>Email address is required</li>
            <li>Password must be at least 8 characters</li>
            <li>Please agree to the terms and conditions</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Form submitted successfully</AlertTitle>
        <AlertDescription>
          Your profile has been updated. Changes may take a few minutes to appear.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Usage Examples — System Status
// ============================================================================

export const SystemStatus = {
  name: 'System Status',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert>
        <Wifi className="h-4 w-4" />
        <AlertTitle>All Systems Operational</AlertTitle>
        <AlertDescription>
          All services are running normally. Last checked 2 minutes ago.
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Degraded Performance</AlertTitle>
        <AlertDescription>
          Some users may experience slower response times. Our team is investigating.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Service Outage</AlertTitle>
        <AlertDescription>
          The API gateway is currently unavailable. We are working to restore service as quickly as possible.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Usage Examples — Feature Announcement
// ============================================================================

export const FeatureAnnouncement = {
  name: 'Feature Announcement',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert>
        <Rocket className="h-4 w-4" />
        <AlertTitle>New: Dark Mode Support</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            We've added dark mode across the entire platform. Your preference syncs automatically across all devices.
          </p>
          <div className="flex gap-2">
            <Button size="sm">Try It Out</Button>
            <Button size="sm" variant="outline">Learn More</Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// ============================================================================
// Usage Examples — Security Notice
// ============================================================================

export const SecurityNotice = {
  name: 'Security Notice',
  render: () => (
    <div className="flex flex-col gap-4 max-w-xl">
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Suspicious Login Detected</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            A login was attempted from an unrecognized device in San Francisco, CA. If this wasn't you, secure your account immediately.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive">Secure Account</Button>
            <Button size="sm" variant="outline" className="text-foreground">That Was Me</Button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Two-Factor Authentication</AlertTitle>
        <AlertDescription>
          Your account does not have two-factor authentication enabled. We strongly recommend enabling it for additional security.{' '}
          <a href="#" className="font-medium underline underline-offset-4 hover:no-underline">
            Enable 2FA
          </a>
        </AlertDescription>
      </Alert>
    </div>
  ),
};
