/**
 * Shared cart utilities used by quick-add and the product form: adding items
 * via the Cart AJAX API and refreshing the cart drawer's markup in place.
 */

export async function addToCart(formData) {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.description || 'add-to-cart-failed');
  }

  return response.json();
}

export async function refreshCartDrawer() {
  const response = await fetch(`${window.location.pathname}?section_id=cart-drawer`);
  if (!response.ok) return;

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const fresh = doc.querySelector('#CartDrawer');
  const current = document.getElementById('CartDrawer');

  if (fresh && current) {
    fresh.classList.toggle('is-open', current.classList.contains('is-open'));
    current.replaceWith(fresh);
  }

  const freshCount = doc.querySelector('[data-cart-count]');
  const currentCount = document.querySelector('[data-cart-count]');
  if (freshCount && currentCount) {
    currentCount.textContent = freshCount.textContent;
    currentCount.hidden = freshCount.hidden;
  }
}

export function openCartDrawer() {
  const drawer = document.getElementById('CartDrawer');
  drawer?.classList.add('is-open');
  drawer?.setAttribute('aria-hidden', 'false');
}
