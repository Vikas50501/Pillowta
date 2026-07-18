/**
 * Global behaviors shared across every page: back-to-top, page loader,
 * quantity selectors, and the generic accordion component.
 */

function debounce(fn, wait = 150) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function initBackToTop() {
  const button = document.querySelector('[data-back-to-top]');
  if (!button) return;

  const toggle = () => {
    const visible = window.scrollY > window.innerHeight * 0.6;
    button.classList.toggle('is-visible', visible);
    button.hidden = false;
  };

  window.addEventListener('scroll', debounce(toggle, 100), { passive: true });
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  toggle();
}

function initPageLoader() {
  const loader = document.querySelector('[data-page-loader]');
  if (!loader) return;
  window.addEventListener('load', () => loader.classList.add('is-hidden'));
}

function initQuantitySelectors() {
  document.addEventListener('click', (event) => {
    const decrease = event.target.closest('[data-quantity-decrease]');
    const increase = event.target.closest('[data-quantity-increase]');
    const trigger = decrease || increase;
    if (!trigger) return;

    const wrapper = trigger.closest('[data-quantity-selector]');
    const input = wrapper?.querySelector('[data-quantity-input]');
    if (!input) return;

    const min = Number(input.min) || 1;
    const max = input.max ? Number(input.max) : Infinity;
    let value = Number(input.value) || min;
    value = decrease ? Math.max(min, value - 1) : Math.min(max, value + 1);

    if (value !== Number(input.value)) {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

function initAccordions() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-accordion-trigger]');
    if (!trigger) return;

    const content = document.getElementById(trigger.getAttribute('aria-controls'));
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));

    if (content) {
      content.style.height = expanded ? '0px' : `${content.scrollHeight}px`;
      content.hidden = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBackToTop();
  initPageLoader();
  initQuantitySelectors();
  initAccordions();
});
