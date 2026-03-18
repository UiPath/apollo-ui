# @uipath/flow-node-schema

Lightweight [Zod](https://zod.dev) schemas for UiPath flow/canvas node definitions. Zero React or UI dependencies — only `zod` as a runtime dependency.

## Install

```bash
pnpm add @uipath/flow-node-schema
```

## Usage

```typescript
import {
  nodeManifestSchema,
  nodeSchema,
  edgeSchema,
  categoryManifestSchema,
} from '@uipath/flow-node-schema';

// Validate a node manifest from the server
const result = nodeManifestSchema.safeParse(data);
if (result.success) {
  console.log(result.data.nodeType);
}

// Infer TypeScript types from schemas
import type { NodeManifest, NodeInstance, EdgeInstance } from '@uipath/flow-node-schema';
```

## Exported Schemas

### Node Definitions

| Schema | Description |
|--------|-------------|
| `nodeManifestSchema` | Server-provided node type definition |
| `nodeDisplayManifestSchema` | Visual display configuration |
| `nodeShapeSchema` | Node shape enum (`circle`, `square`, `rectangle`) |
| `categoryManifestSchema` | Hierarchical category definition |
| `handleManifestSchema` | Individual handle (port) configuration |
| `handleGroupManifestSchema` | Group of handles at a position |
| `connectionConstraintSchema` | Connection rules between nodes |

### Node Instances

| Schema | Description |
|--------|-------------|
| `nodeSchema` | A node instance in a workflow |
| `edgeSchema` | A connection between nodes |
| `displayConfigSchema` | Runtime display overrides |
| `idSchema` | Non-empty string identifier |
| `versionSchema` | Semver string validation |

### Toolbar

| Schema | Description |
|--------|-------------|
| `toolbarActionSchema` | Toolbar action definition |
| `toolbarConfigurationSchema` | Mode-specific toolbar config |

## License

MIT
