// Tag filter and lightbox for the gallery. Without JavaScript each picture is a plain
// link to its full-size file, and every picture stays visible.

function setUp(root: HTMLElement) {
  const items = [...root.querySelectorAll<HTMLAnchorElement>('[data-item]')];
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-tag]')];
  const clear = root.querySelector<HTMLButtonElement>('[data-clear]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const dialog = root.querySelector<HTMLDialogElement>('[data-lightbox]')!;
  const image = root.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
  const title = root.querySelector<HTMLElement>('[data-lightbox-title]')!;
  const caption = root.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const meta = root.querySelector<HTMLElement>('[data-lightbox-meta]')!;

  const selected = new Set((new URLSearchParams(location.search).get('tag') ?? '').split(',').filter(Boolean));
  let current = 0;

  const visibleItems = () => items.filter((item) => !item.hidden);

  const applyFilter = () => {
    for (const item of items) {
      const tags = (item.dataset.tags ?? '').split(' ');
      item.hidden = selected.size > 0 && !tags.some((tag) => selected.has(tag));
    }
    for (const chip of chips) chip.setAttribute('aria-pressed', String(selected.has(chip.dataset.tag!)));
    clear.setAttribute('aria-pressed', String(selected.size === 0));
    empty.hidden = visibleItems().length > 0;
    const query = selected.size ? `?tag=${[...selected].join(',')}` : location.pathname;
    history.replaceState(history.state, '', query);
  };

  const show = async (index: number) => {
    const list = visibleItems();
    current = (index + list.length) % list.length;
    const item = list[current];
    image.src = item.dataset.full!;
    image.alt = item.dataset.title!;
    title.textContent = item.dataset.title!;
    caption.textContent = item.dataset.caption!;
    meta.textContent = item.dataset.meta!;
    await image.decode().catch(() => {});
  };

  // The clicked thumbnail grows into the enlarged picture, where the browser can do it.
  // The big file is decoded first, so that the animation has nothing to wait for.
  const open = async (index: number) => {
    await show(index);
    const canAnimate = 'startViewTransition' in document && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canAnimate) return dialog.showModal();

    const thumbnail = visibleItems()[current].querySelector('img')!;
    const page = document.documentElement;
    thumbnail.style.viewTransitionName = 'photo';
    page.classList.add('enlarging');
    const transition = document.startViewTransition(() => {
      thumbnail.style.viewTransitionName = '';
      image.style.viewTransitionName = 'photo';
      dialog.showModal();
    });
    await transition.finished.catch(() => {});
    image.style.viewTransitionName = '';
    page.classList.remove('enlarging');
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag!;
      if (!selected.delete(tag)) selected.add(tag);
      applyFilter();
    });
  }
  clear.addEventListener('click', () => {
    selected.clear();
    applyFilter();
  });

  for (const item of items) {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      void open(visibleItems().indexOf(item));
    });
  }

  root.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());
  root.querySelector('[data-previous]')!.addEventListener('click', () => void show(current - 1));
  root.querySelector('[data-next]')!.addEventListener('click', () => void show(current + 1));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') void show(current - 1);
    if (event.key === 'ArrowRight') void show(current + 1);
  });

  applyFilter();
}

document.addEventListener('astro:page-load', () => {
  const root = document.querySelector<HTMLElement>('[data-gallery]');
  if (root) setUp(root);
});
