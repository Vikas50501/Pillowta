/**
 * Site header behaviour: transparent-over-hero -> hover-to-solid -> sticky-on-scroll,
 * mega menu open/close with configurable delays, and the mobile drawer.
 * Vanilla JS, no dependencies. GPU-friendly (opacity/transform only).
 */
(() => {
  const HOVER_CAPABLE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class SiteHeader extends HTMLElement {
    constructor() {
      super();
      this.openDelay = Number(this.dataset.openDelay || 80);
      this.closeDelay = Number(this.dataset.closeDelay || 200);
      this.stickyEnabled = this.dataset.stickyEnabled === 'true';
      this.transparentEnabled = this.dataset.transparent === 'true';
      this.openTimer = null;
      this.closeTimer = null;
      this.activeItem = null;
    }

    connectedCallback() {
      this.wrapper = this.querySelector('.site-header__wrapper');
      this.overlay = this.querySelector('[data-header-overlay]');
      this.navItems = Array.from(this.querySelectorAll('[data-navigation-item]'));

      this.bindHoverState();
      this.bindMegaMenus();
      this.bindSticky();
      this.bindMobileMenu();
      this.bindDismissals();
    }

    /* ---------------------------------------------------------------------
       Whole-header hover: transparent -> solid background/text swap
       --------------------------------------------------------------------- */
    bindHoverState() {
      if (!this.transparentEnabled) return;

      this.addEventListener('pointerenter', () => {
        if (!HOVER_CAPABLE) return;
        this.classList.add('is-hovered');
      });

      this.addEventListener('pointerleave', () => {
        if (!HOVER_CAPABLE) return;
        if (this.activeItem) return;
        this.classList.remove('is-hovered');
      });
    }

    /* ---------------------------------------------------------------------
       Mega menus
       --------------------------------------------------------------------- */
    bindMegaMenus() {
      this.navItems.forEach((item) => {
        const trigger = item.querySelector('[data-navigation-trigger]');
        const panel = item.querySelector('[data-mega-menu]');
        if (!trigger || !panel) return;

        if (HOVER_CAPABLE) {
          item.addEventListener('pointerenter', () => this.scheduleOpen(item, trigger));
          item.addEventListener('pointerleave', () => this.scheduleClose(item, trigger));
        }

        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          const isOpen = trigger.getAttribute('aria-expanded') === 'true';
          if (isOpen) {
            this.closeItem(item, trigger);
          } else {
            this.closeAll();
            this.openItem(item, trigger);
          }
        });

        trigger.addEventListener('focus', () => {
          if (HOVER_CAPABLE) this.scheduleOpen(item, trigger);
        });

        panel.addEventListener('pointerenter', () => {
          clearTimeout(this.closeTimer);
        });
        panel.addEventListener('pointerleave', () => this.scheduleClose(item, trigger));
      });

      this.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!this.activeItem) return;
        const trigger = this.activeItem.querySelector('[data-navigation-trigger]');
        this.closeItem(this.activeItem, trigger);
        trigger?.focus();
      });
    }

    scheduleOpen(item, trigger) {
      clearTimeout(this.closeTimer);
      clearTimeout(this.openTimer);
      const delay = REDUCED_MOTION ? 0 : this.openDelay;
      this.openTimer = setTimeout(() => {
        this.closeAll(item);
        this.openItem(item, trigger);
      }, delay);
    }

    scheduleClose(item, trigger) {
      clearTimeout(this.openTimer);
      clearTimeout(this.closeTimer);
      const delay = REDUCED_MOTION ? 0 : this.closeDelay;
      this.closeTimer = setTimeout(() => {
        this.closeItem(item, trigger);
      }, delay);
    }

    openItem(item, trigger) {
      item.setAttribute('data-open', '');
      trigger.setAttribute('aria-expanded', 'true');
      this.activeItem = item;
      this.classList.add('is-menu-open');
    }

    closeItem(item, trigger) {
      item.removeAttribute('data-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (this.activeItem === item) this.activeItem = null;
      if (!this.activeItem) {
        this.classList.remove('is-menu-open');
        if (!this.matches(':hover')) this.classList.remove('is-hovered');
      }
    }

    closeAll(except) {
      this.navItems.forEach((item) => {
        if (item === except) return;
        const trigger = item.querySelector('[data-navigation-trigger]');
        if (trigger) this.closeItem(item, trigger);
      });
    }

    /* ---------------------------------------------------------------------
       Sticky-on-scroll
       --------------------------------------------------------------------- */
    bindSticky() {
      if (!this.stickyEnabled) return;

      const threshold = () => this.offsetHeight;
      let ticking = false;

      const update = () => {
        ticking = false;
        this.classList.toggle('is-sticky', window.scrollY > threshold());
      };

      window.addEventListener(
        'scroll',
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(update);
        },
        { passive: true }
      );

      update();
    }

    /* ---------------------------------------------------------------------
       Mobile drawer
       --------------------------------------------------------------------- */
    bindMobileMenu() {
      const toggle = this.querySelector('[data-mobile-menu-toggle]');
      const drawerId = toggle?.getAttribute('aria-controls');
      const drawer = drawerId ? document.getElementById(drawerId) : null;
      if (!toggle || !drawer) return;

      const closeBtn = drawer.querySelector('[data-mobile-menu-close]');
      const drawerOverlay = drawer.querySelector('[data-mobile-menu-overlay]');

      const open = () => {
        drawer.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        drawer.querySelector('.mobile-menu__close')?.focus();
      };

      const close = () => {
        drawer.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      };

      toggle.addEventListener('click', open);
      closeBtn?.addEventListener('click', close);
      drawerOverlay?.addEventListener('click', close);

      drawer.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') close();
      });
    }

    /* ---------------------------------------------------------------------
       Click-outside / focus-outside dismissal for mega menus
       --------------------------------------------------------------------- */
    bindDismissals() {
      document.addEventListener('click', (event) => {
        if (this.contains(event.target)) return;
        this.closeAll();
        if (!this.matches(':hover')) this.classList.remove('is-hovered', 'is-menu-open');
      });

      document.addEventListener('focusin', (event) => {
        if (this.contains(event.target)) return;
        this.closeAll();
      });
    }
  }

  if (!customElements.get('site-header')) {
    customElements.define('site-header', SiteHeader);
  }
})();

