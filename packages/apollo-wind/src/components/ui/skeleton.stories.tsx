import type { Meta } from '@storybook/react-vite';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';

const meta = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;

// ============================================================================
// Basic Skeleton
// ============================================================================

export const BasicSkeleton = {
  name: 'Basic Skeleton',
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

// ============================================================================
// Skeleton Shapes
// ============================================================================

export const SkeletonShapes = {
  name: 'Skeleton Shapes',
  render: () => (
    <div className="flex flex-col gap-6 w-[300px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Rectangle (default)</p>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Circle</p>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Square</p>
        <Skeleton className="h-16 w-16" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Pill</p>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Text line</p>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  ),
};

// ============================================================================
// Animated Skeleton
// ============================================================================

export const AnimatedSkeleton = {
  name: 'Animated Skeleton',
  render: () => (
    <div className="flex flex-col gap-6 w-[300px]">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default (pulse animation)</p>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No animation</p>
        <Skeleton className="h-10 w-full animate-none" />
      </div>
    </div>
  ),
};

// ============================================================================
// Card Skeleton
// ============================================================================

export const CardSkeleton = {
  name: 'Card Skeleton',
  render: () => (
    <Card className="w-[350px]">
      <CardHeader className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// List Skeleton
// ============================================================================

export const ListSkeleton = {
  name: 'List Skeleton',
  render: () => (
    <div className="flex flex-col gap-4 w-[350px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Table Skeleton
// ============================================================================

export const TableSkeleton = {
  name: 'Table Skeleton',
  render: () => (
    <div className="w-[600px] rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-4 border-b p-3">
        <Skeleton className="h-3 w-[120px]" />
        <Skeleton className="h-3 w-[160px]" />
        <Skeleton className="h-3 w-[100px]" />
        <Skeleton className="h-3 w-[80px] ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b last:border-0 p-3">
          <Skeleton className="h-3 w-[120px]" />
          <Skeleton className="h-3 w-[160px]" />
          <Skeleton className="h-3 w-[100px]" />
          <Skeleton className="h-3 w-[80px] ml-auto" />
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Usage Examples — Profile Loading
// ============================================================================

export const ProfileLoading = {
  name: 'Profile Loading',
  render: () => (
    <div className="w-[350px] rounded-lg border p-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Usage Examples — Dashboard Loading
// ============================================================================

export const DashboardLoading = {
  name: 'Dashboard Loading',
  render: () => (
    <div className="w-[600px] space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
      {/* Recent activity */}
      <div className="rounded-lg border p-4 space-y-4">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  ),
};

// ============================================================================
// Usage Examples — Table Loading
// ============================================================================

export const TableLoading = {
  name: 'Table Loading',
  render: () => (
    <div className="w-[600px] space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-lg border">
        {/* Header */}
        <div className="flex items-center gap-4 border-b bg-muted/40 p-3">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-3 w-[100px]" />
          <Skeleton className="h-3 w-[140px]" />
          <Skeleton className="h-3 w-[80px]" />
          <Skeleton className="h-3 w-[60px] ml-auto" />
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b last:border-0 p-3">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-3 w-[100px]" />
            <Skeleton className="h-3 w-[140px]" />
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-3 w-[60px] ml-auto" />
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  ),
};
