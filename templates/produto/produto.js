/**
 * Splits the intro section into text and media columns when it has an image
 * @param {Element} intro The first section of the page
 */
function decorateIntro(intro) {
  intro.classList.add('produto-intro');
  const wrapper = intro.querySelector('.default-content-wrapper');
  const picture = wrapper?.querySelector('picture');
  if (!picture) return;

  const media = document.createElement('div');
  media.className = 'produto-intro-media';
  media.append(picture.closest('p') || picture);

  const text = document.createElement('div');
  text.className = 'produto-intro-text';
  text.append(...wrapper.childNodes);

  wrapper.append(text, media);
  intro.classList.add('produto-intro-has-media');
}

/**
 * Builds a bar with the product name and main call to action,
 * shown once the intro is scrolled out of view and hidden over the footer
 * @param {Element} main The main element
 * @param {Element} intro The first section of the page
 */
function buildStickyBar(main, intro) {
  const title = intro.querySelector('h1');
  const cta = intro.querySelector('a.button.primary');
  if (!title || !cta) return;

  const bar = document.createElement('aside');
  bar.className = 'produto-sticky';
  bar.setAttribute('aria-label', title.textContent.trim());

  const content = document.createElement('div');
  content.className = 'produto-sticky-content';
  const name = document.createElement('p');
  name.className = 'produto-sticky-title';
  name.textContent = title.textContent.trim();
  const link = cta.cloneNode(true);
  [...link.attributes]
    .filter(({ name: attr }) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-'))
    .forEach(({ name: attr }) => link.removeAttribute(attr));
  content.append(name, link);
  bar.append(content);
  main.append(bar);

  const state = { pastIntro: false, overFooter: false };
  const update = () => {
    const visible = state.pastIntro && !state.overFooter;
    bar.dataset.visible = visible;
    // keep the hidden bar out of the tab order and the accessibility tree
    bar.inert = !visible;
  };
  update();

  new IntersectionObserver(([entry]) => {
    state.pastIntro = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    update();
  }).observe(intro);

  const footer = document.querySelector('footer');
  if (footer) {
    new IntersectionObserver(([entry]) => {
      state.overFooter = entry.isIntersecting;
      update();
    }).observe(footer);
  }
}

/**
 * Decorates pages using the produto template
 * @param {Document} doc The document
 */
export default function decorate(doc) {
  const main = doc.querySelector('main');
  const intro = main?.querySelector('.section');
  if (!intro) return;
  decorateIntro(intro);
  buildStickyBar(main, intro);
}
