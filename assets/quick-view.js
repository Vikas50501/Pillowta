/**
 * Quick view: fetches a product's page and injects its `.product-detail`
 * block into a modal, then re-runs the product-form behaviors on that copy
 * (see initProductDetail in product-form.js) so variant selection and add-
 * to-cart work the same as on the real PDP.
 */
import { initProductDetail } from './product-form.js';

let lastTrigger = null;

function openModal() {
  const modal = document.getElementById('QuickViewModal');
  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('QuickViewModal');
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastTrigger?.focus();

  const content = modal?.querySelector('[data-quick-view-content]');
  if (content) {
    content.innerHTML = `
      <div class="quick-view-modal__loading">
        <span class="spinner"></span>
      </div>
    `;
  }
}

async function loadProduct(url) {
  const modal = document.getElementById('QuickViewModal');
  const content = modal?.querySelector('[data-quick-view-content]');
  if (!content) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('quick-view-fetch-failed');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const productDetail = doc.querySelector('[data-product-detail]');

    if (!productDetail) {
      window.location.href = url;
      return;
    }

    productDetail.dataset.isQuickView = 'true';
    content.innerHTML = '';
    content.appendChild(productDetail);
    initProductDetail(productDetail);
  } catch (error) {
    window.location.href = url;
  }
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-quick-view-trigger]');
  const closeTrigger = event.target.closest('[data-quick-view-close]');

  if (trigger) {
    event.preventDefault();
    lastTrigger = trigger;
    openModal();
    loadProduct(trigger.dataset.productUrl);
  }

  if (closeTrigger) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const modal = document.getElementById('QuickViewModal');
  if (modal?.classList.contains('is-open')) closeModal();
});
