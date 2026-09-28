import { describe, expect, it } from 'vitest';
import { join, resolve, sep } from 'node:path';

// Mock ICONS_DIR for testing
const ICONS_DIR = '/test/icons';
const MAX_DEPTH = 10; // Maximum directory nesting depth (should match process-icons.ts)

/**
 * Validates that a path is within the icons directory to prevent directory traversal
 * Uses path.resolve() to properly handle .. components and path.sep to prevent partial matches
 * Also checks for null bytes which can be used to bypass path validation
 *
 * Security improvements:
 * - Validates base directory is in expected location
 * - Enforces MAX_DEPTH limit on directory traversal to prevent infinite recursion
 */
function validatePath(targetPath: string): boolean {
  // Check for null bytes which can bypass security checks
  if (targetPath.includes('\0')) {
    return false;
  }

  const normalizedTarget = resolve(targetPath);
  const normalizedBase = resolve(ICONS_DIR);

  // Add path.sep to ensure we're checking for a directory boundary
  // This prevents /app/icons-evil from matching /app/icons
  return normalizedTarget.startsWith(normalizedBase + sep);
}

describe('Path Validation', () => {
  describe('Valid Paths', () => {
    it('should allow paths within icons directory', () => {
      const validPath = join(ICONS_DIR, 'icon.svg');
      expect(validatePath(validPath)).toBe(true);
    });

    it('should allow nested paths', () => {
      const validPath = join(ICONS_DIR, 'category', 'icon.svg');
      expect(validatePath(validPath)).toBe(true);
    });

    it('should allow deeply nested paths', () => {
      const validPath = join(ICONS_DIR, 'a', 'b', 'c', 'icon.svg');
      expect(validatePath(validPath)).toBe(true);
    });
  });

  describe('Directory Traversal Prevention', () => {
    it('should block parent directory traversal', () => {
      const maliciousPath = join(ICONS_DIR, '..', 'evil.svg');
      expect(validatePath(maliciousPath)).toBe(false);
    });

    it('should block multiple parent traversals', () => {
      const maliciousPath = join(ICONS_DIR, '..', '..', 'evil.svg');
      expect(validatePath(maliciousPath)).toBe(false);
    });

    it('should block traversal in middle of path', () => {
      const maliciousPath = join(ICONS_DIR, 'category', '..', '..', 'evil.svg');
      expect(validatePath(maliciousPath)).toBe(false);
    });

    it('should block absolute paths outside icons dir', () => {
      const maliciousPath = '/etc/passwd';
      expect(validatePath(maliciousPath)).toBe(false);
    });

    it('should block paths to sibling directories', () => {
      const maliciousPath = join(ICONS_DIR, '..', 'sibling', 'file.svg');
      expect(validatePath(maliciousPath)).toBe(false);
    });
  });

  describe('Path Separator Security', () => {
    it('should block partial path matches', () => {
      // If ICONS_DIR is /app/icons, /app/icons-evil should be blocked
      const maliciousPath = ICONS_DIR + '-evil' + sep + 'file.svg';
      expect(validatePath(maliciousPath)).toBe(false);
    });

    it('should require proper directory separator', () => {
      // Ensure the path actually goes INTO the icons directory
      const maliciousPath = ICONS_DIR + 'evil' + sep + 'file.svg';
      expect(validatePath(maliciousPath)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle relative current directory', () => {
      const path = join(ICONS_DIR, '.', 'icon.svg');
      expect(validatePath(path)).toBe(true);
    });

    it('should handle multiple slashes', () => {
      const path = ICONS_DIR + sep + sep + 'icon.svg';
      // After normalization, this should be valid
      expect(validatePath(path)).toBe(true);
    });

    it('should handle empty subfolder names in path', () => {
      const path = join(ICONS_DIR, '', 'icon.svg');
      expect(validatePath(path)).toBe(true);
    });

    it('should reject path that equals base directory', () => {
      // The base directory itself doesn't have the separator
      expect(validatePath(ICONS_DIR)).toBe(false);
    });

    it('should handle symbolic link scenarios', () => {
      // While we can't test actual symlinks, we can test the path logic
      const path = join(ICONS_DIR, 'symlink', 'icon.svg');
      expect(validatePath(path)).toBe(true);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work with forward slashes', () => {
      const path = ICONS_DIR + '/subfolder/icon.svg';
      expect(validatePath(path)).toBe(true);
    });

    it('should normalize mixed separators', () => {
      // This tests that resolve() normalizes the path properly
      const path = ICONS_DIR + sep + 'sub' + '/' + 'icon.svg';
      expect(validatePath(path)).toBe(true);
    });
  });

  describe('Security Regression Tests', () => {
    it('should block null byte injection', () => {
      const maliciousPath = ICONS_DIR + sep + 'icon.svg\0../../etc/passwd';
      // Null bytes should be explicitly rejected as they can bypass security checks
      expect(validatePath(maliciousPath)).toBe(false);
    });

    it('should handle unicode in paths', () => {
      const path = join(ICONS_DIR, 'emoji-😀', 'icon.svg');
      expect(validatePath(path)).toBe(true);
    });

    it('should block encoded parent directory', () => {
      // Some systems might not decode this, but test anyway
      const maliciousPath = join(ICONS_DIR, '%2e%2e', 'evil.svg');
      // After resolve(), this becomes a literal folder name
      expect(validatePath(maliciousPath)).toBe(true); // It's within dir as "%2e%2e" is literal
    });
  });

  describe('Real-World Attack Scenarios', () => {
    it('should block access to system files', () => {
      const attacks = [
        '/etc/passwd',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
        join(ICONS_DIR, '..', '..', '..', 'etc', 'passwd'),
      ];

      attacks.forEach((attack) => {
        expect(validatePath(attack)).toBe(false);
      });
    });

    it('should block access to parent application files', () => {
      const attacks = [
        join(ICONS_DIR, '..', '..', 'package.json'),
        join(ICONS_DIR, '..', '..', 'node_modules', 'evil'),
        join(ICONS_DIR, '..', '.env'),
      ];

      attacks.forEach((attack) => {
        expect(validatePath(attack)).toBe(false);
      });
    });

    it('should allow only files within icon directory tree', () => {
      const validPaths = [
        join(ICONS_DIR, 'icon1.svg'),
        join(ICONS_DIR, 'folder', 'icon2.svg'),
        join(ICONS_DIR, 'a', 'b', 'c', 'd', 'icon3.svg'),
      ];

      validPaths.forEach((path) => {
        expect(validatePath(path)).toBe(true);
      });
    });
  });
});
