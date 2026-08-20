import { describe, expect, it } from 'vitest';

/**
 * Validate SVG content by rejecting files that contain potentially malicious elements.
 * Design system icons must never contain scripts, event handlers, or dangerous URLs.
 * Throws an error if any dangerous content is detected.
 *
 * This is a standalone copy of the production validateSvg function from update-colors.ts
 * for unit testing purposes.
 */
function validateSvg(content: string): void {
  if (/<script\b/i.test(content)) {
    throw new Error('SVG contains <script> element — rejected for safety');
  }
  if (/<foreignObject\b/i.test(content)) {
    throw new Error('SVG contains <foreignObject> element — rejected for safety');
  }
  if (/\s+on\w+\s*=/i.test(content)) {
    throw new Error('SVG contains event handler attribute — rejected for safety');
  }
  if (/(xlink:)?href\s*=\s*["']javascript:/i.test(content)) {
    throw new Error('SVG contains javascript: URL — rejected for safety');
  }
  if (/(xlink:)?href\s*=\s*["']data:(?!image\/(png|jpg|jpeg|gif|svg\+xml|webp))/i.test(content)) {
    throw new Error('SVG contains unsafe data: URL — rejected for safety');
  }
}

describe('SVG Validation', () => {
  describe('Script Tag Rejection', () => {
    it('should throw on simple script tags', () => {
      const malicious = '<svg><script>alert("xss")</script></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on script tags with attributes', () => {
      const malicious = '<svg><script type="text/javascript">alert("xss")</script></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on multiple script tags', () => {
      const malicious = '<svg><script>alert(1)</script><circle/><script>alert(2)</script></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should handle case-insensitive script tags', () => {
      const malicious = '<svg><SCRIPT>alert("xss")</SCRIPT></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
    });
  });

  describe('ForeignObject Rejection', () => {
    it('should throw on foreignObject tags', () => {
      const malicious = '<svg><foreignObject><body><script>alert("xss")</script></body></foreignObject></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on foreignObject with HTML content', () => {
      const malicious = '<svg><foreignObject><div onclick="alert()">Click</div></foreignObject></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <foreignObject> element');
    });
  });

  describe('Event Handler Rejection', () => {
    it('should throw on onclick handlers', () => {
      const malicious = '<svg><circle onclick="alert(\'xss\')" r="10"/></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains event handler attribute');
    });

    it('should throw on onload handlers', () => {
      const malicious = '<svg onload="alert(\'xss\')"><circle/></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains event handler attribute');
    });

    it('should throw on onmouseover handlers', () => {
      const malicious = '<rect onmouseover="alert(1)" width="100"/>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains event handler attribute');
    });

    it('should throw on multiple event handlers', () => {
      const malicious = '<svg onclick="a()" onload="b()" onmouseover="c()"><circle/></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains event handler attribute');
    });

    it('should throw on event handlers without quotes', () => {
      const malicious = '<svg onclick=alert(1)><circle/></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains event handler attribute');
    });
  });

  describe('JavaScript Protocol Rejection', () => {
    it('should throw on javascript: in href', () => {
      const malicious = '<a href="javascript:alert(\'xss\')">Link</a>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains javascript: URL');
    });

    it('should throw on javascript: in xlink:href', () => {
      const malicious = '<use xlink:href="javascript:alert(1)"/>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains javascript: URL');
    });

    it('should handle case variations', () => {
      const malicious = '<a href="JavaScript:alert(1)">Link</a>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains javascript: URL');
    });
  });

  describe('Data URL Filtering', () => {
    it('should throw on dangerous data URLs', () => {
      const malicious = '<image href="data:text/html,<b>evil</b>"/>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains unsafe data: URL');
    });

    it('should allow safe image data URLs', () => {
      const safe = '<image href="data:image/png;base64,iVBORw0KG..."/>';
      expect(() => validateSvg(safe)).not.toThrow();
    });

    it('should allow safe JPEG data URLs', () => {
      const safe = '<image href="data:image/jpeg;base64,/9j/4AAQ..."/>';
      expect(() => validateSvg(safe)).not.toThrow();
    });

    it('should allow SVG+XML data URLs', () => {
      const safe = '<image href="data:image/svg+xml;base64,PHN2Zy..."/>';
      expect(() => validateSvg(safe)).not.toThrow();
    });

    it('should throw on data:application URLs', () => {
      const malicious = '<image href="data:application/javascript,alert(1)"/>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains unsafe data: URL');
    });
  });

  describe('Preserve Valid SVG', () => {
    it('should not throw on clean SVG content', () => {
      const clean = '<svg><circle cx="10" cy="10" r="5" fill="red"/></svg>';
      expect(() => validateSvg(clean)).not.toThrow();
    });

    it('should not throw on valid attributes', () => {
      const clean = '<rect width="100" height="50" fill="blue" stroke="black" stroke-width="2"/>';
      expect(() => validateSvg(clean)).not.toThrow();
    });

    it('should not throw on paths', () => {
      const clean = '<path d="M10 10 L20 20" stroke="black"/>';
      expect(() => validateSvg(clean)).not.toThrow();
    });
  });

  describe('Complex Attack Vectors', () => {
    it('should throw on nested malicious content with script', () => {
      const malicious = '<svg><g onclick="alert(1)"><foreignObject><script>alert(2)</script></foreignObject></g></svg>';
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
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
      expect(() => validateSvg(malicious)).toThrow('SVG contains <script> element');
    });

    it('should throw on event handlers and dangerous URLs without script/foreignObject', () => {
      const malicious = `
        <svg onload="alert(1)">
          <a href="javascript:alert(3)">Click</a>
          <image href="data:text/html,evil"/>
        </svg>
      `;
      expect(() => validateSvg(malicious)).toThrow('SVG contains event handler attribute');
    });
  });
});
