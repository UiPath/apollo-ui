import {
  cpSync,
  existsSync,
  readdirSync,
  statSync,
} from 'fs';
import {
  dirname,
  join,
} from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(__dirname);

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
                cpSync(srcLocales, distLocales, { recursive: true });
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
