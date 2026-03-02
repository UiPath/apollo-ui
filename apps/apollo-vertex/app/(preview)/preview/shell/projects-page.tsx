"use client";

import { Clock, FolderOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const projects = [
  {
    name: "AP Automation",
    description: "End-to-end accounts payable invoice processing with OCR extraction and three-way matching.",
    status: "Active" as const,
    progress: 78,
    lastActivity: "2 hours ago",
    team: 8,
    invoices: "12,450",
  },
  {
    name: "PO Matching",
    description: "Automated purchase order matching against invoices and goods receipts for variance detection.",
    status: "Active" as const,
    progress: 92,
    lastActivity: "30 min ago",
    team: 5,
    invoices: "8,320",
  },
  {
    name: "Expense Reports",
    description: "Employee expense report processing with policy compliance checks and approval routing.",
    status: "In Review" as const,
    progress: 45,
    lastActivity: "1 day ago",
    team: 3,
    invoices: "3,180",
  },
  {
    name: "Vendor Onboarding",
    description: "New vendor registration and validation workflow with tax document verification.",
    status: "Draft" as const,
    progress: 20,
    lastActivity: "3 days ago",
    team: 4,
    invoices: "—",
  },
];

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  Active: "default",
  "In Review": "secondary",
  Draft: "outline",
};

export function ProjectsPage({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="p-6 space-y-4 relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Manage invoice processing automation projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500">2 active</span> · 1 in review · 1 draft
            </p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoices Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23,950</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500">+14%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Card key={project.name} variant="glass">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant={statusVariant[project.status]} className="mt-1">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {project.description}
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span>Completion</span>
                    <span className="text-muted-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {project.team}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {project.lastActivity}
                    </span>
                  </div>
                  {project.invoices !== "—" && (
                    <span>{project.invoices} invoices</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
