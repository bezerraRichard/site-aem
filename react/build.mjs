// Bundles the React components in this folder into self-contained ES modules served by the blocks.
// React code is written against the React API and compiled with Preact (preact/compat) for size.
// Usage: npm run build:react
// eslint-disable-next-line import/no-extraneous-dependencies -- build-time tool
import { build } from 'esbuild';

const apps = [
  { entry: 'react/credit-simulator/index.jsx', out: 'blocks/credit-simulator/credit-simulator-app.min.js' },
];

await Promise.all(apps.map(({ entry, out }) => build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react-dom/client': 'preact/compat/client',
    'react/jsx-runtime': 'preact/jsx-runtime',
  },
  legalComments: 'none',
  logLevel: 'info',
})));
