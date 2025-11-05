import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ApAutopilotChat',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
  },
});
