# @uipath/ap-chat

Autopilot Chat component as a framework-agnostic web component.

## Overview

`ap-chat` provides a chat interface built as a web component (Custom Element), making it usable in any framework or vanilla JavaScript.

## Installation

```bash
npm install @uipath/ap-chat
# or
pnpm add @uipath/ap-chat
# or
yarn add @uipath/ap-chat
```

## Usage

### Vanilla JavaScript / HTML

```html
<script type="module">
  import '@uipath/ap-chat';
</script>

<ap-chat></ap-chat>
```

### React

```typescript
import '@uipath/ap-chat';

function App() {
  return <ap-chat />;
}
```

### Angular

```typescript
// In app.module.ts
import '@uipath/ap-chat';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<!-- In template -->
<ap-chat></ap-chat>
```

### Vue

```vue
<template>
  <ap-chat></ap-chat>
</template>

<script>
import '@uipath/ap-chat';
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
