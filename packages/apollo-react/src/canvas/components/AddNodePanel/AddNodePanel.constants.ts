import type { NodeCategory, NodeOption } from "./AddNodePanel.types";

export const DEFAULT_CATEGORIES: NodeCategory[] = [
  { id: "triggers", label: "Triggers", icon: "electric_bolt", color: "#E3F2FD" },
  { id: "actions", label: "Actions", icon: "settings", color: "#F3E5F5" },
  { id: "ai", label: "AI Tools", icon: "smart_toy", color: "#E8F5E9" },
  { id: "data", label: "Data", icon: "filter_alt", color: "#FFF3E0" },
  { id: "logic", label: "Logic", icon: "account_tree", color: "#FCE4EC" },
  { id: "integrations", label: "Integrations", icon: "extension", color: "#E0F2F1" },
];

export const MOCK_NODES: NodeOption[] = [
  // Triggers
  { id: "1", type: "manual-trigger", label: "Manual trigger", icon: "touch_app", category: "triggers" },
  { id: "2", type: "schedule-trigger", label: "Schedule trigger", icon: "schedule", category: "triggers" },
  { id: "3", type: "webhook-trigger", label: "Webhook trigger", icon: "webhook", category: "triggers" },
  { id: "4", type: "email-trigger", label: "Email trigger", icon: "email", category: "triggers" },
  { id: "5", type: "file-trigger", label: "File trigger", icon: "folder", category: "triggers" },

  // AI Tools
  { id: "6", type: "ai-templates", label: "AI templates", icon: "auto_awesome", category: "ai", description: "Pre-built AI workflows" },
  { id: "7", type: "ai-agent", label: "AI Agent", icon: "smart_toy", category: "ai", description: "Autonomous AI assistant" },
  { id: "8", type: "openai", label: "OpenAI", icon: "psychology", category: "ai", description: "GPT models integration" },
  { id: "9", type: "llm-chain", label: "LLM Chain", icon: "link", category: "ai", description: "Chain multiple LLM calls" },
  {
    id: "10",
    type: "sentiment-analyzer",
    label: "Sentiment Analyzer",
    icon: "sentiment_satisfied",
    category: "ai",
    description: "Analyze text sentiment",
  },

  // Data
  {
    id: "11",
    type: "data-extractor",
    label: "Data extractor",
    icon: "file_copy",
    category: "data",
    description: "Extract data from documents",
  },
  {
    id: "12",
    type: "data-transformer",
    label: "Data transformer",
    icon: "transform",
    category: "data",
    description: "Transform data formats",
  },
  { id: "13", type: "database", label: "Database", icon: "storage", category: "data", description: "Database operations" },

  // Actions
  { id: "14", type: "http-request", label: "HTTP Request", icon: "http", category: "actions", description: "Make HTTP API calls" },
  { id: "15", type: "send-email", label: "Send Email", icon: "send", category: "actions", description: "Send email notifications" },
  {
    id: "16",
    type: "log-message",
    label: "Log Message",
    icon: "description",
    category: "actions",
    description: "Log messages for debugging",
  },
];
