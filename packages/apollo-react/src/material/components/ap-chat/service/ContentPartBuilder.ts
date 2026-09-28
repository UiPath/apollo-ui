import type { ContentPart, ContentPartChunk, PdfCitation, UrlCitation } from './ChatModel';

/**
 * Utility class for building and accumulating ContentParts from streaming chunks
 */
export class ContentPartBuilder {
  private _parts: Map<number, ContentPart> = new Map();
  private _citationIdMap: Map<string, number> = new Map();
  private _nextCitationId: number = 1;

  /**
   * Adds a ContentPartChunk to the builder
   * @param chunk - The chunk to add
   */
  addChunk(chunk: ContentPartChunk): void {
    if (!this._parts.has(chunk.index)) {
      this._parts.set(chunk.index, {
        text: '',
        citations: [],
      });
    }

    const part = this._parts.get(chunk.index)!;

    // Append text if provided
    if (chunk.text !== undefined) {
      part.text = (part.text ?? '') + chunk.text;
    }

    // Add citation if provided
    if (chunk.citation) {
      if (!part.citations) {
        part.citations = [];
      }

      // Assign ID to citation if not present and normalize
      const normalizedCitation = this.normalizeCitation(chunk.citation);
      part.citations.push(normalizedCitation);
    }
  }

  /**
   * Gets the current content parts as an array sorted by index
   * @returns Array of ContentParts
   */
  getContentParts(): ContentPart[] {
    return Array.from(this._parts.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, part]) => part);
  }

  /**
   * Normalizes a citation by ensuring it has a unique ID
   * @private
   */
  private normalizeCitation(citation: UrlCitation | PdfCitation): UrlCitation | PdfCitation {
    // If citation already has an ID, use it
    if (citation.id) {
      return citation;
    }

    // Generate unique ID based on title to avoid duplicates
    const citationKey = citation.title;
    if (this._citationIdMap.has(citationKey)) {
      return {
        ...citation,
        id: this._citationIdMap.get(citationKey)!,
      };
    }

    // Assign new ID
    const newId = this._nextCitationId++;
    this._citationIdMap.set(citationKey, newId);

    return {
      ...citation,
      id: newId,
    };
  }
}
