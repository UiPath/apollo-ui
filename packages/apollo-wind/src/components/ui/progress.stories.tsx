import type { Meta } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { HardDrive, Upload, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Feedback/Progress',
  component: Progress,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic Progress
// ============================================================================

export const BasicProgress = {
  name: 'Basic Progress',
  render: () => (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">0%</p>
        <Progress value={0} className="h-1" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">25%</p>
        <Progress value={25} className="h-1" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">50%</p>
        <Progress value={50} className="h-1" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">75%</p>
        <Progress value={75} className="h-1" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">100%</p>
        <Progress value={100} className="h-1" />
      </div>
    </div>
  ),
};

// ============================================================================
// Dynamic Progress
// ============================================================================

export const DynamicProgress = {
  name: 'Dynamic Progress',
  render: () => {
    const [value, setValue] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setValue((prev) => {
          if (prev >= 100) return 0;
          return prev + Math.floor(Math.random() * 10) + 1;
        });
      }, 800);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col gap-3 max-w-md">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Processing…</p>
          <p className="text-sm tabular-nums text-muted-foreground">{Math.min(value, 100)}%</p>
        </div>
        <Progress value={Math.min(value, 100)} className="h-1" />
      </div>
    );
  },
};

// ============================================================================
// Animated Progress
// ============================================================================

export const AnimatedProgress = {
  name: 'Animated Progress',
  render: () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const steps = [13, 35, 56, 78, 100];
      let i = 0;
      const timer = setInterval(() => {
        if (i < steps.length) {
          setProgress(steps[i]);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 600);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className="flex flex-col gap-3 max-w-md">
        <p className="text-sm font-medium">Loading resources…</p>
        <Progress value={progress} className="h-1" />
        <p className="text-xs text-muted-foreground">
          {progress < 100 ? 'Please wait while we load your data.' : 'Complete!'}
        </p>
      </div>
    );
  },
};

// ============================================================================
// Progress with Labels
// ============================================================================

export const ProgressWithLabels = {
  name: 'Progress with Labels',
  render: () => (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Storage</span>
          <span className="text-sm tabular-nums text-muted-foreground">45%</span>
        </div>
        <Progress value={45} className="h-1" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Bandwidth</span>
          <span className="text-sm tabular-nums text-muted-foreground">72%</span>
        </div>
        <Progress value={72} className="h-1" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">CPU Usage</span>
          <span className="text-sm tabular-nums text-muted-foreground">89%</span>
        </div>
        <Progress value={89} className="h-1" />
      </div>
    </div>
  ),
};

// ============================================================================
// Progress Sizes
// ============================================================================

export const ProgressSizes = {
  name: 'Progress Sizes',
  render: () => (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Small (h-1)</p>
        <Progress value={60} className="h-1" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default (h-4)</p>
        <Progress value={60} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Medium (h-2)</p>
        <Progress value={60} className="h-2" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Large (h-6)</p>
        <Progress value={60} className="h-6" />
      </div>
    </div>
  ),
};

// ============================================================================
// Multi-step Progress
// ============================================================================

export const MultiStepProgress = {
  name: 'Multi-step Progress',
  render: () => {
    const steps = ['Upload', 'Process', 'Validate', 'Complete'];
    const currentStep = 2; // 0-indexed, "Validate" is active

    return (
      <div className="flex flex-col gap-4 max-w-md">
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-1" />
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  i <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs ${
                  i <= currentStep ? 'font-medium' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// ============================================================================
// Usage Examples — File Upload
// ============================================================================

export const FileUpload = {
  name: 'File Upload',
  render: () => {
    const files = [
      { name: 'quarterly-report.pdf', size: '2.4 MB', progress: 100 },
      { name: 'user-data-export.csv', size: '8.1 MB', progress: 67 },
      { name: 'presentation-deck.pptx', size: '15.3 MB', progress: 34 },
    ];

    return (
      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Uploading 3 files</p>
        </div>
        {files.map((file) => (
          <div key={file.name} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{file.size}</span>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {file.progress === 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  `${file.progress}%`
                )}
              </span>
            </div>
            <Progress value={file.progress} className="h-1" />
          </div>
        ))}
      </div>
    );
  },
};

// ============================================================================
// Usage Examples — System Health
// ============================================================================

export const SystemHealth = {
  name: 'System Health',
  render: () => {
    const metrics = [
      { label: 'CPU', value: 42, icon: <Activity className="h-4 w-4" /> },
      { label: 'Memory', value: 68, icon: <Loader2 className="h-4 w-4" /> },
      { label: 'Disk I/O', value: 23, icon: <HardDrive className="h-4 w-4" /> },
    ];

    function getColor(value: number) {
      if (value >= 80) return '[&>div]:bg-destructive';
      if (value >= 60) return '[&>div]:bg-yellow-500';
      return '';
    }

    return (
      <div className="flex flex-col gap-5 max-w-sm">
        <p className="text-sm font-medium">System Health</p>
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{metric.icon}</span>
                <span>{metric.label}</span>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">{metric.value}%</span>
            </div>
            <Progress value={metric.value} className={`h-1 ${getColor(metric.value)}`} />
          </div>
        ))}
      </div>
    );
  },
};

// ============================================================================
// Usage Examples — Used Space
// ============================================================================

export const UsedSpace = {
  name: 'Used Space',
  render: () => {
    const used = 73.2;
    const total = 100;

    return (
      <div className="max-w-sm rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Storage</p>
        </div>
        <Progress value={(used / total) * 100} className="h-1 mb-3" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {used} GB of {total} GB used
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {(total - used).toFixed(1)} GB free
          </span>
        </div>
      </div>
    );
  },
};
