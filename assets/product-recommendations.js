/**
 * Fetches the native Shopify product-recommendations endpoint and swaps in
 * the server-rendered results (the section renders empty/hidden on first
 * paint whenever `recommendations.performed` is false).
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('[data-product-recommendations]');
  if (!container || !container.hidden) return;

  const url = container.dataset.url;
  if (!url) return;

  try {
    const response = await fetch(url);
    if (!response.ok) return;
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-product-recommendations]');
    if (fresh && fresh.innerHTML.trim()) {
      container.innerHTML = fresh.innerHTML;
      container.hidden = false;
    }
  } catch {
    // Leave the section hidden if the recommendations request fails.
  }
});
