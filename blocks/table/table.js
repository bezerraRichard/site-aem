import { moveInstrumentation } from '../../scripts/scripts.js';

const isEmpty = (cell) => !cell || (!cell.textContent.trim() && !cell.querySelector('img, picture'));

/**
 * Finds the last heading in the default content right before the block, used to label the table.
 * @param {Element} block The block element
 * @returns {Element|null} the heading, if any
 */
function findLabel(block) {
  const prev = block.parentElement?.previousElementSibling;
  if (!prev?.classList.contains('default-content-wrapper')) return null;
  return [...prev.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop() || null;
}

/**
 * loads and decorates the table block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // authors fill only the columns they need, so drop columns that are empty in every row
  const width = Math.max(1, ...rows.map((row) => {
    const cells = [...row.children];
    let last = cells.length;
    while (last > 0 && isEmpty(cells[last - 1])) last -= 1;
    return last;
  }));

  const table = document.createElement('table');
  const hasHeader = !block.classList.contains('no-header') && rows.length > 1;
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, i) => {
    const header = hasHeader && i === 0;
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    const cells = [...row.children];
    for (let c = 0; c < width; c += 1) {
      const cell = cells[c];
      const td = document.createElement(header ? 'th' : 'td');
      if (header) td.scope = 'col';
      if (cell) {
        moveInstrumentation(cell, td);
        // a single paragraph reads better inline in a table cell
        const only = cell.children.length === 1 && cell.firstElementChild.tagName === 'P';
        td.append(...(only ? cell.firstElementChild.childNodes : cell.childNodes));
      }
      tr.append(td);
    }
    (header ? thead : tbody).append(tr);
  });

  if (hasHeader) table.append(thead);
  table.append(tbody);

  // wide tables scroll horizontally on small screens, so the region must be focusable
  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  const label = findLabel(block);
  if (label) {
    if (!label.id) label.id = `table-${Math.random().toString(36).slice(2, 8)}`;
    wrapper.setAttribute('aria-labelledby', label.id);
  } else {
    wrapper.setAttribute('aria-label', 'Tabela');
  }
  wrapper.append(table);
  block.replaceChildren(wrapper);
}
