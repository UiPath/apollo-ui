import { describe, expect, it } from 'vitest';

import { CHAT_CITATION_START } from '../../service';
import { highlightCitedRange } from './citation-highlight';

describe('highlightCitedRange', () => {
  it('paints the cited text up to the citation and restores it after', () => {
    const container = document.createElement('div');
    container.innerHTML = `<p>Before <span class="${CHAT_CITATION_START}" data-citation-ids="1"></span>cited <strong>text</strong><sup data-citation-sup="true" id="c1">1</sup> after</p>`;
    const original = container.innerHTML;
    const citation = container.querySelector('#c1') as HTMLElement;

    const clear = highlightCitedRange(1, citation, container, 'yellow');

    const painted = [...container.querySelectorAll<HTMLElement>('[style*="yellow"]')].map(
      (element) => element.textContent
    );
    expect(painted).toEqual(['cited ', 'text', 'text']);
    expect(citation.style.backgroundColor).toBe('');

    clear?.();
    expect(container.innerHTML).toBe(original);
  });

  it('does nothing without a start marker for the id', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p>text<sup id="c2">2</sup></p>';

    expect(
      highlightCitedRange(2, container.querySelector('#c2') as HTMLElement, container, 'yellow')
    ).toBeUndefined();
  });
});
