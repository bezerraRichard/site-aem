import { toClassName } from '../../scripts/aem.js';

// approved domains; keep in sync with frame-src in the Content-Security-Policy of head.html
const ALLOWED_HOSTS = ['srv.novobanco.pt'];

// page in AEM where admins switch approved domains on or off without a deploy
const CONFIG_PATH = '/webview-dominios.plain.html';

const HEIGHTS = ['400', '600', '800'];
const DEFAULT_HEIGHT = '600';

const isAuthoring = () => window.location.hostname.endsWith('.adobeaemcloud.com');

let activeHosts;

/**
 * Reads which approved domains are switched on in the config page.
 * The config can only narrow the approved list; without a config page every approved domain is on.
 * @returns {Promise<string[]>} the domains that can be embedded
 */
function getActiveHosts() {
  if (!activeHosts) {
    activeHosts = fetch(CONFIG_PATH)
      .then((resp) => (resp.ok ? resp.text() : null))
      .then((html) => {
        if (!html) return ALLOWED_HOSTS;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const on = [...doc.querySelectorAll('.table > div')]
          .map((row) => [...row.children].map((cell) => cell.textContent.trim().toLowerCase()))
          .filter(([host, active]) => host && (!active || /^(sim|yes|true|ativo)$/.test(active)))
          .map(([host]) => host);
        return ALLOWED_HOSTS.filter((host) => on.includes(host));
      })
      .catch(() => ALLOWED_HOSTS);
  }
  return activeHosts;
}

/**
 * Reads the key-value rows of the block into a map of key to value cell.
 * @param {Element} block The block element
 * @returns {Object<string, Element>} the value cells by key
 */
function readCells(block) {
  const cells = {};
  [...block.children].forEach((row) => {
    const [key, value] = row.children;
    if (key && value) cells[toClassName(key.textContent)] = value;
  });
  return cells;
}

/**
 * Parses the authored address; only https URLs are accepted.
 * @param {string} text The authored address
 * @returns {URL|null} the URL, or null when invalid
 */
function parseUrl(text) {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Builds the fallback shown when the page cannot be embedded.
 * @param {Element} cell The authored fallback cell
 * @param {string} message A note for authors, only shown in the editor
 * @returns {Element} the fallback element
 */
function buildFallback(cell, message) {
  const fallback = document.createElement('div');
  fallback.className = 'web-view-fallback';
  if (isAuthoring() && message) {
    const note = document.createElement('p');
    note.className = 'web-view-note';
    note.textContent = message;
    fallback.append(note);
  }
  if (cell) fallback.append(...cell.childNodes);
  return fallback;
}

/**
 * Replaces the block content with the fallback, or hides the block when there is nothing to show.
 * @param {Element} block The block element
 * @param {Element} cell The authored fallback cell
 * @param {string} message A note for authors, only shown in the editor
 */
function showFallback(block, cell, message) {
  const fallback = buildFallback(cell, message);
  block.replaceChildren(fallback);
  if (!fallback.textContent.trim()) block.hidden = true;
}

/**
 * loads and decorates the web view block
 * Shows a page from an approved domain in an iframe.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const cells = readCells(block);
  const srcCell = cells.src;
  const url = parseUrl(srcCell?.querySelector('a')?.href || srcCell?.textContent || '');
  const title = cells.title?.textContent.trim() || 'Conteúdo incorporado';
  const height = HEIGHTS.find((h) => h === cells.height?.textContent.trim()) || DEFAULT_HEIGHT;

  if (!url) {
    showFallback(block, cells.fallback, 'Web View: indique um endereço https válido.');
    return;
  }

  const hosts = await getActiveHosts();
  if (!hosts.includes(url.hostname)) {
    showFallback(block, cells.fallback, `Web View: o domínio ${url.hostname} não está autorizado. Domínios ativos: ${hosts.join(', ') || 'nenhum'}.`);
    return;
  }

  const frame = document.createElement('iframe');
  frame.src = url.href;
  frame.title = title;
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  block.style.setProperty('--web-view-height', `${height}px`);

  // the embedded server may refuse framing, so always offer the page in a new window
  const open = document.createElement('p');
  open.className = 'web-view-open';
  const link = document.createElement('a');
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Abrir numa nova janela';
  open.append(link);

  block.replaceChildren(frame, open);
}
