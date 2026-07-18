/**
 * Intercepts product-card "quick add" form submissions, adds the item via the
 * Cart AJAX API, refreshes the cart drawer's contents, and opens it.
 */
import { addToCart, refreshCartDrawer, openCartDrawer } from './cart.js';

function setButtonState(button, state) {
  if (!button) return;
  button.disabled = state === 'loading';
  button.classList.toggle('is-loading', state === 'loading');
  button.classList.toggle('is-added', state === 'added');
}

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('.product-card__quick-add-form');
  if (!form) return;
  event.preventDefault();

  const button = form.querySelector('[data-quick-add-button]');
  setButtonState(button, 'loading');

  try {
    await addToCart(new FormData(form));
    await refreshCartDrawer();
    setButtonState(button, 'added');
    openCartDrawer();
    setTimeout(() => setButtonState(button, 'idle'), 2000);
  } catch (error) {
    setButtonState(button, 'idle');
    button?.classList.add('is-error');
    setTimeout(() => button?.classList.remove('is-error'), 2000);
  }
});
