/**
 * Live predictive search inside the search drawer: debounced fetch against
 * Shopify's predictive search endpoint, rendered server-side by
 * sections/predictive-search.liquid and injected as-is.
 */
let debounceTimer;
let latestQuery = '';

async function fetchPredictiveSearch(term, baseUrl, resultsEl) {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('q', term);
  url.searchParams.set('section_id', 'predictive-search');
  url.searchParams.set('resources[type]', 'product,collection,page,article');
  url.searchParams.set('resources[limit]', '6');

  try {
    const response = await fetch(url.toString());
    if (term !== latestQuery) return; // a newer keystroke superseded this request
    if (!response.ok) throw new Error('predictive-search-failed');

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-predictive-search-results]');
    resultsEl.innerHTML = fresh ? fresh.outerHTML : '';
  } catch (error) {
    resultsEl.innerHTML = '';
  }
}

function initPredictiveSearch() {
  document.addEventListener('input', (event) => {
    const input = event.target.closest('[data-search-input]');
    if (!input) return;

    const form = input.closest('form');
    const resultsEl = document.querySelector('[data-search-results]');
    const baseUrl = form?.dataset.predictiveSearchUrl;
    if (!form || !resultsEl || !baseUrl) return;

    const term = input.value.trim();
    latestQuery = term;

    clearTimeout(debounceTimer);

    if (!term) {
      resultsEl.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => fetchPredictiveSearch(term, baseUrl, resultsEl), 250);
  });
}

document.addEventListener('DOMContentLoaded', initPredictiveSearch);
