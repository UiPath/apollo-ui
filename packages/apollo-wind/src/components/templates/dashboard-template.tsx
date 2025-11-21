import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib";

export interface DashboardTemplateProps {
  className?: string;
  title?: string;
  description?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  stats?: Array<{
    label: string;
    value: string | number;
    trend?: {
      value: string;
      direction: "up" | "down";
    };
    description?: string;
  }>;
  recentActivity?: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    status?: "success" | "warning" | "error" | "info";
  }>;
}

export function DashboardTemplate({
  className,
  title = "Dashboard",
  description = "Welcome back! Here's an overview of your account.",
  user = {
    name: "John Doe",
    email: "john.doe@example.com",
  },
  stats = [
    {
      label: "Total Revenue",
      value: "$45,231.89",
      trend: { value: "+20.1%", direction: "up" },
      description: "from last month",
    },
    {
      label: "Active Users",
      value: "2,350",
      trend: { value: "+180", direction: "up" },
      description: "from last month",
    },
    {
      label: "New Orders",
      value: "145",
      trend: { value: "+12%", direction: "up" },
      description: "from last week",
    },
    {
      label: "Bounce Rate",
      value: "3.2%",
      trend: { value: "-0.4%", direction: "down" },
      description: "from last week",
    },
  ],
  recentActivity = [
    {
      id: "1",
      title: "New order received",
      description: "Order #1234 from Jane Smith",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: "2",
      title: "Payment processed",
      description: "Payment of $299.00 completed",
      time: "10 minutes ago",
      status: "success",
    },
    {
      id: "3",
      title: "Server warning",
      description: "High CPU usage detected",
      time: "1 hour ago",
      status: "warning",
    },
    {
      id: "4",
      title: "New user signup",
      description: "Alice Johnson joined",
      time: "2 hours ago",
      status: "info",
    },
  ],
}: DashboardTemplateProps) {
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      case "info":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Settings
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-sm md:flex">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl font-bold">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                {stat.trend && (
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "font-medium",
                        stat.trend.direction === "up" ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {stat.trend.value}
                    </span>
                    <span className="text-muted-foreground">{stat.description}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Activity */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.title}</p>
                        {activity.status && (
                          <Badge
                            variant={getStatusBadgeVariant(activity.status)}
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                Create New Project
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Invite Team Member
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Export Data
              </Button>
              <Separator className="my-4" />
              <Button className="w-full justify-start" variant="ghost">
                View All Actions
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
