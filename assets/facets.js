/**
 * Filter panel: mobile open/close toggle, and turning checkbox/range changes
 * plus form submission into AJAX updates via collection.js's shared updater.
 */
import { updateCollectionResults } from './collection.js';

function serializeFacetsForm(form) {
  const url = new URL(form.action || window.location.href);
  const formData = new FormData(form);

  // Preserve the current sort while filters change.
  const currentSort = new URL(window.location.href).searchParams.get('sort_by');
  url.search = '';

  for (const [key, value] of formData.entries()) {
    if (value === '') continue;
    url.searchParams.append(key, value);
  }
  if (currentSort) url.searchParams.set('sort_by', currentSort);

  return url.toString();
}

function initFacetsToggle() {
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-facets-toggle]');
    if (!toggle) return;

    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    panel?.classList.toggle('is-open', !expanded);
  });
}

function initFacetsForm() {
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('.facets__form');
    if (!form) return;
    event.preventDefault();

    const sectionId = form.closest('[data-collection-grid-section]')?.dataset.sectionId;
    updateCollectionResults(serializeFacetsForm(form), sectionId);
  });

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-facet-input]');
    if (!input) return;

    const form = input.closest('.facets__form');
    const sectionId = form?.closest('[data-collection-grid-section]')?.dataset.sectionId;
    if (form && sectionId) updateCollectionResults(serializeFacetsForm(form), sectionId);
  });

  document.addEventListener('click', (event) => {
    const clearAll = event.target.closest('[data-facets-clear-all]');
    if (!clearAll) return;
    event.preventDefault();

    const sectionId = clearAll.closest('[data-collection-grid-section]')?.dataset.sectionId;
    updateCollectionResults(clearAll.href, sectionId);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFacetsToggle();
  initFacetsForm();
});
