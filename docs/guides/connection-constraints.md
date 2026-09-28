# Connection Constraints Quick Reference

**How to add validation rules to your workflow schema handles**

## What Are Connection Constraints?

Connection constraints define how nodes are allowed to connect to other nodes in the workflow. Add them to handle definitions in your node schema to control workflow composition and ensure semantic correctness.

**Key Concepts:**
- 🔠 **Type Compatibility**: Base rules for how handles allow connection
- 🔢 **Cardinality**: Control minimum and maximum number of connections
- ✅ **Whitelist (allowed)**: Restrict connections to specific targets or sources
- ❌ **Blacklist (forbidden)**: Block connections to specific targets or sources
- 🎯 **Precision**: Target specific node types or entire categories

## Quick Start Example

The most common pattern is an artifact handle that connects to a specific category of nodes:

```typescript
{
  id: 'memory',
  label: 'Memory',
  type: 'target',
  handleType: 'artifact',
  constraints: {
    allowedSourceCategories: ['core.agent.memory'],
    validationMessage: 'Only Agent Memory nodes can connect here'
  }
}
```

**What this does:**
- ✅ The "memory" handle can **only** connect to nodes in the `uipath.agent.memory` category.
- ✅ Custom error message shown when users try invalid connections
- ✅ Prevents incorrect workflow configurations

## Validation Rules

### 1. Handle Type Compatibility

This is a built-in constraint that does not require configuration on your part but is important to understand as you define handles.

A connection is only valid when it has a source and a target handle. Or when it represents an artifact relationship.
This simple rule implicitly enables some powerful constraints based on what handle you are trying to create a connection with.

- `source` handle <> `target` handle ✅
- `artifact` handle <> `artifact` handle ✅
- `source` handle <> `source` handle ❌
- `target` handle <> `target` handle ❌

### 2. Connection Cardinality

| Property | Type | Use On | Purpose | Example |
|----------|------|--------|---------|---------|
| `maxConnections` | `number` | Any handle | Limit total connections allowed | `maxConnections: 1` (single connection) |
| `minConnections` | `number` | Any handle | Require minimum connections for validation | `minConnections: 1` (must connect) |

### 3. Whitelisting/Blacklisting

> 💡 **Pro Tip**: Use `allowed...` for restrictive rules (only these), `forbidden...` for exceptions (except these).

#### Category Targeting

| Property | Type | Use On | Purpose | Example |
|----------|------|--------|---------|---------|
| `allowedTargetCategories` | `string[]` | Source handles | WHITELIST - Only connect to nodes in these categories | `['automation', 'data']` |
| `forbiddenTargetCategories` | `string[]` | Source handles | BLACKLIST - Cannot connect to nodes in these categories | `['trigger']` |
| `allowedSourceCategories` | `string[]` | Target handles | WHITELIST - Only accept connections from these categories | `['control-flow']` |
| `forbiddenSourceCategories` | `string[]` | Target handles | BLACKLIST - Cannot accept from these categories | `['trigger']` |

##### Category Nesting

- Categories support hierarchical relationships
- Constraints are checked at all nesting levels
- Parent categories shown if any descendants match constraints
- Child categories inherit parent context but can have different constraint rules.

> 💡 **Pro Tip**: Prefer category constraints over node-specific constraints when possible - they scale better as you add new node types.

#### Specific Node/Handle Targeting

| Property | Type | Use On | Purpose | Example |
|----------|------|--------|---------|---------|
| `allowedTargets` | `HandleTarget[]` | Source handles | WHITELIST - Only these nodes/handles can receive connections | `[{ nodeType: 'agent' }]` |
| `forbiddenTargets` | `HandleTarget[]` | Source handles | BLACKLIST - These nodes/handles cannot receive connections | `[{ nodeType: 'trigger.*' }]` |
| `allowedSources` | `HandleTarget[]` | Target handles | WHITELIST - Only these nodes/handles can connect here | `[{ nodeType: 'model' }]` |
| `forbiddenSources` | `HandleTarget[]` | Target handles | BLACKLIST - These nodes/handles cannot connect here | `[{ nodeType: 'unsafe.*' }]` |

##### HandleTarget Structure

> ⚠️ **Important**: Wildcards only work in `nodeType`, not `handleId`. Handle IDs must match exactly.

The `HandleTarget` type specifies a node and optional handle for precise targeting:

```typescript
type HandleTarget = {
  nodeType: string;      // Node type (supports wildcards)
  handleId?: string;     // Optional specific handle ID
}
```

#### Priority

- **Forbidden checked first**, then allowed
- If a target appears in both `allowedTargets` and `forbiddenTargets`, the connection is **forbidden**
- This allows you to whitelist a category but blacklist specific nodes within it

#### Wildcard Pattern Matching

- `*` matches everything
- `automation.*` matches `automation.file`, `automation.email`, etc.
- Patterns are converted to regex internally
- Exact match when no wildcard is used
