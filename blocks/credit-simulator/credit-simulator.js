import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Reads a number from the block config, accepting a decimal comma (9,5).
 * @param {object} config The block config
 * @param {string} key The config key
 * @param {number} fallback Value used when the field is empty or invalid
 * @returns {number} the value
 */
function num(config, key, fallback) {
  const value = parseFloat(String(config[key] ?? '').replace(',', '.'));
  return Number.isNaN(value) ? fallback : value;
}

/**
 * Builds consistent slider limits, whatever the author typed.
 * @returns {{min: number, max: number, step: number, initial: number}}
 */
function limits(min, max, step, initial) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return {
    min: lo,
    max: hi,
    step: step > 0 ? step : 1,
    initial: Math.min(Math.max(initial, lo), hi),
  };
}

/**
 * loads and decorates the credit simulator block
 * The simulator itself is a React component (see /react/credit-simulator), bundled into
 * credit-simulator-app.min.js with `npm run build:react`.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const props = {
    title: config.title || '',
    rate: num(config, 'rate', 0),
    fee: num(config, 'fee', 0),
    amount: limits(
      num(config, 'minamount', 1000),
      num(config, 'maxamount', 75000),
      num(config, 'amountstep', 500),
      num(config, 'defaultamount', 10000),
    ),
    term: limits(
      num(config, 'minterm', 12),
      num(config, 'maxterm', 120),
      num(config, 'termstep', 6),
      num(config, 'defaultterm', 60),
    ),
    ctaText: config.buttonlabel || '',
    ctaLink: config.buttonlink || '',
    disclaimer: config.disclaimer || '',
  };

  const container = document.createElement('div');
  block.replaceChildren(container);
  const { default: mount } = await import('./credit-simulator-app.min.js');
  mount(container, props);
}
