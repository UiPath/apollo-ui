import { ColumnDef } from '@tanstack/react-table';
import {
  Blocks,
  Bot,
  FolderKanban,
  GitBranch,
  LayoutGrid,
  List,
  MoreHorizontal,
} from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Row, Column, Grid } from '@/components/ui/layout';
import { cn } from '@/lib';

export interface ProcessOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  onClick?: () => void;
}

export interface RecentProject {
  id: string;
  name: string;
  type: 'flow' | 'bpmn' | 'case' | 'autopilot';
  lastModified: string;
  status?: 'draft' | 'published' | 'archived';
}

export type ViewMode = 'cards' | 'table';

export interface FlowStartExampleProps {
  className?: string;
  title?: string;
  subtitle?: string;
  processOptions?: ProcessOption[];
  recentProjects?: RecentProject[];
  showSkeleton?: boolean;
  defaultViewMode?: ViewMode;
  onOptionSelect?: (optionId: string) => void;
  onProjectSelect?: (projectId: string) => void;
}

function ProcessOptionCard({
  option,
  isSelected,
  onSelect,
}: {
  option: ProcessOption;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Card
      className={cn(
        'group relative cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md',
        isSelected && 'border-primary ring-2 ring-primary/20',
      )}
      onClick={onSelect}
    >
      {option.badge && (
        <Badge
          variant={option.badgeVariant}
          className="absolute -top-2 right-4 text-[10px] px-2 py-0.5"
        >
          {option.badge}
        </Badge>
      )}
      <CardHeader className="pb-3">
        <Row gap={3} align="center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            {option.icon}
          </div>
        </Row>
      </CardHeader>
      <CardContent className="pt-0">
        <CardTitle className="text-base mb-2">{option.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{option.description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function getTypeIcon(type: RecentProject['type']) {
  switch (type) {
    case 'flow':
      return <GitBranch className="h-4 w-4" />;
    case 'bpmn':
      return <Blocks className="h-4 w-4" />;
    case 'case':
      return <FolderKanban className="h-4 w-4" />;
    case 'autopilot':
      return <Bot className="h-4 w-4" />;
  }
}

function getTypeLabel(type: RecentProject['type']) {
  switch (type) {
    case 'flow':
      return 'Flow';
    case 'bpmn':
      return 'BPMN';
    case 'case':
      return 'Case Management';
    case 'autopilot':
      return 'Autopilot';
  }
}

function getStatusVariant(status: RecentProject['status']) {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'outline';
    default:
      return 'secondary';
  }
}

function RecentProjectCard({
  project,
  onSelect,
}: {
  project: RecentProject;
  onSelect?: () => void;
}) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-sm"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <Row gap={3} align="start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {getTypeIcon(project.type)}
          </div>
          <Column gap={1} flex={1} className="min-w-0">
            <Row justify="between" align="center" gap={2}>
              <span className="truncate font-medium text-sm">{project.name}</span>
              {project.status && (
                <Badge variant={getStatusVariant(project.status)} className="shrink-0 text-[10px]">
                  {project.status}
                </Badge>
              )}
            </Row>
            <span className="text-xs text-muted-foreground">{project.lastModified}</span>
          </Column>
        </Row>
      </CardContent>
    </Card>
  );
}

function SkeletonSection() {
  return (
    <Column gap={4}>
      <Skeleton className="h-5 w-32" />
      <Column gap={3}>
        <Row gap={2}>
          <Skeleton className="h-4 flex-1 max-w-[280px]" />
        </Row>
        <Row gap={2}>
          <Skeleton className="h-4 flex-1 max-w-[240px]" />
        </Row>
        <Row gap={2}>
          <Skeleton className="h-4 flex-1 max-w-[320px]" />
        </Row>
        <Row gap={2}>
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
        </Row>
        <Row gap={2}>
          <Skeleton className="h-4 flex-1 max-w-[260px]" />
        </Row>
      </Column>
    </Column>
  );
}

function createProjectColumns(
  onProjectSelect?: (projectId: string) => void,
): ColumnDef<RecentProject, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <Row gap={2} align="center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {getTypeIcon(row.original.type)}
          </div>
          <span className="font-medium">{row.original.name}</span>
        </Row>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{getTypeLabel(row.original.type)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return status ? (
          <Badge variant={getStatusVariant(status)} className="capitalize">
            {status}
          </Badge>
        ) : null;
      },
    },
    {
      accessorKey: 'lastModified',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Modified" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.lastModified}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onProjectSelect?.(row.original.id)}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export function FlowStartExample({
  className,
  title = 'BUILD YOUR FIRST AGENTIC PROCESS',
  subtitle = 'What would you like to start with?',
  processOptions = [],
  recentProjects = [],
  showSkeleton = false,
  defaultViewMode = 'cards',
  onOptionSelect,
  onProjectSelect,
}: FlowStartExampleProps) {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>(defaultViewMode);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    onOptionSelect?.(optionId);
  };

  const columns = React.useMemo(() => createProjectColumns(onProjectSelect), [onProjectSelect]);

  return (
    <Column minH="screen" className={className}>
      {/* Hero Section with background */}
      <div className="bg-muted/40">
        {/* Header */}
        <header className="border-b border-border/50 ">
          <Row justify="between" align="center" className="h-14 px-6">
            <span className="font-semibold text-lg">UiPath Maestro</span>
            <Skeleton className="h-8 w-8 rounded-full" />
          </Row>
        </header>

        {/* Hero Content */}
        <Column className="px-8 py-16 md:px-16">
          <Column gap={3} align="center" className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">{title}</h1>
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          </Column>

          {/* Process Options Grid */}
          <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto w-full">
            {processOptions.map((option) => (
              <ProcessOptionCard
                key={option.id}
                option={option}
                isSelected={selectedOption === option.id}
                onSelect={() => handleOptionSelect(option.id)}
              />
            ))}
          </Grid>

          {/* Skeleton Loading Sections */}
          {showSkeleton && (
            <Column gap={12} className="max-w-6xl mx-auto w-full mt-16">
              <Grid cols={1} gap={8} className="lg:grid-cols-3">
                <SkeletonSection />
                <SkeletonSection />
                <SkeletonSection />
              </Grid>
            </Column>
          )}
        </Column>
      </div>

      {/* Recent Projects Section - White background */}
      {recentProjects.length > 0 && !showSkeleton && (
        <Column flex={1} className="px-8 py-12 md:px-16">
          <Column gap={6} className="max-w-6xl mx-auto w-full">
            <Row justify="between" align="center">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              {/* View Mode Toggle */}
              <ButtonGroup>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('cards')}
                  aria-label="Card view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                  aria-label="Table view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </Row>

            {/* Cards View */}
            {viewMode === 'cards' && (
              <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-4">
                {recentProjects.map((project) => (
                  <RecentProjectCard
                    key={project.id}
                    project={project}
                    onSelect={() => onProjectSelect?.(project.id)}
                  />
                ))}
              </Grid>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <DataTable
                columns={columns}
                data={recentProjects}
                searchKey="name"
                searchPlaceholder="Search projects..."
                showColumnToggle={false}
                showPagination={recentProjects.length > 10}
                compact
              />
            )}
          </Column>
        </Column>
      )}

      {/* Footer skeleton */}
      {showSkeleton && (
        <div className="bg-background border-t flex-1">
          <Row justify="center" className="px-8 py-8">
            <Skeleton className="h-24 w-full max-w-4xl rounded-lg" />
          </Row>
        </div>
      )}
    </Column>
  );
}
