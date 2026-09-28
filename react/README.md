# React components

Source for blocks whose UI is written in React. This folder is not served (see `.hlxignore`).

Components use the React API (`react`, `react-dom/client`) and are compiled with
[Preact](https://preactjs.com/) (`preact/compat`), so each bundle stays small (the credit
simulator is about 9 KB gzipped).

## Build

```sh
npm run build:react
```

This writes one ES module per app into its block folder (for example
`blocks/credit-simulator/credit-simulator-app.min.js`). Commit the built file: Edge Delivery
Services serves the repository as is, without a build step.

## Adding a component

1. Create `react/<name>/index.jsx` that exports `mount(container, props)`.
2. Add it to the `apps` list in `react/build.mjs`, with the output in `blocks/<name>/`.
3. In `blocks/<name>/<name>.js`, read the authored content, then
   `import('./<name>-app.min.js')` and call `mount`.
4. Keep these blocks out of the first section of a page, so React is not needed for LCP.
