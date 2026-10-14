import { typescript } from './svelte-plugin.mjs';

// Read by svelte-plugin.mjs (through vite.config.mts) and by svelte-check.
export default {
  preprocess: typescript(),
  compilerOptions: {
    // Elements are native views, not HTML: attributes are passed through as
    // view properties, unchanged, and whitespace between elements is dropped
    // instead of becoming text.
    namespace: 'foreign',
    // Component styles are added to the app's CSS when the component loads.
    css: 'injected',
  },
};
