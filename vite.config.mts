import { defineConfig, mergeConfig } from 'vite';
import { baseConfig } from '@nativescript/vite/base';
import { protect, restore } from './postcss-masonkit.mjs';
import { masonkitSingleInstance } from './masonkit-hmr.mjs';
import { escapedSelectorCommas } from './postcss-selector-commas.mjs';
import { stableActivityChunk } from './android-workarounds.mjs';
import { nativescriptSvelte } from './svelte-plugin.mjs';
import svelteConfig from './svelte.config.mjs';

export default defineConfig(({ mode }) =>
  mergeConfig(baseConfig({ mode, flavor: 'svelte' }), {
    plugins: [nativescriptSvelte(svelteConfig), masonkitSingleInstance(), stableActivityChunk()],
    resolve: {
      // MasonKit's Svelte integration imports `svelte-native`, the package's
      // old name. Both names must load the same module, or MasonKit registers
      // its elements with a copy svelte-native never reads.
      alias: [{ find: /^svelte-native(?=\/|$)/, replacement: '@nativescript-community/svelte-native' }],
    },
    optimizeDeps: {
      exclude: [
        // Shares its element registry with MasonKit's Svelte integration, so
        // both must come from one copy.
        '@nativescript-community/svelte-native',
        // MasonKit must load as a single instance over the HMR server. If Vite
        // pre-bundles a subpath (e.g. `/svelte`), that copy is routed to the
        // vendor bundle, where MasonKit is deliberately absent, and its exports
        // come back undefined.
        '@triniwiz/nativescript-masonkit',
        '@triniwiz/nativescript-masonkit/svelte',
        '@triniwiz/nativescript-masonkit/web',
        '@triniwiz/nativescript-masonkit/elements',
      ],
    },
    css: {
      postcss: {
        // Lets Tailwind layout utilities (flex, grid, gap, max-w, ...) reach
        // MasonKit views instead of being stripped for core layouts, and keeps
        // classes with commas in them, like `grid-cols-[repeat(...,...)]`.
        plugins: [protect(), restore(), escapedSelectorCommas()],
      },
    },
  }),
);
