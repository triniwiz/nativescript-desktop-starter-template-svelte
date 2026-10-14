import MagicString from 'magic-string';
import { compile, parse, preprocess, walk } from 'svelte/compiler';
import { transformWithOxc } from 'vite';

/**
 * Compiles `.svelte` files for svelte-native.
 *
 * svelte-native runs on Svelte 4, and `@sveltejs/vite-plugin-svelte` only
 * supports Svelte 4 on Vite 5, so it can't load alongside `@nativescript/vite`,
 * which needs Vite 8. This does the part an app needs: strip the types from
 * `<script lang="ts">`, collapse whitespace in text, then compile. There's no
 * component HMR; the app reloads on change instead.
 *
 * @param {{ preprocess?: import('svelte/compiler').PreprocessorGroup | import('svelte/compiler').PreprocessorGroup[], compilerOptions?: import('svelte/compiler').CompileOptions }} [config]
 *   The contents of svelte.config.mjs.
 * @returns {import('vite').Plugin}
 */
export function nativescriptSvelte({ preprocess: preprocessors = [], compilerOptions = {} } = {}) {
  let dev = false;

  return {
    name: 'nativescript-svelte',
    enforce: 'pre',
    configResolved(config) {
      dev = !config.isProduction;
    },
    async transform(code, id) {
      const filename = id.split('?')[0];
      if (!filename.endsWith('.svelte')) {
        return null;
      }

      const processed = await preprocess(code, [...[preprocessors].flat(), { markup: collapseWhitespace }], {
        filename,
      });

      const { js, warnings } = compile(processed.code, {
        ...compilerOptions,
        filename,
        dev,
        generate: 'dom',
        sourcemap: processed.map,
      });
      for (const warning of warnings) {
        this.warn({ message: warning.message, id: filename, loc: warning.start });
      }
      return { code: js.code, map: js.map };
    },
  };
}

/**
 * Strips the types from `<script lang="ts">`.
 *
 * @returns {import('svelte/compiler').PreprocessorGroup}
 */
export function typescript() {
  return { name: 'typescript', script: stripTypes };
}

/** @type {import('svelte/compiler').Preprocessor} */
async function stripTypes({ content, attributes, filename }) {
  if (attributes.lang !== 'ts') {
    return;
  }
  const result = await transformWithOxc(content, `${filename}.ts`, {
    lang: 'ts',
    // Imports only the markup uses look unused to TypeScript; keep them.
    typescript: { onlyRemoveTypeImports: true },
    sourcemap: true,
  });
  return { code: result.code, map: result.map };
}

/**
 * Svelte keeps text as written, line breaks and indentation included, and
 * leaves collapsing it to the browser. Native text views show it as is, so a
 * paragraph wrapped across lines in the source would keep its breaks. This
 * collapses each run of whitespace in template text to one space, like HTML.
 *
 * @type {import('svelte/compiler').MarkupPreprocessor}
 */
function collapseWhitespace({ content, filename }) {
  const { html } = parse(content, { filename });
  const s = new MagicString(content);
  // Text in attribute values, <pre> and <textarea> keeps its whitespace.
  const keeps = (node) =>
    node.type === 'Attribute' || (node.type === 'Element' && (node.name === 'pre' || node.name === 'textarea'));
  let kept = 0;
  walk(html, {
    enter(node, parent, _key, index) {
      if (keeps(node)) {
        kept++;
      } else if (node.type === 'Text' && kept === 0) {
        const raw = content.slice(node.start, node.end);
        let text = raw.replace(/\s+/g, ' ');
        // The `foreign` namespace drops whitespace-only text, which would join
        // `{a} {b}` into one word. An expression keeps the space.
        const siblings = parent?.children ?? [];
        if (text === ' ' && isTag(siblings[index - 1]) && isTag(siblings[index + 1])) {
          text = "{' '}";
        } else if (parent?.type === 'Element') {
          // Like a browser, ignore the space just inside an element's tags.
          if (index === 0) text = text.trimStart();
          if (index === siblings.length - 1) text = text.trimEnd();
        }
        if (text === '') {
          s.remove(node.start, node.end);
        } else if (text !== raw) {
          s.overwrite(node.start, node.end, text);
        }
      }
    },
    leave(node) {
      if (keeps(node)) {
        kept--;
      }
    },
  });
  return { code: s.toString(), map: s.generateMap({ hires: true, source: filename }) };
}

function isTag(node) {
  return node?.type === 'MustacheTag' || node?.type === 'RawMustacheTag';
}
