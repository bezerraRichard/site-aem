import { toClassName } from '../../scripts/aem.js';

// only loaders hosted by novobanco are allowed, so authors cannot add arbitrary scripts
const ALLOWED_SCRIPT_ORIGIN = 'https://srv.novobanco.pt';

// the novobanco loaders (external-index.js) only start on these hosts
const SUPPORTED_HOSTS = ['novobanco.pt', 'adobeaemcloud.com'];

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
 * Validates the authored loader URL.
 * @param {string} text The authored URL
 * @returns {string|null} the URL, or null when not allowed
 */
function loaderUrl(text) {
  try {
    const url = new URL(text.trim());
    if (url.origin !== ALLOWED_SCRIPT_ORIGIN || !url.pathname.endsWith('/external-index.js')) return null;
    return url.href;
  } catch {
    return null;
  }
}

const isSupportedHost = () => SUPPORTED_HOSTS
  .some((host) => window.location.hostname === host || window.location.hostname.endsWith(`.${host}`));

/**
 * loads and decorates the external app block
 * Embeds a React app deployed on srv.novobanco.pt through its external-index.js loader.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = readCells(block);
  const srcCell = cells.src;
  const src = loaderUrl(srcCell?.querySelector('a')?.href || srcCell?.textContent || '');
  const rootId = (cells.rootid?.textContent.trim() || 'root').replace(/[^\w-]/g, '') || 'root';

  const fallback = document.createElement('div');
  fallback.className = 'external-app-fallback';
  if (cells.fallback) fallback.append(...cells.fallback.childNodes);

  // the loader finds itself by id and the app renders into a fixed id, so only one app per page
  const alreadyUsed = document.getElementById('external-index') || document.getElementById(rootId);
  if (!src || !isSupportedHost() || alreadyUsed) {
    block.replaceChildren(fallback);
    return;
  }

  const root = document.createElement('div');
  root.id = rootId;
  root.className = 'external-app-root';
  block.replaceChildren(root);

  // the app is large, so load it only when the block gets close to the viewport
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    const script = document.createElement('script');
    script.id = 'external-index';
    script.src = src;
    script.addEventListener('error', () => block.replaceChildren(fallback));
    document.body.append(script);
  }, { rootMargin: '300px' });
  observer.observe(block);
}
