import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// footer fragment sections, in authoring order
const SECTION_NAMES = ['help', 'cards', 'partner', 'links', 'legal'];

/**
 * Wraps every heading and the content that follows it in a group
 * @param {Element} wrapper The default content wrapper of a section
 * @param {string} className Class name for each group
 */
function groupByHeading(wrapper, className) {
  const groups = [];
  [...wrapper.children].forEach((el) => {
    if (/^H[2-6]$/.test(el.tagName) || !groups.length) {
      const group = document.createElement('div');
      group.className = className;
      groups.push(group);
    }
    groups[groups.length - 1].append(el);
  });
  wrapper.replaceChildren(...groups);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  SECTION_NAMES.forEach((name, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${name}`);
  });

  const cards = footer.querySelector('.footer-cards .default-content-wrapper');
  if (cards) groupByHeading(cards, 'footer-card');

  const links = footer.querySelector('.footer-links .default-content-wrapper');
  if (links) groupByHeading(links, 'footer-column');

  block.append(footer);
}
