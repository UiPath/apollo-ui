# @uipath/apollo-angular

Angular component library with Angular Material theming for the Apollo Design System.

## Overview

`apollo-angular` provides Angular components built on top of Angular Material with Apollo design tokens and theming.

## Installation

```bash
npm install @uipath/apollo-angular
# or
pnpm add @uipath/apollo-angular
# or
yarn add @uipath/apollo-angular
```

## Usage

### Import Modules

```typescript
import { NgModule } from '@angular/core';
import { ApolloButtonModule, ApolloTextFieldModule } from '@uipath/apollo-angular';

@NgModule({
  imports: [ApolloButtonModule, ApolloTextFieldModule],
})
export class AppModule {}
```

### Use Components in Templates

```html
<apollo-button variant="contained">Click me</apollo-button>
<apollo-text-field label="Name"></apollo-text-field>
```

### Import Angular Material Theme

```scss
@use '@uipath/apollo-angular/theming' as apollo;

// Include the Apollo Angular Material theme
@include apollo.apollo-material-theme();
```

## Component Naming

Angular components have no specific selector naming convention enforced. They can be named based on their functionality.

## Exports

- Angular modules for all components
- Angular Material theme overrides
- Re-exported apollo-core tokens
- Re-exported apollo-utils functions

## License

MIT
