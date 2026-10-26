import { defineConfig } from 'vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  root: 'src',
  plugins: [yaml()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});

