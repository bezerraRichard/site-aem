const METADATA_PREFIXES = /^(experiment|campaign|audience)/i;

/**
 * Checks if the page is rendered on the AEM author tier (Universal Editor).
 * Experiments are skipped there so authors always edit the page itself.
 * @returns {boolean} True on the author tier
 */
const isAuthoring = () => window.location.hostname.endsWith('.adobeaemcloud.com');

/**
 * Checks if experimentation is enabled.
 * Only pages with experiment, campaign or audience metadata load the plugin.
 * @returns {boolean} True if experimentation is enabled, false otherwise.
 */
const isExperimentationEnabled = () => document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"],[property^="campaign:"],[property^="audience:"]')
  || [...document.querySelectorAll('.section-metadata > div > div:first-child')]
    .some((key) => METADATA_PREFIXES.test(key.textContent.trim()));

/**
 * Loads the experimentation module (eager).
 * @param {Document} document The document object.
 * @param {Object} config The experimentation configuration.
 * @returns {Promise<void>} A promise that resolves when the experimentation module is loaded.
 */
export async function runExperimentation(document, config) {
  if (isAuthoring() || !isExperimentationEnabled()) {
    return null;
  }

  try {
    // eslint-disable-next-line import/no-relative-packages
    const { loadEager } = await import('../plugins/experimentation/src/index.js');
    return loadEager(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (eager):', error);
    return null;
  }
}

/**
 * Loads the experimentation simulation UI (lazy).
 * The simulation panel is an authoring aid, so this is a no-op in production.
 * @param {Document} document The document object.
 * @param {Object} config The experimentation configuration.
 * @returns {Promise<void>} A promise that resolves when the simulation UI is loaded.
 */
export async function runExperimentationLazy(document, config) {
  const { hostname } = window.location;
  const isPreview = hostname === 'localhost'
    || hostname.endsWith('.page')
    || (typeof config.isProd === 'function' && !config.isProd());
  if (isAuthoring() || !isPreview) {
    return null;
  }

  try {
    // eslint-disable-next-line import/no-relative-packages
    const { loadLazy } = await import('../plugins/experimentation/src/index.js');
    return loadLazy(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (lazy):', error);
    return null;
  }
}
