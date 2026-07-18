/**
 * Product detail behavior: variant selection, gallery sync, add-to-cart, and
 * the sticky add-to-cart bar. Exported as initProductDetail(root) so it can
 * be run both for the page's own product and for quick-view's injected copy
 * (assets/quick-view.js) without either instance stepping on the other.
 */
import { addToCart, refreshCartDrawer, openCartDrawer } from './cart.js';

function getJsonScript(root, selector) {
  const script = root.querySelector(selector);
  if (!script) return null;
  try {
    return JSON.parse(script.textContent);
  } catch {
    return null;
  }
}

function findMatchingVariant(variants, selectedOptions) {
  return variants.find((variant) =>
    selectedOptions.every((value, index) => variant[`option${index + 1}`] === value)
  );
}

function getSelectedOptions(picker) {
  return Array.from(picker.querySelectorAll('.variant-picker__option')).map((fieldset) => {
    const checked = fieldset.querySelector('[data-option-value]:checked');
    return checked ? checked.value : null;
  });
}

async function refreshServerRenderedBits(root, productUrl, sectionId, variantId) {
  const response = await fetch(`${productUrl}?variant=${variantId}&section_id=${sectionId}`);
  if (!response.ok) return;
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  ['[data-price-wrapper]', '[data-sku]', '[data-inventory]'].forEach((selector) => {
    const fresh = doc.querySelector(selector);
    const current = root.querySelector(selector);
    if (fresh && current) current.innerHTML = fresh.innerHTML;
  });
}

function updateGalleryForVariant(root, variantId, variants) {
  const variant = variants.find((v) => v.id === variantId);
  const mediaId = variant?.featured_media?.id;
  if (!mediaId) return;

  const gallery = root.querySelector('[data-gallery]');
  if (!gallery) return;

  gallery.querySelectorAll('[data-gallery-slide]').forEach((slide) => {
    slide.classList.toggle('is-active', Number(slide.dataset.mediaId) === mediaId);
  });
  gallery.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
    const isMatch = Number(thumb.dataset.mediaId) === mediaId;
    thumb.classList.toggle('is-active', isMatch);
    thumb.setAttribute('aria-selected', String(isMatch));
  });
}

function updateAddToCartState(root, variant) {
  const button = root.querySelector('[data-add-to-cart]');
  const text = button?.querySelector('[data-add-to-cart-text]');
  const stickyButton = document.querySelector('[data-sticky-atc-button]');
  const available = Boolean(variant?.available);

  [button, stickyButton].forEach((el) => {
    if (!el) return;
    el.disabled = !available;
  });

  if (text) {
    text.textContent = available
      ? text.dataset.addLabel || text.textContent
      : text.dataset.soldOutLabel || text.textContent;
  }
}

function initVariantPicker(root) {
  const picker = root.querySelector('[data-variant-picker]');
  if (!picker) return;

  const variants = getJsonScript(picker, '[data-product-variants-json]') || [];
  const productUrl = getJsonScript(picker, '[data-product-url-json]') || window.location.pathname;
  const sectionId = root.dataset.sectionId;
  const variantIdInput = root.querySelector('[data-variant-id-input]');

  picker.addEventListener('change', async (event) => {
    if (!event.target.matches('[data-option-value]')) return;

    const fieldset = event.target.closest('.variant-picker__option');
    const label = fieldset?.querySelector('[data-selected-value]');
    if (label) label.textContent = event.target.value;

    const selectedOptions = getSelectedOptions(picker);
    const variant = findMatchingVariant(variants, selectedOptions);
    if (!variant) return;

    if (variantIdInput) variantIdInput.value = variant.id;
    updateGalleryForVariant(root, variant.id, variants);
    updateAddToCartState(root, variant);

    if (root.dataset.isQuickView !== 'true') {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    }

    if (sectionId) {
      await refreshServerRenderedBits(root, productUrl, sectionId, variant.id);
    }
  });
}

function initAddToCart(root) {
  const form = root.querySelector('[data-product-detail-form]') || root.querySelector('#ProductForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = root.querySelector('[data-add-to-cart]');
    button?.setAttribute('disabled', 'disabled');

    try {
      await addToCart(new FormData(form));
      await refreshCartDrawer();
      openCartDrawer();
    } catch (error) {
      // Swallow — a future toast/error-message component can surface `error.message`.
    } finally {
      button?.removeAttribute('disabled');
    }
  });
}

function initStickyAddToCart(root) {
  const buyButtons = root.querySelector('[data-buy-buttons]');
  const stickyBar = document.querySelector('[data-sticky-atc]');
  if (!buyButtons || !stickyBar || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      stickyBar.hidden = !scrolledPast;
    },
    { threshold: 0 }
  );

  observer.observe(buyButtons);
}

// Delegated (safe to bind once, works for any number of galleries on the page).
function initGalleryInteractions() {
  document.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-gallery-thumb]');
    const zoomTrigger = event.target.closest('[data-gallery-zoom]');
    const closeTrigger = event.target.closest('[data-gallery-lightbox-close]');

    if (thumb) {
      const gallery = thumb.closest('[data-gallery]');
      const mediaId = thumb.dataset.mediaId;
      gallery.querySelectorAll('[data-gallery-slide]').forEach((slide) => {
        slide.classList.toggle('is-active', slide.dataset.mediaId === mediaId);
      });
      gallery.querySelectorAll('[data-gallery-thumb]').forEach((t) => {
        t.classList.toggle('is-active', t === thumb);
        t.setAttribute('aria-selected', String(t === thumb));
      });
    }

    if (zoomTrigger) {
      const gallery = zoomTrigger.closest('[data-gallery]');
      const lightbox = gallery.querySelector('[data-gallery-lightbox]');
      const stage = lightbox.querySelector('[data-gallery-lightbox-stage]');
      stage.innerHTML = zoomTrigger.innerHTML;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
    }

    if (closeTrigger) {
      const lightbox = closeTrigger.closest('[data-gallery-lightbox]');
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
    }
  });
}

let galleryInteractionsBound = false;

export function initProductDetail(root) {
  if (!root) return;
  if (!galleryInteractionsBound) {
    initGalleryInteractions();
    galleryInteractionsBound = true;
  }
  initVariantPicker(root);
  initAddToCart(root);
  initStickyAddToCart(root);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-product-detail]').forEach((root) => initProductDetail(root));
});
