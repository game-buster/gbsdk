import { defineConfig } from 'tsup';

export default defineConfig({
  // Single UMD build - browser ready
  entry: ['src/index.ts'],
  format: ['iife'],
  minify: true,
  sourcemap: false,
  target: 'es2020',
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  globalName: 'GBSDK',
  platform: 'browser',
  treeshake: true,
  clean: true,
  dts: false, // No TypeScript definitions needed
  esbuildOptions: (options) => {
    options.banner = {
      js: '/* GBSDK v1.0.0 - Core Ads SDK | https://github.com/gamebuster/gbsdk */',
    };
  },
});
