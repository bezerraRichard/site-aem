export default function decorate(block) {
  const [quoteWrapper] = block.children;
  if (!quoteWrapper) return;

  // keep the authored rich text (paragraphs, links, emphasis) inside the blockquote
  const blockquote = document.createElement('blockquote');
  const quoteCell = quoteWrapper.firstElementChild || quoteWrapper;
  blockquote.append(...quoteCell.childNodes);
  quoteWrapper.replaceChildren(blockquote);
}
