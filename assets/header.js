/**
 * Header interactivity: sticky/shrink behavior, announcement bar rotation,
 * cart/search/mobile-menu drawers, and mobile submenu disclosures.
 */

function wireDrawer(root, { openSelector, closeSelector }) {
  if (!root) return;

  let lastTrigger = null;

  const focusablesOf = (el) =>
    el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');

  const open = (trigger) => {
    lastTrigger = trigger || null;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const first = focusablesOf(root)[0];
    first?.focus();
  };

  const close = () => {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastTrigger?.focus();
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest(openSelector);
    if (opener) {
      event.preventDefault();
      open(opener);
      return;
    }
    if (root.classList.contains('is-open') && event.target.closest(closeSelector)) {
      close();
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) close();
  });
}

function initStickyHeader() {
  const header = document.querySelector('site-header');
  if (!header) return;

  const shrinkEnabled = header.dataset.shrink === 'true';
  const isTransparent = header.classList.contains('site-header--transparent');

  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    if (isTransparent) header.classList.toggle('is-scrolled', scrolled);
    if (shrinkEnabled) header.classList.toggle('is-shrunk', window.scrollY > 120);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initAnnouncementBar() {
  const bar = document.querySelector('announcement-bar');
  if (!bar || bar.hasAttribute('data-single')) return;

  const slides = Array.from(bar.querySelectorAll('[data-announcement-slide]'));
  if (slides.length < 2) return;

  let index = 0;
  const show = (next) => {
    slides[index].classList.remove('is-active');
    index = (next + slides.length) % slides.length;
    slides[index].classList.add('is-active');
  };

  bar.querySelector('[data-announcement-next]')?.addEventListener('click', () => show(index + 1));
  bar.querySelector('[data-announcement-prev]')?.addEventListener('click', () => show(index - 1));

  if (bar.dataset.autoplay === 'true') {
    const speed = Number(bar.dataset.autoplaySpeed) || 5000;
    setInterval(() => show(index + 1), speed);
  }
}

function initMobileSubmenus() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-mobile-submenu-toggle]');
    if (!trigger) return;

    const submenu = trigger.parentElement.querySelector('[data-mobile-submenu]');
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));
    if (submenu) submenu.hidden = expanded;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initAnnouncementBar();
  initMobileSubmenus();

  wireDrawer(document.getElementById('CartDrawer'), {
    openSelector: '[data-cart-open]',
    closeSelector: '[data-cart-close]',
  });
  wireDrawer(document.getElementById('SearchDrawer'), {
    openSelector: '[data-search-open]',
    closeSelector: '[data-search-close]',
  });
  wireDrawer(document.getElementById('MobileMenu'), {
    openSelector: '[data-mobile-menu-open]',
    closeSelector: '[data-mobile-menu-close]',
  });
});
