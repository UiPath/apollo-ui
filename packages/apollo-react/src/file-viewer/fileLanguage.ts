/** How one kind of text file is highlighted: Monaco's language id and the Prism name `CodeBlock` takes. */
export interface FileLanguage {
  monaco: string;
  prism: string;
}

const PLAIN_TEXT: FileLanguage = { monaco: 'plaintext', prism: 'text' };
const MARKDOWN: FileLanguage = { monaco: 'markdown', prism: 'markdown' };
const XML: FileLanguage = { monaco: 'xml', prism: 'markup' };
const JAVASCRIPT: FileLanguage = { monaco: 'javascript', prism: 'javascript' };
const TYPESCRIPT: FileLanguage = { monaco: 'typescript', prism: 'typescript' };

const LANGUAGE_BY_EXTENSION: Readonly<Record<string, FileLanguage>> = {
  md: MARKDOWN,
  markdown: MARKDOWN,
  json: { monaco: 'json', prism: 'json' },
  yaml: { monaco: 'yaml', prism: 'yaml' },
  yml: { monaco: 'yaml', prism: 'yaml' },
  xml: XML,
  bpmn: XML,
  svg: XML,
  html: { monaco: 'html', prism: 'markup' },
  htm: { monaco: 'html', prism: 'markup' },
  css: { monaco: 'css', prism: 'css' },
  js: JAVASCRIPT,
  mjs: JAVASCRIPT,
  cjs: JAVASCRIPT,
  jsx: JAVASCRIPT,
  ts: TYPESCRIPT,
  tsx: TYPESCRIPT,
  py: { monaco: 'python', prism: 'python' },
  cs: { monaco: 'csharp', prism: 'csharp' },
  sh: { monaco: 'shell', prism: 'bash' },
  ps1: { monaco: 'powershell', prism: 'powershell' },
  sql: { monaco: 'sql', prism: 'sql' },
};

/** The extension after the last dot of the file name, lower case; `''` when it has none. */
export function fileExtension(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  const hasExtension = dot > 0;
  return hasExtension ? name.slice(dot + 1).toLowerCase() : '';
}

/** The language a file is highlighted as. Unknown extensions are plain text. */
export function languageForPath(path: string): FileLanguage {
  return LANGUAGE_BY_EXTENSION[fileExtension(path)] ?? PLAIN_TEXT;
}

/** Whether the file has a rendered view besides its source. Only markdown does today. */
export function hasRenderedView(path: string): boolean {
  return languageForPath(path) === MARKDOWN;
}
