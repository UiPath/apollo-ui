# Apollo v.4 Design System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/built%20with-Turborepo-ef4444.svg)](https://turbo.build/)

Apollo v.4 is UiPath's open-source design system monorepo. It houses multiple design systems used by different teams across UiPath — from Material UI-based components to Tailwind/shadcn implementations — all in one place.

## Table of Contents
- [✨ Features](#-features)
- [📦 Package Dependency Graph](#-package-dependency-graph)
- [📁 Repository Structure](#-repository-structure)
- [📦 Packages & Design Systems](#-packages--design-systems)
  - [Core Foundation](#core-foundation)
  - [Design Systems](#design-systems)
  - [Web Components](#web-components)
- [🎨 Live Demos](#-live-demos)
- [📚 Documentation](#-documentation)
- [🚀 Contributing](#-contributing)
- [License](#license)

## ✨ Features

- 🎨 **Design Tokens** - 1300+ icons, comprehensive color system, typography, spacing
- ⚛️ **React Components** - Built on Material UI with Apollo theming
- 🎐 **Tailwind CSS** - Modern utility-first styling with shadcn/ui
- 🧩 **shadcn Registry** - Installable components via `npx shadcn add @uipath/...`
- 🌐 **Web Components** - Cross-framework components for maximum flexibility
- 📘 **TypeScript** - Full type safety across all packages
- 📚 **Storybook** - Interactive component documentation
- 🚀 **Monorepo** - Efficient development with Turborepo and pnpm

## 📦 Package Dependency Graph

```mermaid
graph RL
    React["@uipath/apollo-react<br/>React + Material UI"] -->|requires| Core["@uipath/apollo-core<br/>Design Tokens, Icons, Fonts"]
    Wind["@uipath/apollo-wind<br/>Tailwind + shadcn/ui"] -->|requires| Core
    React -->|requires| Wind
    Chat["@uipath/ap-chat<br/>Chat Web Component"] -->|requires| React
    Vertex["apollo-vertex<br/>Vertical Solutions Design System"]

    style Core fill:#374151,stroke:#ef4444,stroke-width:3px,color:#fff
    style React fill:#1e3a8a,stroke:#3b82f6,stroke-width:3px,color:#fff
    style Wind fill:#164e63,stroke:#06b6d4,stroke-width:3px,color:#fff
    style Chat fill:#064e3b,stroke:#10b981,stroke-width:3px,color:#fff
    style Vertex fill:#4a1d96,stroke:#8b5cf6,stroke-width:3px,color:#fff
```

## 📁 Repository Structure

```
apollo-ui/
├── packages/              # Core + framework packages
│   ├── apollo-core/       # 🎨 Design tokens, icons, fonts
│   ├── apollo-react/      # ⚛️ Canvas components, chat, icons, MUI theme
│   └── apollo-wind/       # 🎐 Tailwind + shadcn/ui
│
├── web-packages/          # Cross-framework web components
│   └── ap-chat/           # 💬 Chat web component
│
└── apps/                  # Applications
    ├── apollo-vertex/     # 🧩 shadcn component registry + Next.js docs site
    ├── storybook/         # 📚 Storybook component documentation
    └── react-playground/  # 🔬 React testing environment
```

## 📥 Installation

All Apollo packages are published to both **npm** and **GitHub Package Registry** for maximum accessibility.

### For External Users (npm - Recommended)

No special configuration needed. Just install packages directly:

```bash
npm install @uipath/apollo-react
# or
npm install @uipath/apollo-core @uipath/apollo-wind
```

### For Internal UiPath Users (GitHub Package Registry)

If you have `.npmrc` configured with:
```
@uipath:registry=https://npm.pkg.github.com
```

Packages will automatically install from GitHub Package Registry. No changes needed!

### Testing PR Previews

To test a feature from an open PR before it's merged:

```bash
# Install latest PR preview
npm install @uipath/apollo-react@dev

# Or install specific PR version (from PR comment)
npm install @uipath/apollo-react@5.6.1-pr188.4865fad
```

Preview versions are published when the `dev-packages` label is added to a PR. Remove the label to stop publishing on new commits. Packages are deprecated on npm and cleaned up from GitHub Package Registry after the PR is closed or merged.

---

## 📦 Packages & Design Systems

### Core Foundation

| Package | Version | Downloads |
|---------|---------|-----------|
| **[@uipath/apollo-core](./packages/apollo-core)** | [![npm](https://img.shields.io/npm/v/@uipath/apollo-core)](https://www.npmjs.com/package/@uipath/apollo-core) | [![downloads](https://img.shields.io/npm/dm/@uipath/apollo-core)](https://www.npmjs.com/package/@uipath/apollo-core) |

Design tokens, 1300+ icons, and fonts. Framework-agnostic foundation shared across design systems.

---

### Design Systems

| System | Location | Tech | Consumed via |
|--------|----------|------|--------------|
| **[apollo-react](./packages/apollo-react)** | `packages/apollo-react` | React + Material UI | npm package |
| **[apollo-wind](./packages/apollo-wind)** | `packages/apollo-wind` | Tailwind + shadcn/ui | npm package |
| **[apollo-vertex](./apps/apollo-vertex)** | `apps/apollo-vertex` | Next.js + Tailwind + Radix | shadcn registry |

- **apollo-react**: Canvas/workflow components, ApChat, icons, Material UI themes
- **apollo-wind**: Tailwind CSS + shadcn/ui components published as an npm package
- **apollo-vertex**: Design system for vertical solutions. Components are distributed via the `@uipath` shadcn registry and installed directly into consumer projects:

```bash
npx shadcn@latest add @uipath/button @uipath/checkbox @uipath/input
```

---

### Web Components

| Package | Version | Downloads |
|---------|---------|-----------|
| **[@uipath/ap-chat](./web-packages/ap-chat)** | [![npm](https://img.shields.io/npm/v/@uipath/ap-chat)](https://www.npmjs.com/package/@uipath/ap-chat) | [![downloads](https://img.shields.io/npm/dm/@uipath/ap-chat)](https://www.npmjs.com/package/@uipath/ap-chat) |

Framework-agnostic AI chat interface web component for vanilla JS, Vue, Angular, etc.

**Note:** React users should import `ApChat` from `@uipath/apollo-react` instead.

---

## 🎨 Live Demos

Explore our components in interactive Storybook environments:

- **[Apollo Vertex](https://apollo-vertex.vercel.app/)** - Vertical solutions components and docs
- **[Canvas Components](https://apollo-canvas.vercel.app/)** - Workflow and canvas demos
- **[React Playground](https://apollo-ui-react.vercel.app/)** - Material UI components, design tokens, CSS vars, icons, and chat component
- **[Wind Components](https://apollo-wind.vercel.app/)** - Tailwind CSS components

## 📚 Documentation

- **[@uipath/apollo-core](./packages/apollo-core/README.md)** - Design tokens, icons, fonts
- **[@uipath/apollo-react](./packages/apollo-react/README.md)** - React components and canvas
- **[@uipath/apollo-wind](./packages/apollo-wind/README.md)** - Tailwind components
- **[@uipath/ap-chat](./web-packages/ap-chat/README.md)** - Chat web component
- **[Apollo Vertex](./apps/apollo-vertex)** - Vertical solutions design system
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

## 🚀 Contributing

### Prerequisites

- **Node.js** >= 22
- **pnpm** >= 10

### Setup

```bash
# Clone and setup
git clone https://github.com/UiPath/apollo-ui.git
cd apollo-ui
pnpm install

# Build packages
pnpm build

# Run Storybook
pnpm storybook
```

### Development Commands

```bash
pnpm dev              # Watch mode for all packages
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
```

### Component Guidelines

When contributing components:
- ✅ Follow package naming conventions
- ✅ Use design tokens from `@uipath/apollo-core`
- ✅ Include TypeScript types
- ✅ Add Storybook stories
- ✅ Write unit tests
- ✅ Update package README

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT © UiPath
