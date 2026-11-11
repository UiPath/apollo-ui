# File viewer

`@uipath/apollo-react/file-viewer` shows one file in one of three views:

| View | What it shows |
| --- | --- |
| `rendered` | Markdown, with its frontmatter shown apart as YAML. Other files fall back to `source`. |
| `source` | Highlighted text in Monaco. Editable when the host passes `onChange`, read-only otherwise. |
| `changes` | Monaco's diff of `baseContent` against `content`, `side-by-side` or `inline`. |

The extension picks the language: md, json, yaml, xml (and bpmn, svg), html, css, js, ts, py, cs, sh, ps1, sql. Anything else is plain text.

The viewer loads no files and owns no toggle. The host passes the text, the view, the strings and Monaco.

## Setup

1. Install `monaco-editor` (0.50 or later). It is an optional peer dependency: rendered markdown works without it.
2. Import the styles once: `@uipath/apollo-react/file-viewer/styles/tailwind.file-viewer.css`.
3. Give the viewer's parent a height. Monaco fills it.

Monaco loads the first time a `source` or `changes` view needs it, through the host's `loadMonaco`. Until then the source view shows the same text, highlighted by Prism.

## React (Cartographer)

```tsx
import { FileViewer, hasRenderedView } from '@uipath/apollo-react/file-viewer';

// A module-level function, so every viewer shares one Monaco load.
const loadMonaco = () => import('monaco-editor');

<FileViewer
  path={file.path}
  content={file.content}
  view={{ kind: 'source', onChange: saveDraft }}
  loadMonaco={loadMonaco}
  theme={isDark ? 'dark' : 'light'}
  labels={{ loading: t('fileViewer.loading'), loadFailed: t('fileViewer.loadFailed') }}
/>;
```

Use `hasRenderedView(path)` to hide the rendered option for files that have none. With Vite, configure Monaco's workers as the Monaco docs describe. Without them Monaco still works, on the main thread.

## Angular (Orchestrator)

Orchestrator already ships React and Monaco. A thin host component mounts the viewer with `createRoot` and hands it the app's Monaco instance:

```ts
import { Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { MONACO_INSTANCE } from '@uipath/apollo-angular/components/ui-monaco-editor';
import { FileViewer, type FileViewerLabels, type FileViewerView } from '@uipath/apollo-react/file-viewer';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'ui-file-viewer',
  template: '<div #host class="file-viewer-host"></div>',
  styles: ':host, .file-viewer-host { display: block; height: 100%; }',
})
export class FileViewerComponent {
  readonly path = input.required<string>();
  readonly content = input.required<string>();
  readonly view = input.required<FileViewerView>();
  readonly theme = input<'light' | 'dark'>('light');
  readonly labels = input.required<FileViewerLabels>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly monaco$ = inject(MONACO_INSTANCE);
  private readonly loadMonaco = () => firstValueFrom(this.monaco$);

  constructor() {
    let root: ReturnType<typeof createRoot> | undefined;
    effect(() => {
      root ??= createRoot(this.host().nativeElement);
      root.render(
        createElement(FileViewer, {
          path: this.path(),
          content: this.content(),
          view: this.view(),
          theme: this.theme(),
          labels: this.labels(),
          loadMonaco: this.loadMonaco,
        }),
      );
    });
    inject(DestroyRef).onDestroy(() => root?.unmount());
  }
}
```
