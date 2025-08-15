import { BaseNodeData, NodeRegistration, NodeTypeDefinition } from "./types";

export class NodeTypeRegistry {
  private definitions = new Map<string, NodeTypeDefinition>();
  private metadata = new Map<string, Omit<NodeRegistration, "definition">>();
  private categories = new Map<string, string[]>();

  register(registration: NodeRegistration) {
    const { definition, ...metadata } = registration;
    const nodeType = registration.nodeType;

    this.definitions.set(nodeType, definition);
    this.metadata.set(nodeType, metadata);

    const category = metadata.category || "misc";
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(nodeType);
    console.debug(`✅ Registered node type: ${nodeType}`);
  }

  get(nodeType: string): NodeTypeDefinition | undefined {
    return this.definitions.get(nodeType);
  }

  getMetadata(nodeType: string) {
    return this.metadata.get(nodeType);
  }

  getByCategory(category: string): string[] {
    return this.categories.get(category) || [];
  }

  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  getAllNodeTypes(): string[] {
    return Array.from(this.definitions.keys());
  }

  createDefaultData(nodeType: string): BaseNodeData {
    const definition = this.get(nodeType);
    const metadata = this.getMetadata(nodeType);

    return {
      nodeType,
      version: metadata?.version || "1.0.0",
      parameters: definition?.getDefaultParameters?.() ?? {},
      display: {
        label: metadata?.displayName || nodeType,
        ...definition?.getDefaultDisplay?.(),
      },
    };
  }
}
