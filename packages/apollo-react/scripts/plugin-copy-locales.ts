import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import {
  dirname,
  join,
} from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(__dirname);

/**
 * Convert CommonJS locale module to ESM format
 * From: module.exports={messages:JSON.parse("{...}")};
 * To: export default {messages:JSON.parse("{...}")};
 */
function convertToESM(content: string): string {
  return content.replace(/module\.exports\s*=\s*/, 'export default ');
}

export function pluginCopyLocales() {
  return {
    name: 'plugin-copy-locales',
    setup(api) {
      api.onAfterBuild(() => {
        const srcDir = join(packageRoot, 'src');
        const distDir = join(packageRoot, 'dist');

        function findAndCopyLocales(dir: string, basePath = '') {
          for (const entry of readdirSync(dir)) {
            const fullPath = join(dir, entry);
            const relativePath = join(basePath, entry);

            if (entry === 'locales') {
              const srcLocales = fullPath;
              const distLocales = join(distDir, relativePath);

              if (existsSync(srcLocales)) {
                // Ensure dist directory exists
                mkdirSync(distLocales, { recursive: true });

                // Process each locale file
                const files = readdirSync(srcLocales);
                for (const file of files) {
                  if (file.endsWith('.js')) {
                    const srcFile = join(srcLocales, file);
                    const content = readFileSync(srcFile, 'utf-8');

                    // Write .cjs (CommonJS format)
                    const cjsFile = join(distLocales, file.replace('.js', '.cjs'));
                    writeFileSync(cjsFile, content, 'utf-8');

                    // Write .js (ESM format)
                    const esmFile = join(distLocales, file);
                    const esmContent = convertToESM(content);
                    writeFileSync(esmFile, esmContent, 'utf-8');
                  } else if (file.endsWith('.json')) {
                    // Copy JSON files as-is
                    const srcFile = join(srcLocales, file);
                    const destFile = join(distLocales, file);
                    const content = readFileSync(srcFile, 'utf-8');
                    writeFileSync(destFile, content, 'utf-8');
                  }
                }

                console.log(`✓ Copied locales: ${relativePath}`);
              }
            } else if (statSync(fullPath).isDirectory()) {
              findAndCopyLocales(fullPath, relativePath);
            }
          }
        }

        findAndCopyLocales(srcDir);
      });
    },
  };
}
