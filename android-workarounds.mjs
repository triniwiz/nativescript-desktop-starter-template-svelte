/**
 * Keeps Android rebuilds from crashing with "isEmbedded is not a function".
 *
 * `@nativescript/vite` emits core's Android activity as its own chunk,
 * `activity.android-[hash].mjs`, and the static binding generator writes that
 * path into the generated Java activity when the app is built. A rebuild that
 * changes the hash leaves the Java side loading the old chunk, which is still
 * on the device and imports vendor exports that no longer exist. Naming the
 * chunk without a hash keeps the path stable, so rebuilds only update it.
 *
 * @returns {import('vite').Plugin}
 */
export function stableActivityChunk() {
  return {
    name: 'stable-android-activity-chunk',
    apply: 'build',
    outputOptions(options) {
      const original = options.chunkFileNames;
      return {
        ...options,
        chunkFileNames: (chunk) => {
          if (chunk.name?.startsWith('activity.android')) return '[name].mjs';
          return typeof original === 'function' ? original(chunk) : (original ?? '[name]-[hash].mjs');
        },
      };
    },
  };
}
