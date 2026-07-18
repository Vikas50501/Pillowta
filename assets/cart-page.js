/**
 * Cart page: quantity/remove via the Cart AJAX API (re-rendering the section
 * server-side so money formatting/line totals stay correct), order note
 * saving, discount code apply-and-redirect, and a shipping rate estimator.
 */

function getCartPage() {
  return document.querySelector('[data-cart-page]');
}

async function refreshCartPage() {
  const page = getCartPage();
  const sectionId = page?.dataset.sectionId;
  if (!page || !sectionId) return;

  page.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(`${window.location.pathname}?section_id=${sectionId}`);
    if (!response.ok) throw new Error('cart-refresh-failed');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-cart-page]');
    if (fresh) page.replaceWith(fresh);

    const countResponse = await fetch('/cart.js');
    if (countResponse.ok) {
      const cart = await countResponse.json();
      const countEl = document.querySelector('[data-cart-count]');
      if (countEl) {
        countEl.textContent = cart.item_count;
        countEl.hidden = cart.item_count === 0;
      }
    }
  } catch (error) {
    window.location.reload();
  }
}

async function changeLine(line, quantity) {
  await fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ line, quantity }),
  });
  await refreshCartPage();
}

function initQuantityAndRemove() {
  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-quantity-input]');
    if (!input) return;
    const row = input.closest('[data-cart-item]');
    if (!row) return;
    changeLine(row.dataset.line, Number(input.value) || 0);
  });

  document.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-cart-remove]');
    if (!removeButton) return;
    event.preventDefault();
    changeLine(removeButton.dataset.line, 0);
  });
}

function initCartNote() {
  let timeout;
  document.addEventListener('input', (event) => {
    const textarea = event.target.closest('[data-cart-note]');
    if (!textarea) return;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: textarea.value }),
      });
    }, 500);
  });
}

function initDiscountForm() {
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-discount-form]');
    if (!form) return;
    event.preventDefault();

    const code = form.querySelector('[data-discount-input]')?.value.trim();
    if (!code) return;

    const cartUrl = form.dataset.cartUrl || '/cart';
    window.location.href = `/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(cartUrl)}`;
  });
}

async function pollShippingRates(query, attempt = 0) {
  if (attempt > 5) return null;

  const response = await fetch(`/cart/async_shipping_rates.json?${query}`);
  if (response.status === 202) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return pollShippingRates(query, attempt + 1);
  }
  if (!response.ok) return null;
  return response.json();
}

function renderShippingRates(container, data) {
  const rates = data?.shipping_rates || [];
  if (!rates.length) {
    container.innerHTML = `<p>${container.dataset.noRatesText || 'No shipping rates available for this address'}</p>`;
    return;
  }

  const list = document.createElement('ul');
  rates.forEach((rate) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = rate.presentment_name || rate.name;
    const price = document.createElement('span');
    price.textContent = rate.price;
    item.append(name, price);
    list.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(list);
}

function initShippingEstimator() {
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-shipping-estimator-form]');
    if (!form) return;
    event.preventDefault();

    const results = document.querySelector('[data-shipping-results]');
    if (!results) return;
    results.textContent = '';

    const country = form.querySelector('[data-shipping-country]')?.value;
    const province = form.querySelector('[data-shipping-province]')?.value;
    const zip = form.querySelector('[data-shipping-zip]')?.value;

    const params = new URLSearchParams({
      'shipping_address[zip]': zip || '',
      'shipping_address[country]': country || '',
      'shipping_address[province]': province || '',
    });

    try {
      const prepareResponse = await fetch(`/cart/prepare_shipping_rates.json?${params}`);
      if (!prepareResponse.ok) throw new Error('prepare-shipping-rates-failed');
      const data = await pollShippingRates(params.toString());
      renderShippingRates(results, data);
    } catch (error) {
      renderShippingRates(results, null);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initQuantityAndRemove();
  initCartNote();
  initDiscountForm();
  initShippingEstimator();
});
