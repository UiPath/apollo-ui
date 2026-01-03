import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Activity, CreditCard, DollarSign, Users, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Row, Column, Grid } from '@/components/ui/layout';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatsCard } from '@/components/ui/stats-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib';

// Types
interface Transaction {
  id: string;
  customer: string;
  email: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  avatar?: string;
}

export interface DashboardExampleProps {
  className?: string;
  title?: string;
  description?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Sample data
const transactions: Transaction[] = [
  {
    id: '1',
    customer: 'Olivia Martin',
    email: 'olivia@example.com',
    amount: 1999.0,
    status: 'completed',
    date: '2024-01-15',
  },
  {
    id: '2',
    customer: 'Jackson Lee',
    email: 'jackson@example.com',
    amount: 39.0,
    status: 'completed',
    date: '2024-01-14',
  },
  {
    id: '3',
    customer: 'Isabella Nguyen',
    email: 'isabella@example.com',
    amount: 299.0,
    status: 'pending',
    date: '2024-01-14',
  },
  {
    id: '4',
    customer: 'William Kim',
    email: 'will@example.com',
    amount: 99.0,
    status: 'completed',
    date: '2024-01-13',
  },
  {
    id: '5',
    customer: 'Sofia Davis',
    email: 'sofia@example.com',
    amount: 450.0,
    status: 'failed',
    date: '2024-01-12',
  },
];

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    user: 'Olivia Martin',
    action: 'Completed purchase of $1,999.00',
    time: '2 min ago',
  },
  {
    id: '2',
    user: 'Jackson Lee',
    action: 'Created new account',
    time: '1 hour ago',
  },
  {
    id: '3',
    user: 'Isabella Nguyen',
    action: 'Submitted support ticket #1234',
    time: '3 hours ago',
  },
  {
    id: '4',
    user: 'William Kim',
    action: 'Updated billing information',
    time: '5 hours ago',
  },
];

const columns: ColumnDef<Transaction, unknown>[] = [
  DataTableSelectColumn<Transaction>(),
  {
    accessorKey: 'customer',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => (
      <Row gap={2} align="center">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {row.original.customer
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <Column gap={0}>
          <div className="font-medium">{row.original.customer}</div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </Column>
      </Row>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'completed' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
  },
  {
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Download receipt</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function DashboardExample({
  className,
  title = 'Dashboard',
  description = "Welcome back! Here's an overview of your business.",
  user = { name: 'John Doe', email: 'john@example.com' },
}: DashboardExampleProps) {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Row gap={4} align="center">
            <Button variant="outline" size="sm">
              Download Report
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Row gap={2} align="center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Column gap={0} className="hidden text-sm md:flex">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </Column>
            </Row>
          </Row>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <Grid gap={4} cols={4} className="md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Revenue"
                value="$45,231.89"
                description="+20.1% from last month"
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              />
              <StatsCard
                title="Subscriptions"
                value="+2,350"
                description="+180.1% from last month"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <StatsCard
                title="Sales"
                value="+12,234"
                description="+19% from last month"
                icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
              />
              <StatsCard
                title="Active Now"
                value="+573"
                description="+201 since last hour"
                icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              />
            </Grid>

            {/* Content Grid */}
            <Grid gap={4} cols={7} className="lg:grid-cols-7">
              {/* Transactions Table */}
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest customer transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={columns}
                    data={transactions}
                    searchKey="customer"
                    searchPlaceholder="Search customers..."
                    compact
                    showColumnToggle={false}
                  />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <Row key={activity.id} gap={3} align="start">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.avatar} />
                        <AvatarFallback>
                          {activity.user
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Column gap={1} flex={1}>
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </Column>
                    </Row>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Goals Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Goals</CardTitle>
                <CardDescription>Track your progress towards monthly targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Column gap={2}>
                  <Row justify="between" align="center" className="text-sm">
                    <span>Revenue Target</span>
                    <span className="font-medium">$45,231 / $50,000</span>
                  </Row>
                  <Progress value={90} />
                </Column>
                <Column gap={2}>
                  <Row justify="between" align="center" className="text-sm">
                    <span>New Customers</span>
                    <span className="font-medium">2,350 / 3,000</span>
                  </Row>
                  <Progress value={78} />
                </Column>
                <Column gap={2}>
                  <Row justify="between" align="center" className="text-sm">
                    <span>Support Tickets Resolved</span>
                    <span className="font-medium">145 / 150</span>
                  </Row>
                  <Progress value={97} />
                </Column>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Detailed analytics coming soon</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
                Analytics charts and graphs would go here
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generate and download reports</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
                Report generation interface would go here
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
