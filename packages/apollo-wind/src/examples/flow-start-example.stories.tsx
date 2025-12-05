import type { Meta, StoryObj } from "@storybook/react-vite";
import { Blocks, FolderKanban, GitBranch, Sparkles } from "lucide-react";
import type { ProcessOption, RecentProject } from "./flow-start-example";
import { FlowStartExample } from "./flow-start-example";

const meta = {
  title: "Examples/Flow Start",
  component: FlowStartExample,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onOptionSelect: { action: "option selected" },
    onProjectSelect: { action: "project selected" },
    defaultViewMode: {
      control: "radio",
      options: ["cards", "table"],
    },
  },
} satisfies Meta<typeof FlowStartExample>;

export default meta;
type Story = StoryObj<typeof meta>;

const processOptions: ProcessOption[] = [
  {
    id: "flow",
    title: "Flow",
    description: "Effortlessly build and deploy powerful automations—no code required",
    icon: <GitBranch className="h-5 w-5" />,
    badge: "NEW",
    badgeVariant: "default",
  },
  {
    id: "bpmn",
    title: "BPMN",
    description: "Design and implement business processes with the structure of BPMN 2.0",
    icon: <Blocks className="h-5 w-5" />,
  },
  {
    id: "case",
    title: "Case management",
    description: "Creating and deploy end to end case management workflows",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    id: "autopilot",
    title: "Generate with Autopilot",
    description: "Describe what you need, and Autopilot will build it",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const recentProjects: RecentProject[] = [
  {
    id: "1",
    name: "Invoice Processing Automation",
    type: "flow",
    lastModified: "2 hours ago",
    status: "published",
  },
  {
    id: "2",
    name: "Customer Onboarding BPMN",
    type: "bpmn",
    lastModified: "Yesterday",
    status: "draft",
  },
  {
    id: "3",
    name: "Support Ticket Case Flow",
    type: "case",
    lastModified: "3 days ago",
    status: "published",
  },
  {
    id: "4",
    name: "HR Request Handler",
    type: "autopilot",
    lastModified: "1 week ago",
    status: "archived",
  },
  {
    id: "5",
    name: "Expense Report Approval",
    type: "bpmn",
    lastModified: "2 weeks ago",
    status: "published",
  },
  {
    id: "6",
    name: "New Employee Onboarding",
    type: "case",
    lastModified: "3 weeks ago",
    status: "draft",
  },
  {
    id: "7",
    name: "Contract Review Process",
    type: "flow",
    lastModified: "1 month ago",
    status: "published",
  },
  {
    id: "8",
    name: "Customer Feedback Analysis",
    type: "autopilot",
    lastModified: "1 month ago",
    status: "archived",
  },
];

export const Default: Story = {
  args: {
    processOptions,
    recentProjects,
    showSkeleton: false,
    defaultViewMode: "cards",
  },
};
