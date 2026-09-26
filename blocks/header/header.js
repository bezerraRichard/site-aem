import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

// nav fragment sections, in authoring order
const SECTION_NAMES = ['top', 'brand', 'sections', 'tools'];

/**
 * Collapses every dropdown in the nav sections, optionally keeping one open
 * @param {Element} navSections The nav sections element
 * @param {Element} [except] Toggle button to leave untouched
 */
function closeAllDropdowns(navSections, except = null) {
  if (!navSections) return;
  navSections.querySelectorAll('.nav-drop-toggle').forEach((toggle) => {
    if (toggle !== except) toggle.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Opens or closes the mobile menu
 * @param {Element} nav The nav element
 * @param {Boolean} [forceExpanded] Force the expanded state
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? forceExpanded
    : nav.getAttribute('aria-expanded') !== 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  button.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
  document.body.style.overflowY = expanded && !isDesktop.matches ? 'hidden' : '';
  if (!expanded) closeAllDropdowns(nav.querySelector('.nav-sections'));
}

/**
 * Turns the authored list items with a nested list into accessible dropdowns
 * @param {Element} navSections The nav sections element
 */
function decorateDropdowns(navSections) {
  const topItems = navSections.querySelectorAll(':scope .default-content-wrapper > ul > li');
  topItems.forEach((item, i) => {
    const panel = item.querySelector(':scope > ul');
    if (!panel) return;

    // everything before the nested list is the dropdown label
    const labelNodes = [...item.childNodes].filter((node) => node !== panel);
    const label = labelNodes.map((node) => node.textContent).join('').trim();
    labelNodes.forEach((node) => node.remove());

    panel.id = `nav-drop-${i}`;
    panel.classList.add('nav-drop-panel');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-drop-toggle';
    toggle.textContent = label;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panel.id);
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      closeAllDropdowns(navSections, toggle);
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });

    item.classList.add('nav-drop');
    item.prepend(toggle);

    // second level items with their own list are link groups with a title
    panel.querySelectorAll(':scope > li').forEach((group) => {
      const links = group.querySelector(':scope > ul');
      if (!links) return;
      const titleNodes = [...group.childNodes].filter((node) => node !== links);
      const title = document.createElement('p');
      title.className = 'nav-group-title';
      title.textContent = titleNodes.map((node) => node.textContent).join('').trim();
      titleNodes.forEach((node) => node.remove());
      group.classList.add('nav-group');
      group.prepend(title);
    });
  });
}

/**
 * Marks the utility bar segment matching the current page
 * @param {Element} navTop The nav top element
 */
function decorateTopBar(navTop) {
  const [segments, utility] = navTop.querySelectorAll(':scope .default-content-wrapper > ul');
  if (segments) segments.classList.add('nav-segments');
  if (utility) {
    utility.classList.add('nav-utility');
    // labels can be visually hidden on narrow desktops, leaving the icons
    utility.querySelectorAll('a').forEach((a) => {
      const label = document.createElement('span');
      label.className = 'nav-utility-label';
      [...a.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
        .forEach((node) => label.append(node));
      if (!label.textContent) return;
      a.title = a.title || label.textContent.trim();
      a.append(label);
    });
  }
  if (!segments) return;

  const { pathname } = window.location;
  const current = [...segments.querySelectorAll('a[href]')]
    .filter((a) => {
      const url = new URL(a.href, window.location);
      return url.origin === window.location.origin
        && url.pathname !== '/'
        && pathname.startsWith(url.pathname);
    })
    .sort((a, b) => b.pathname.length - a.pathname.length)[0];
  if (current) current.setAttribute('aria-current', 'page');
}

/**
 * Makes sure the logo is a single link without button styling
 * @param {Element} navBrand The nav brand element
 */
function decorateBrand(navBrand) {
  navBrand.querySelectorAll('.button').forEach((link) => {
    link.className = '';
    const wrapper = link.closest('.button-wrapper');
    if (wrapper) wrapper.className = '';
  });

  // an authored logo image followed by a link becomes one linked logo
  const picture = navBrand.querySelector('picture');
  const link = navBrand.querySelector('a[href]');
  if (picture && link && !link.contains(picture)) {
    const linkParagraph = link.closest('p');
    const pictureParagraph = picture.closest('p');
    const label = link.textContent.trim();
    (pictureParagraph || picture).before(link);
    link.replaceChildren(picture);
    if (label) link.setAttribute('aria-label', label);
    [pictureParagraph, linkParagraph].forEach((p) => {
      if (p && !p.textContent.trim() && !p.querySelector('picture')) p.remove();
    });
  }

  const img = navBrand.querySelector('img');
  if (img) {
    img.loading = 'eager';
    if (!img.alt) img.alt = 'novobanco';
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Principal');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  SECTION_NAMES.forEach((name, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${name}`);
  });

  const navTop = nav.querySelector('.nav-top');
  const navBrand = nav.querySelector('.nav-brand');
  const navSections = nav.querySelector('.nav-sections');
  const navTools = nav.querySelector('.nav-tools');

  if (navTop) decorateTopBar(navTop);
  if (navBrand) decorateBrand(navBrand);
  if (navSections) decorateDropdowns(navSections);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Abrir menu">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));

  // logo and call to actions share the same row
  const navMain = document.createElement('div');
  navMain.className = 'nav-main';
  navMain.append(hamburger);
  if (navBrand) navMain.append(navBrand);
  if (navTools) navMain.append(navTools);
  nav.insertBefore(navMain, navSections || null);

  // close dropdowns and the mobile menu with escape or when focus leaves the nav
  nav.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = nav.querySelector('.nav-drop-toggle[aria-expanded="true"]');
    if (open) {
      closeAllDropdowns(navSections);
      open.focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) closeAllDropdowns(navSections);
  });
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeAllDropdowns(navSections);
  });

  toggleMenu(nav, false);
  isDesktop.addEventListener('change', () => toggleMenu(nav, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
