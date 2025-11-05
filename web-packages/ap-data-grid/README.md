# @uipath/ap-data-grid

Data Grid component as a framework-agnostic web component with React wrapper.

## Overview

`ap-data-grid` provides a powerful data grid built as a web component (Custom Element), with an optional React wrapper for improved TypeScript support and React integration.

## Installation

```bash
npm install @uipath/ap-data-grid
# or
pnpm add @uipath/ap-data-grid
# or
yarn add @uipath/ap-data-grid
```

## Usage

### Web Component (Vanilla JavaScript / HTML)

```html
<script type="module">
  import '@uipath/ap-data-grid';
</script>

<ap-data-grid></ap-data-grid>
```

### React Wrapper

```typescript
import { ApDataGrid } from '@uipath/ap-data-grid/react';

function App() {
  return (
    <ApDataGrid
      data={data}
      columns={columns}
      onRowClick={(row) => console.log(row)}
    />
  );
}
```

### Angular

```typescript
// In app.module.ts
import '@uipath/ap-data-grid';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<!-- In template -->
<ap-data-grid></ap-data-grid>
```

### Vue

```vue
<template>
  <ap-data-grid></ap-data-grid>
</template>

<script>
import '@uipath/ap-data-grid';
</script>
```

## Properties

```typescript
// Will be defined based on component requirements
```

## Events

```typescript
// Will be defined based on component requirements
```

## License

MIT
