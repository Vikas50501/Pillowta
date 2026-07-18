/**
 * Collection page: AJAX-updates the product grid, results count, facets
 * panel, and pagination whenever the URL's filter/sort/page query changes —
 * shared by facets.js (filter/sort changes) and the pagination controls
 * below. Falls back to full page navigation if fetch/DOMParser are absent.
 */

export async function updateCollectionResults(url, sectionId, { push = true } = {}) {
  const section = document.querySelector(`[data-section-id="${sectionId}"]`);
  if (!section) return;

  section.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}section_id=${sectionId}`);
    if (!response.ok) throw new Error('collection-fetch-failed');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const swaps = [
      '[data-collection-grid-results]',
      '[data-facets-panel]',
      '[data-results-count]',
      '[data-collection-grid-pagination]',
    ];

    swaps.forEach((selector) => {
      const fresh = doc.querySelector(selector);
      const current = section.querySelector(selector);
      if (fresh && current) current.replaceWith(fresh);
    });

    if (push) window.history.pushState({ url }, '', url);
    window.scrollTo({ top: section.offsetTop - 24, behavior: 'smooth' });
  } catch (error) {
    window.location.href = url;
  } finally {
    section.removeAttribute('aria-busy');
  }
}

function sectionIdFor(el) {
  return el.closest('[data-collection-grid-section]')?.dataset.sectionId;
}

function initSort() {
  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-sort-select]');
    if (!select) return;

    const sectionId = sectionIdFor(select);
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', select.value);
    updateCollectionResults(url.toString(), sectionId);
  });
}

async function appendNextPage(button) {
  const sectionId = sectionIdFor(button);
  const nextUrl = button.dataset.nextUrl;
  if (!nextUrl || !sectionId) return;

  button.disabled = true;

  try {
    const response = await fetch(`${nextUrl}${nextUrl.includes('?') ? '&' : '?'}section_id=${sectionId}`);
    if (!response.ok) throw new Error('pagination-fetch-failed');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const currentList = document.querySelector('[data-collection-grid-list]');
    const freshList = doc.querySelector('[data-collection-grid-list]');
    if (currentList && freshList) currentList.append(...freshList.children);

    const currentPagination = document.querySelector('[data-collection-grid-pagination]');
    const freshPagination = doc.querySelector('[data-collection-grid-pagination]');
    if (currentPagination && freshPagination) currentPagination.replaceWith(freshPagination);
  } catch (error) {
    window.location.href = nextUrl;
  }
}

function initPagination() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-pagination-link]');
    const loadMore = event.target.closest('[data-pagination-load-more]');

    if (link) {
      event.preventDefault();
      updateCollectionResults(link.href, sectionIdFor(link));
      return;
    }

    if (loadMore) {
      appendNextPage(loadMore);
    }
  });

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const button = entry.target;
      if (button.dataset.autoLoad !== undefined && !button.disabled) {
        appendNextPage(button);
      }
    });
  });

  new MutationObserver(() => {
    document.querySelectorAll('[data-auto-load]').forEach((button) => observer.observe(button));
  }).observe(document.body, { childList: true, subtree: true });

  document.querySelectorAll('[data-auto-load]').forEach((button) => observer.observe(button));
}

window.addEventListener('popstate', () => {
  const section = document.querySelector('[data-collection-grid-section]');
  const sectionId = section?.dataset.sectionId;
  if (sectionId) updateCollectionResults(window.location.href, sectionId, { push: false });
});

document.addEventListener('DOMContentLoaded', () => {
  initSort();
  initPagination();
});
