import { Bell, ChevronLeft, ChevronRight, HelpCircle, Menu } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib";

export interface AppShellTemplateProps {
  className?: string;
  logo?: React.ReactNode;
  tenant?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  navigation?: Array<{
    label: string;
    href?: string;
    active?: boolean;
    badge?: string;
  }>;
  heroSection?: {
    title: React.ReactNode;
    description?: string;
    cta?: {
      label: string;
      onClick?: () => void;
    };
    illustration?: React.ReactNode;
  };
  sections?: Array<{
    title: string;
    viewAllLink?: {
      label: string;
      onClick?: () => void;
    };
    items: Array<{
      id: string;
      title: string;
      description?: string;
      badge?: {
        label: string;
        variant?: "default" | "secondary" | "destructive" | "outline";
      };
      footer?: string;
      action?: {
        label: string;
        onClick?: () => void;
      };
    }>;
  }>;
  sidebar?: {
    title: string;
    content: React.ReactNode;
  };
}

export function AppShellTemplate({
  className,
  logo = <div className="text-xl font-bold">Logo</div>,
  tenant = "DefaultTenant",
  user = {
    name: "John Doe",
    email: "john.doe@example.com",
  },
  navigation = [
    { label: "Home", active: true },
    { label: "Process instances" },
    { label: "Process incidents" },
    { label: "Case app", badge: "Preview" },
    { label: "Case instances", badge: "Preview" },
  ],
  heroSection = {
    title: (
      <>
        Orchestrate <span className="text-primary">AI agents, robots,</span> and people with{" "}
        <span className="text-primary">Platform</span> to exceed business outcomes
      </>
    ),
    cta: {
      label: "Get Started",
    },
  },
  sections = [
    {
      title: "Recent projects",
      viewAllLink: { label: "View all projects" },
      items: [
        {
          id: "1",
          title: "Solution 161",
          badge: { label: "DRAFT", variant: "outline" },
          footer: "Last modified 13 minutes ago",
        },
        {
          id: "2",
          title: "Property insurance claims",
          badge: { label: "DRAFT", variant: "outline" },
          footer: "Last modified 7 days ago",
        },
        {
          id: "3",
          title: "Property insurance claims",
          badge: { label: "DEPLOYED", variant: "default" },
          footer: "Last modified 7 hours ago",
        },
      ],
    },
    {
      title: "Templates",
      items: [
        {
          id: "1",
          title: "Supplier Onboarding",
          description:
            "An agentic process built with Platform (Agentic Orchestration), modeled using...",
          action: { label: "View" },
        },
        {
          id: "2",
          title: "Invoice Processing",
          description:
            "An agentic process built with Platform (Agentic Orchestration), modeled using...",
          action: { label: "View" },
        },
        {
          id: "3",
          title: "MyPoNewTeMplate",
          description: "aav",
          action: { label: "View" },
        },
      ],
    },
  ],
  sidebar = {
    title: "How it works",
    content: (
      <div className="space-y-4">
        <div className="rounded-lg bg-primary/10 p-4">
          <p className="text-sm">Learn more about how to use this platform effectively.</p>
        </div>
      </div>
    ),
  },
}: AppShellTemplateProps) {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = React.useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = React.useState(false);

  return (
    <div className={cn("flex h-screen flex-col bg-background", className)}>
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {logo}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm md:inline">Tenant:</span>
            <Button variant="ghost" className="font-normal">
              {tenant}
              <ChevronRight className="ml-1 h-4 w-4 rotate-90" />
            </Button>
          </div>
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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            "relative hidden border-r bg-muted/10 transition-all duration-300 md:block",
            leftSidebarCollapsed ? "w-12" : "w-60",
          )}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                className="h-8 w-8"
              >
                {leftSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!leftSidebarCollapsed && (
              <nav className="space-y-1 overflow-y-auto p-2 pt-0">
                {navigation.map((item, index) => (
                  <Button
                    key={index}
                    variant={item.active ? "secondary" : "ghost"}
                    className="w-full justify-between"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </nav>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {/* Hero Section */}
            {heroSection && (
              <Card className="mb-8 border-0 bg-gradient-to-r from-muted/50 to-muted/20">
                <CardContent className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between">
                  <div className="flex-1 space-y-4">
                    <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                      {heroSection.title}
                    </h1>
                    {heroSection.description && (
                      <p className="text-muted-foreground">{heroSection.description}</p>
                    )}
                    {heroSection.cta && (
                      <Button size="lg" onClick={heroSection.cta.onClick}>
                        {heroSection.cta.label}
                      </Button>
                    )}
                  </div>
                  {heroSection.illustration && (
                    <div className="flex-shrink-0">{heroSection.illustration}</div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Content Sections */}
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">{section.title}</h2>
                  {section.viewAllLink && (
                    <Button variant="link" onClick={section.viewAllLink.onClick}>
                      {section.viewAllLink.label}
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        {item.badge && (
                          <Badge variant={item.badge.variant} className="mb-2 w-fit text-xs">
                            {item.badge.label}
                          </Badge>
                        )}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        {item.description && <CardDescription>{item.description}</CardDescription>}
                      </CardHeader>
                      {(item.footer || item.action) && (
                        <CardFooter className="flex items-center justify-between">
                          {item.footer && (
                            <span className="text-xs text-muted-foreground">{item.footer}</span>
                          )}
                          {item.action && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={item.action.onClick}
                              className="ml-auto"
                            >
                              {item.action.label}
                            </Button>
                          )}
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar */}
        {sidebar && (
          <aside
            className={cn(
              "relative hidden border-l bg-muted/10 transition-all duration-300 lg:block",
              rightSidebarCollapsed ? "w-12" : "w-80",
            )}
          >
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-start p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                  className="h-8 w-8"
                >
                  {rightSidebarCollapsed ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!rightSidebarCollapsed && (
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <h3 className="mb-4 text-lg font-semibold">{sidebar.title}</h3>
                  {sidebar.content}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
