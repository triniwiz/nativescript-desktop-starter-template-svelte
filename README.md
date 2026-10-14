# NativeScript Desktop Starter (Svelte)

A Svelte starter that runs on Windows, iOS and Android. Layout uses
[MasonKit](https://github.com/triniwiz/nativescript-mason) (Flexbox, CSS Grid
and HTML-style elements), and styling uses Tailwind CSS v4. Svelte renders
through [Svelte Native](https://github.com/nativescript-community/svelte-native),
so you write ordinary Svelte components: `<div class="flex gap-4">`,
`<button on:tap={…}>`.

This is the Svelte version of
[nativescript-desktop-starter-template](https://github.com/triniwiz/nativescript-desktop-starter-template)
(NativeScript-Vue). The screens are the same.

## Prerequisites

> NativeScript for Windows is in alpha. Expect rough edges.

To run on Windows you need the following. `npx ns doctor windows` checks them.

| Requirement | Notes |
| --- | --- |
| Windows 10 1809 (build 17763) or later | The app targets `net10.0-windows10.0.26100.0`, with a minimum of `10.0.17763.0`. |
| [Node.js](https://nodejs.org) LTS | Provides `npm` and `npx`. |
| [.NET 10 SDK](https://dotnet.microsoft.com/download) | The build runs `dotnet build`. Check it with `dotnet --version`. |
| Developer Mode | Settings → Privacy & security → For developers. Windows needs it to install and launch the unsigned debug build. |

For iOS and Android, follow the [NativeScript environment setup](https://docs.nativescript.org/setup/).

You don't need to install the NativeScript CLI globally. It's a dev dependency, and the npm scripts run it.

## Getting started

```bash
git clone https://github.com/triniwiz/nativescript-desktop-starter-template-svelte my-app
cd my-app
npm install
npm run windows   # or: npm run ios / npm run android
```

`npm run windows` builds the app, installs and launches it, then rebuilds and
restarts it as you save. `npm run clean` removes the build output, and
`npm run typecheck` runs `svelte-check`.

Use npm. `package.json` relies on npm `overrides`.

## Project layout

| Path | What it's for |
| --- | --- |
| `src/app.ts` | App entry. Turns on `View.preflight`, registers MasonKit's elements and starts Svelte Native with the home screen. |
| `src/app.css` | Tailwind, plus the `dark:`, `ios:`, `android:`, `windows:`, `phone:` and `tablet:` variants. |
| `src/components/Home.svelte` | The home screen. |
| `src/components/Playground.svelte` | Flexbox and Grid examples. |
| `svelte.config.mjs` | Svelte compiler options, used by the build and by `svelte-check`. |
| `svelte-plugin.mjs` | Compiles `.svelte` files for the Vite build (see [Temporary workarounds](#temporary-workarounds)). |
| `postcss-masonkit.mjs` | Keeps the Tailwind layout utilities (`flex`, `grid`, `gap-*`, `max-w-*`, `absolute`, ...) that NativeScript's Tailwind plugin would otherwise remove. |
| `android-workarounds.mjs` | Keeps Android rebuilds from loading a stale activity chunk (see [Temporary workarounds](#temporary-workarounds)). |

## Tips

- **Elements:** you can write `<div>`, `<section>`, `<h1>`, `<p>`, `<span>`,
  `<button>`, `<code>`, `<scroll>` and so on. The core NativeScript versions of
  `<button>`, `<span>` and `<label>` are available as `<nbutton>`, `<nspan>`
  and `<nlabel>`. Each screen's root element is a `<page>`.
- **Events:** `on:tap={…}` listens for a NativeScript `tap`, and any other
  `on:<event>` for the NativeScript event of that name (`on:loaded`). Events
  don't bubble.
- **Attributes** set the view property of the same name, so camelCase ones work
  as written: `<page actionBarHidden={true}>`.
- **Navigation:** `navigate({ page: Screen })` from
  `@nativescript-community/svelte-native` pushes a page, and `goBack()` pops it.
  A screen is destroyed when you navigate back from it, so `onDestroy` runs
  then.
- **Class names** must appear in full in your source so Tailwind can find them.
  Pick between complete strings (`'flex-row'`, `'flex-col'`) rather than
  building them (`` `flex-${dir}` ``), as the playground does.
- **Responsive layouts:** there are no `sm:` or `md:` breakpoints. Use layouts
  that fit the space they're given instead. They also reflow when the window
  is resized:

  ```svelte
  <div class="grid grid-cols-[repeat(auto-fill,minmax(240,1fr))] gap-4">…</div>
  <div class="flex flex-row flex-wrap gap-4"><div class="flex-1 basis-40">…</div></div>
  <main class="mx-auto w-full max-w-5xl px-5">…</main>
  ```

- **Units:** unitless values are dp, and `px` means physical pixels, so write
  arbitrary values without a unit, for example `auto-rows-[96]`.
- **Avoid** `tracking-*`, `leading-*` and `bg-linear-*`. For gradients, write
  a `@utility` instead, like `bg-hero` in `src/app.css`.
- **Keep** `@import 'tailwindcss/theme'` and `@import 'tailwindcss/utilities'`
  in `src/app.css`, not `@import 'tailwindcss'`. Tailwind's preflight would
  hide every view.

## Troubleshooting

- **Something's missing from your setup:** `npx ns doctor windows` lists what it can't find and how to fix it.
- **The app builds but won't launch** ("deployment failed"): turn on Developer Mode.
- **A stale or broken build:** run `npm run clean`, then `npm run windows` again.

## Known issues

- HMR is off: the npm scripts pass `--no-hmr`, so a save rebuilds the bundle
  and restarts the app. `@nativescript/vite` has no Svelte HMR support yet.
- Svelte Native runs on Svelte 4. Its Svelte 5 version is an alpha that needs an
  unreleased Svelte build, and MasonKit's Svelte integration targets Svelte 4.

## Temporary workarounds

These can be removed once the fixes are released:

- `@nativescript/core` and `@nativescript/vite` are installed through pkg.pr.new from
  [NativeScript/NativeScript#11468](https://github.com/NativeScript/NativeScript/pull/11468),
  which is the `feat/windows` branch plus percentage sizes inside MasonKit layouts.
- `@nativescript/windows` is pinned to an exact alpha, because a caret range
  would also match older, incompatible betas.
- `svelte-plugin.mjs` stands in for `@sveltejs/vite-plugin-svelte`, whose
  Svelte 4 versions only support Vite 5, while `@nativescript/vite` needs
  Vite 8. It strips TypeScript and compiles. It also collapses whitespace in
  text the way a browser would: Svelte leaves that to the browser, so native
  text would otherwise keep the line breaks and indentation of the source, and
  the `foreign` namespace would drop the space in `{a} {b}`.
- `vite.config.mts` aliases `svelte-native` to
  `@nativescript-community/svelte-native`. MasonKit's Svelte integration
  imports the old package name, and both names must load the same copy.
- `android-workarounds.mjs` names core's Android activity chunk without a
  hash. The generated Java activity loads it by the name it had at the last
  native build, so after a rebuild that renamed it, Android started the old
  chunk and crashed ("isEmbedded is not a function").
- `postcss-masonkit.mjs` also keeps `touch-action` and `:hover` rules, which
  `@nativescript/tailwind` strips even though MasonKit supports them.
- `masonkit-hmr.mjs` stops MasonKit from loading twice during HMR. It only
  runs on the dev server, so it does nothing until HMR is back on.
- `postcss-selector-commas.mjs` makes classes with a comma, like
  `grid-cols-[repeat(auto-fill,minmax(240,1fr))]`, match
  ([NativeScript/NativeScript#11463](https://github.com/NativeScript/NativeScript/pull/11463)).
