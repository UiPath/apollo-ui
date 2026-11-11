// One file in a rendered, source or changes view. Domain-free: the host loads the files, owns the
// view toggle and passes every string (`FileViewerLabels`); Monaco comes from the host (`LoadMonaco`).

export type { DiffLayout } from './DiffEditor';
export {
  type FileViewerLabels,
  type FileViewerProps,
  type FileViewerView,
  FileViewer,
} from './FileViewer';
export { type FileLanguage, fileExtension, hasRenderedView, languageForPath } from './fileLanguage';
export { type SplitMarkdown, splitFrontmatter } from './frontmatter';
export { type FileViewerTheme, MONACO_THEME_NAME } from './useApolloMonacoTheme';
export type { LoadMonaco, MonacoApi } from './useMonaco';
