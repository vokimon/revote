import { defineConfig } from 'vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  root: 'src',
  base: '/revote/',
  plugins: [yaml()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 1,
            },
            {
              test: /\/src\/data\//,
              name: id => {
                const match = id.match(/\/src\/data\/[^A-Z]*([A-Z][^-]*)-/);
                return match ? `scenarios-${match[1]}` : 'scenarios-other';
              },
            },
          ],
        },
      },
    },
  },
});
