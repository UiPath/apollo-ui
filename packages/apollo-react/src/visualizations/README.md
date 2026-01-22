# Visualizations

This directory contains data visualization components for the Apollo Design System.

## Components

### ApSankeyDiagram

A Sankey diagram component for visualizing flow data, useful for showing how data moves through different stages or processes.

**Use cases:**
- Job/workflow execution flows
- Data pipeline visualization
- Process analytics
- Resource allocation flows
- User journey mapping

**Example:**
```tsx
import { ApSankeyDiagram } from '@uipath/apollo-react/visualizations';

<ApSankeyDiagram
  data={{
    nodes: [
      { id: 'start', label: 'Start' },
      { id: 'end', label: 'End' },
    ],
    links: [
      { source: 'start', target: 'end', value: 100 },
    ],
  }}
  height={400}
  onNodeClick={(node) => console.log('Clicked:', node)}
/>
```

## Adding New Visualizations

When adding a new visualization component:

1. Create a new directory: `visualizations/ap-{component-name}/`
2. Follow the standard component structure:
   - `Ap{ComponentName}.tsx` - Main component
   - `Ap{ComponentName}.types.ts` - TypeScript types
   - `Ap{ComponentName}.test.tsx` - Unit tests
   - `Ap{ComponentName}.stories.tsx` - Storybook documentation
   - `index.ts` - Exports
3. Use design tokens from `@uipath/apollo-core`
4. Export from `visualizations/index.ts`
5. Update package.json exports if needed

## Dependencies

Visualization components may use specialized libraries:
- D3.js for custom visualizations
- Chart libraries (if needed)
- Canvas/SVG rendering utilities

Always prefer lightweight, tree-shakeable libraries.
