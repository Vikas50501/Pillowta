/**
 * Recently viewed products:
 * 1. On every page load, if the current URL is a product page, records its
 *    handle into localStorage (key: bloom_recently_viewed), most-recent-first,
 *    de-duplicated, capped at 12.
 * 2. On pages that render the "Recently viewed products" section, reads that
 *    list (excluding the current product), fetches each product via
 *    /products/{handle}.js, and renders up to 4 simple cards.
 */
const RECENTLY_VIEWED_KEY = 'bloom_recently_viewed';
const RECENTLY_VIEWED_MAX = 12;
const RECENTLY_VIEWED_DISPLAY = 4;

function getCurrentProductHandle() {
  const match = window.location.pathname.match(/\/products\/([^/?#]+)/);
  return match ? match[1] : null;
}

function readRecentlyViewed() {
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

function writeRecentlyViewed(list) {
  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
  } catch (error) {
    /* localStorage unavailable (private browsing, etc.) — fail silently */
  }
}

function recordCurrentProduct() {
  const handle = getCurrentProductHandle();
  if (!handle) return;

  const existing = readRecentlyViewed().filter((item) => item !== handle);
  existing.unshift(handle);

  writeRecentlyViewed(existing.slice(0, RECENTLY_VIEWED_MAX));
}

function formatMoney(cents) {
  if (typeof cents !== 'number') return '';
  const amount = (cents / 100).toFixed(2);
  const format = window.themeMoneyFormat || '${{amount}}';
  return format.replace(/\{\{\s*amount\s*\}\}/, amount);
}

function buildRecentlyViewedCard(product) {
  const li = document.createElement('li');
  li.className = 'recently-viewed__item';

  const link = document.createElement('a');
  link.className = 'recently-viewed__link';
  link.href = `/products/${product.handle}`;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'recently-viewed__image';
  if (product.featured_image) {
    const img = document.createElement('img');
    img.src = `${product.featured_image}${product.featured_image.includes('?') ? '&' : '?'}width=300`;
    img.alt = product.title || '';
    img.loading = 'lazy';
    imageWrap.appendChild(img);
  }

  const title = document.createElement('p');
  title.className = 'recently-viewed__title text-body';
  title.textContent = product.title || '';

  const price = document.createElement('p');
  price.className = 'recently-viewed__price text-price';
  price.textContent = formatMoney(product.price);

  link.appendChild(imageWrap);
  link.appendChild(title);
  link.appendChild(price);
  li.appendChild(link);

  return li;
}

function renderRecentlyViewedSection() {
  const section = document.querySelector('[data-recently-viewed-section]');
  const list = document.querySelector('[data-recently-viewed-list]');
  if (!section || !list) return;

  const currentHandle = getCurrentProductHandle();
  const handles = readRecentlyViewed()
    .filter((handle) => handle !== currentHandle)
    .slice(0, RECENTLY_VIEWED_DISPLAY);

  if (!handles.length) return;

  Promise.all(
    handles.map((handle) =>
      fetch(`/products/${handle}.js`)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
    )
  ).then((products) => {
    const valid = products.filter(Boolean);
    if (!valid.length) return;

    valid.forEach((product) => {
      list.appendChild(buildRecentlyViewedCard(product));
    });

    section.hidden = false;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  recordCurrentProduct();
  renderRecentlyViewedSection();
});
