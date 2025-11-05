# @uipath/ap-autopilot-chat

Autopilot Chat component as a framework-agnostic web component.

## Overview

`ap-autopilot-chat` provides a chat interface built as a web component (Custom Element), making it usable in any framework or vanilla JavaScript.

## Installation

```bash
npm install @uipath/ap-autopilot-chat
# or
pnpm add @uipath/ap-autopilot-chat
# or
yarn add @uipath/ap-autopilot-chat
```

## Usage

### Vanilla JavaScript / HTML

```html
<script type="module">
  import '@uipath/ap-autopilot-chat';
</script>

<ap-autopilot-chat></ap-autopilot-chat>
```

### React

```typescript
import '@uipath/ap-autopilot-chat';

function App() {
  return <ap-autopilot-chat />;
}
```

### Angular

```typescript
// In app.module.ts
import '@uipath/ap-autopilot-chat';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<!-- In template -->
<ap-autopilot-chat></ap-autopilot-chat>
```

### Vue

```vue
<template>
  <ap-autopilot-chat></ap-autopilot-chat>
</template>

<script>
import '@uipath/ap-autopilot-chat';
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
