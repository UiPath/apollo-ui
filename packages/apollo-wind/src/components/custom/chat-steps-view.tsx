import {
  ArrowLeft,
  Bot,
  Calendar,
  ChevronDown,
  Folder,
  List,
  Pause,
  Pencil,
  Repeat2,
} from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface FlowStep {
  id: string;
  title: string;
  stepRange: string;
  description: string;
  /** Optional loop annotation */
  loop?: string;
}

export interface StepsViewProps {
  className?: string;
  /** Flow name displayed in the header */
  flowName?: string;
  /** Flow description */
  flowDescription?: string;
  /** Status badge label */
  status?: string;
  /** Last run date/time */
  lastRun?: string;
  /** Total runs count */
  totalRuns?: number;
  /** Steps to display */
  steps?: FlowStep[];
  /** Currently active tab */
  activeTab?: 'steps' | 'history' | 'resources';
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Callback when Edit is clicked */
  onEdit?: () => void;
  /** Callback when Pause is clicked */
  onPause?: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

/** Vertical divider for the header */
function HeaderDivider() {
  return <div className="h-9 w-px bg-border-subtle" />;
}

/** Status badge (e.g. ACTIVE) */
function StatusBadge({ label }: { label: string }) {
  return (
    <div className="flex h-10 items-center rounded-xl bg-brand-subtle px-4 py-2">
      <span className="text-sm font-bold leading-5 text-foreground-accent-muted">
        {label}
      </span>
    </div>
  );
}

/** Stat display with value and label */
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[15px] font-semibold leading-5 text-foreground">{value}</span>
      <span className="text-sm font-medium leading-5 text-foreground-subtle">{label}</span>
    </div>
  );
}

/** Outlined action button */
function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium leading-5 text-foreground-subtle transition-colors hover:border-border-hover hover:text-foreground-hover"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

/** Tab bar with Steps / History / Resources */
function TabBar({ activeTab }: { activeTab: 'steps' | 'history' | 'resources' }) {
  const tabs = [
    { id: 'steps' as const, label: 'Steps', icon: <List className="h-4 w-4" /> },
    { id: 'history' as const, label: 'History', icon: <Calendar className="h-4 w-4" /> },
    { id: 'resources' as const, label: 'Resources', icon: <Folder className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-10 items-center rounded-xl bg-surface-overlay p-1">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'flex h-8 items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium leading-5 transition-colors',
            activeTab === tab.id
              ? 'border border-border-subtle bg-surface text-foreground'
              : 'text-foreground-subtle hover:text-foreground-hover'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

/** A single step card */
function StepCard({ step, isHovered }: { step: FlowStep; isHovered?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-16 items-center justify-between rounded-2xl border px-4',
        isHovered
          ? 'border-border-subtle bg-surface-overlay shadow-[0px_4px_24px_0px_rgba(0,0,0,0.25)]'
          : 'border-border-subtle'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Bot icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover">
          <Bot className="h-5 w-5 text-foreground" />
        </div>

        {/* Step info */}
        <div className="flex flex-col">
          <div className="flex items-start gap-0.5">
            <span className="text-sm font-semibold leading-5 tracking-[-0.35px] text-foreground">
              {step.title}
            </span>
            <span className="ms-1 text-xs leading-5 tracking-[-0.3px] text-foreground-subtle">
              &bull; {step.stepRange}
            </span>
          </div>
          {step.loop ? (
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-[10px] bg-surface-muted">
                <Repeat2 className="h-3.5 w-3.5 text-foreground-on-accent" />
              </div>
              <span className="text-sm leading-5 text-foreground-subtle">
                <span className="font-semibold">Loop</span>: {step.loop}
              </span>
            </div>
          ) : (
            <span className="text-sm leading-5 tracking-[-0.35px] text-foreground-subtle">
              {step.description}
            </span>
          )}
        </div>
      </div>

      <ChevronDown className="h-4 w-4 shrink-0 text-foreground-subtle" />
    </div>
  );
}

// ============================================================================
// StepsView
// ============================================================================

/**
 * Canvas content for the Delegate Steps page.
 *
 * Shows a flow header with metadata, a tabbed content area,
 * and a vertical list of step cards.
 */
export function StepsView({
  className,
  flowName = 'Flow name',
  flowDescription = 'Lorem ipsum dolor sit amet lorem ipsum.',
  status = 'ACTIVE',
  lastRun = '25/11/2025   12:15PM',
  totalRuns = 32,
  steps = [
    {
      id: '1',
      title: 'Gmail',
      stepRange: 'Steps 1 - 2',
      description: 'Evaluate temperature conditions and proceed',
    },
    {
      id: '2',
      title: 'Salesforce',
      stepRange: 'Steps 3 - 5',
      description: 'Evaluate temperature conditions and proceed',
    },
    {
      id: '3',
      title: 'Excel - Process vendor from each file',
      stepRange: 'Steps 6 - 12',
      description: 'Evaluate temperature conditions and proceed',
      loop: 'For each row in the "vendor list", starting from the second row.',
    },
    {
      id: '4',
      title: 'Gmail',
      stepRange: 'Steps 1 - 2',
      description: 'Evaluate temperature conditions and proceed',
    },
  ],
  activeTab = 'steps',
  onBack,
  onEdit,
  onPause,
}: StepsViewProps) {
  return (
    <div className={cn('flex flex-1 flex-col p-0', className)}>
      {/* Flow header */}
      <div className="flex min-h-[78px] shrink-0 items-center gap-8 overflow-x-auto px-10 py-5">
        {/* Back + Title */}
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            className="shrink-0 text-foreground transition-colors hover:text-foreground"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col gap-1">
            <span className="whitespace-nowrap text-xl font-semibold leading-5 text-foreground">
              {flowName}
            </span>
            <span className="whitespace-nowrap text-sm font-medium leading-5 text-foreground-subtle">
              {flowDescription}
            </span>
          </div>
        </div>

        <HeaderDivider />
        <StatusBadge label={status} />

        <div className="flex shrink-0 items-center gap-4">
          <HeaderDivider />
          <StatItem value={lastRun} label="Last run" />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <HeaderDivider />
          <StatItem value={String(totalRuns)} label="Total runs" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <ActionButton icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={onEdit} />
          <ActionButton icon={<Pause className="h-4 w-4" />} label="Pause" onClick={onPause} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col rounded-t-2xl border border-border-muted bg-surface p-4">
        {/* Tab bar */}
        <TabBar activeTab={activeTab} />

        {/* Steps list */}
        <div className="mx-auto mt-20 flex w-full max-w-[680px] flex-col gap-6">
          {steps.map((step, index) => (
            <StepCard key={step.id} step={step} isHovered={index === steps.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
