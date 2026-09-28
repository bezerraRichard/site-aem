import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Parses an authored number, accepting a decimal comma (4,5).
 * @param {string} text The authored value
 * @returns {number} the value, or NaN
 */
function parseValue(text) {
  return parseFloat(text.trim().replace(/\s/g, '').replace(',', '.'));
}

/**
 * loads and decorates the chart block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const percent = block.classList.contains('percent');
  const bars = [...block.children].map((row) => {
    const [labelCell, valueCell] = row.children;
    const valueText = valueCell?.textContent.trim() || '';
    return {
      row,
      label: labelCell?.textContent.trim() || '',
      valueText,
      value: parseValue(valueText),
    };
  }).filter(({ label, value }) => label && !Number.isNaN(value));

  const max = percent ? 100 : Math.max(...bars.map(({ value }) => value), 0);

  const list = document.createElement('ul');
  bars.forEach(({
    row, label, valueText, value,
  }) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const name = document.createElement('span');
    name.className = 'chart-label';
    name.textContent = label;

    const track = document.createElement('span');
    track.className = 'chart-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'chart-fill';
    const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
    fill.style.setProperty('--chart-ratio', ratio.toFixed(4));
    track.append(fill);

    const amount = document.createElement('span');
    amount.className = 'chart-value';
    amount.textContent = percent ? `${valueText}%` : valueText;

    li.append(name, track, amount);
    list.append(li);
  });

  block.replaceChildren(list);
}
