// Search, tag filter and pagination for the articles page. Without JavaScript the
// page still lists every story, because this only ever hides things.
import { normalizeForSearch } from '../lib/search';

const PAGE_SIZE = 6;

function setUp(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-search]')!;
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-tag]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-article]')];
  const countLabel = root.querySelector<HTMLElement>('[data-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const pager = root.querySelector<HTMLElement>('[data-pager]')!;
  const previous = root.querySelector<HTMLButtonElement>('[data-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-next]')!;
  const pageLabel = root.querySelector<HTMLElement>('[data-page]')!;

  // The state lives in the URL, so results can be shared and survive the back button.
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') ?? '';
  const selected = new Set((params.get('tag') ?? '').split(',').filter(Boolean));
  let page = Math.max(1, Number(params.get('page')) || 1);

  const render = () => {
    const terms = normalizeForSearch(input.value).split(' ').filter(Boolean);
    const matches = cards.filter((card) => {
      const tags = (card.dataset.tags ?? '').split(' ');
      const text = card.dataset.text ?? '';
      return (selected.size === 0 || tags.some((tag) => selected.has(tag))) && terms.every((term) => text.includes(term));
    });

    const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const visible = new Set(matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    for (const card of cards) card.hidden = !visible.has(card);

    for (const chip of chips) chip.setAttribute('aria-pressed', String(selected.has(chip.dataset.tag!)));
    countLabel.textContent =
      matches.length === 1 ? root.dataset.countOne! : root.dataset.countOther!.replace('{n}', String(matches.length));
    empty.hidden = matches.length > 0;
    pager.hidden = pages === 1;
    previous.disabled = page === 1;
    next.disabled = page === pages;
    pageLabel.textContent = root.dataset.pageTemplate!.replace('{n}', String(page)).replace('{total}', String(pages));

    const query = new URLSearchParams();
    if (input.value) query.set('q', input.value);
    if (selected.size) query.set('tag', [...selected].join(','));
    if (page > 1) query.set('page', String(page));
    const search = query.toString();
    history.replaceState(history.state, '', search ? `?${search}` : location.pathname);
  };

  const resetAndRender = () => {
    page = 1;
    render();
  };

  input.addEventListener('input', resetAndRender);
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag!;
      if (!selected.delete(tag)) selected.add(tag);
      resetAndRender();
    });
  }
  const turn = (delta: number) => () => {
    page += delta;
    render();
    root.scrollIntoView({ behavior: 'smooth' });
  };
  previous.addEventListener('click', turn(-1));
  next.addEventListener('click', turn(1));

  render();
}

document.addEventListener('astro:page-load', () => {
  const root = document.querySelector<HTMLElement>('[data-articles]');
  if (root) setUp(root);
});
