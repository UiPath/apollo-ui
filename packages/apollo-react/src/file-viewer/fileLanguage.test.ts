import { describe, expect, it } from 'vitest';

import { fileExtension, hasRenderedView, languageForPath } from './fileLanguage';

describe('fileExtension', () => {
  it.each([
    ['wiki/as-is/overview.md', 'md'],
    ['map.YAML', 'yaml'],
    ['archive.tar.gz', 'gz'],
    ['Dockerfile', ''],
    ['.gitignore', ''],
    ['folder.v2/README', ''],
  ])('%s → %s', (path, extension) => {
    expect(fileExtension(path)).toBe(extension);
  });
});

describe('languageForPath', () => {
  it('maps the sample map files to their languages', () => {
    expect(languageForPath('wiki/map.yaml').monaco).toBe('yaml');
    expect(languageForPath('history/CR-1.yml').monaco).toBe('yaml');
    expect(languageForPath('wiki/as-is/process-provenance.json').monaco).toBe('json');
    expect(languageForPath('wiki/as-is/process.bpmn')).toEqual({ monaco: 'xml', prism: 'markup' });
  });

  it('treats unknown and missing extensions as plain text', () => {
    expect(languageForPath('notes.unknown')).toEqual({ monaco: 'plaintext', prism: 'text' });
    expect(languageForPath('Makefile')).toEqual({ monaco: 'plaintext', prism: 'text' });
  });
});

describe('hasRenderedView', () => {
  it('is true for markdown only', () => {
    expect(hasRenderedView('wiki/as-is/overview.md')).toBe(true);
    expect(hasRenderedView('README.markdown')).toBe(true);
    expect(hasRenderedView('wiki/map.yaml')).toBe(false);
  });
});
