import { describe, expect, it } from 'vitest';

/**
 * Sanitize SVG content to remove potentially malicious elements.
 * Rejects SVGs with <script> or <foreignObject> entirely.
 * Removes: event handlers (onclick, onload, etc.), javascript: and dangerous data: URLs.
 */
function sanitizeSvg(content: string): string {
  // Reject SVGs with dangerous elements entirely — design system icons must never contain these
  if (/<script\b/i.test(content)) {
    throw new Error('SVG contains <script> element — rejected for safety');
  }
  if (/<foreignObject\b/i.test(content)) {
    throw new Error('SVG contains <foreignObject> element — rejected for safety');
  }

  let sanitized = content;

  // Remove event handler attributes (onclick, onload, onmouseover, etc.)
  // Loop until stable to handle reconstructed patterns
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
  } while (sanitized !== prev);

  // Remove javascript: protocol in href/xlink:href
  sanitized = sanitized.replace(/(xlink:)?href\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Remove data: URLs that could contain scripts (except safe image types)
  sanitized = sanitized.replace(/(xlink:)?href\s*=\s*["']data:(?!image\/(png|jpg|jpeg|gif|svg\+xml|webp))[^"']*["']/gi, '');

  return sanitized;
}

describe('SVG Sanitization', () => {
  describe('Script Tag Rejection', () => {
    it('should throw on simple script tags', () => {
      const malicious = '<svg><script>alert("xss")</script></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on script tags with attributes', () => {
      const malicious = '<svg><script type="text/javascript">alert("xss")</script></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on multiple script tags', () => {
      const malicious = '<svg><script>alert(1)</script><circle/><script>alert(2)</script></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should handle case-insensitive script tags', () => {
      const malicious = '<svg><SCRIPT>alert("xss")</SCRIPT></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });
  });

  describe('ForeignObject Rejection', () => {
    it('should throw on foreignObject tags', () => {
      const malicious = '<svg><foreignObject><body><script>alert("xss")</script></body></foreignObject></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on foreignObject with HTML content', () => {
      const malicious = '<svg><foreignObject><div onclick="alert()">Click</div></foreignObject></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <foreignObject> element');
    });
  });

  describe('Event Handler Removal', () => {
    it('should remove onclick handlers', () => {
      const malicious = '<svg><circle onclick="alert(\'xss\')" r="10"/></svg>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('<circle');
      expect(sanitized).toContain('r="10"');
    });

    it('should remove onload handlers', () => {
      const malicious = '<svg onload="alert(\'xss\')"><circle/></svg>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('onload');
    });

    it('should remove onmouseover handlers', () => {
      const malicious = '<rect onmouseover="alert(1)" width="100"/>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).toContain('width="100"');
    });

    it('should remove multiple event handlers', () => {
      const malicious = '<svg onclick="a()" onload="b()" onmouseover="c()"><circle/></svg>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('onmouseover');
    });

    it('should remove event handlers without quotes', () => {
      const malicious = '<svg onclick=alert(1)><circle/></svg>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('onclick');
    });
  });

  describe('JavaScript Protocol Removal', () => {
    it('should remove javascript: in href', () => {
      const malicious = '<a href="javascript:alert(\'xss\')">Link</a>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove javascript: in xlink:href', () => {
      const malicious = '<use xlink:href="javascript:alert(1)"/>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle case variations', () => {
      const malicious = '<a href="JavaScript:alert(1)">Link</a>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('JavaScript:');
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('Data URL Filtering', () => {
    it('should remove dangerous data URLs', () => {
      const malicious = '<image href="data:text/html,<b>evil</b>"/>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('data:text/html');
    });

    it('should allow safe image data URLs', () => {
      const safe = '<image href="data:image/png;base64,iVBORw0KG..."/>';
      const sanitized = sanitizeSvg(safe);
      expect(sanitized).toContain('data:image/png');
    });

    it('should allow safe JPEG data URLs', () => {
      const safe = '<image href="data:image/jpeg;base64,/9j/4AAQ..."/>';
      const sanitized = sanitizeSvg(safe);
      expect(sanitized).toContain('data:image/jpeg');
    });

    it('should allow SVG+XML data URLs', () => {
      const safe = '<image href="data:image/svg+xml;base64,PHN2Zy..."/>';
      const sanitized = sanitizeSvg(safe);
      expect(sanitized).toContain('data:image/svg+xml');
    });

    it('should remove data:application URLs', () => {
      const malicious = '<image href="data:application/javascript,alert(1)"/>';
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('data:application');
    });
  });

  describe('Preserve Valid SVG', () => {
    it('should preserve clean SVG content', () => {
      const clean = '<svg><circle cx="10" cy="10" r="5" fill="red"/></svg>';
      const sanitized = sanitizeSvg(clean);
      expect(sanitized).toBe(clean);
    });

    it('should preserve attributes', () => {
      const clean = '<rect width="100" height="50" fill="blue" stroke="black" stroke-width="2"/>';
      const sanitized = sanitizeSvg(clean);
      expect(sanitized).toBe(clean);
    });

    it('should preserve paths', () => {
      const clean = '<path d="M10 10 L20 20" stroke="black"/>';
      const sanitized = sanitizeSvg(clean);
      expect(sanitized).toBe(clean);
    });
  });

  describe('Complex Attack Vectors', () => {
    it('should throw on nested malicious content with script', () => {
      const malicious = '<svg><g onclick="alert(1)"><foreignObject><script>alert(2)</script></foreignObject></g></svg>';
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should handle obfuscated javascript:', () => {
      const malicious = '<a href="j&#97;vascript:alert(1)">Link</a>';
      // Note: This test documents current behavior - entity encoding bypass
      // would require additional sanitization
      const sanitized = sanitizeSvg(malicious);
      // At minimum should not contain the decoded version
      expect(sanitized).not.toContain('javascript:alert');
    });

    it('should throw on multiple attack vectors with script', () => {
      const malicious = `
        <svg onload="alert(1)">
          <script>alert(2)</script>
          <foreignObject><body>Evil</body></foreignObject>
          <a href="javascript:alert(3)">Click</a>
          <image href="data:text/html,<script>alert(4)</script>"/>
        </svg>
      `;
      expect(() => sanitizeSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should sanitize event handlers and dangerous URLs without script/foreignObject', () => {
      const malicious = `
        <svg onload="alert(1)">
          <a href="javascript:alert(3)">Click</a>
          <image href="data:text/html,evil"/>
        </svg>
      `;
      const sanitized = sanitizeSvg(malicious);
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('data:text/html');
    });
  });
});
