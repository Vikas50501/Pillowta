/**
 * Tabbed products: clicking a [data-tab-trigger] button shows its matching
 * panel (by id) and hides the others. The first tab is already marked
 * active/visible server-side in the Liquid markup; this just handles clicks.
 */
function activateTab(container, trigger) {
  const targetId = trigger.dataset.tabTarget;
  const target = container.querySelector(`#${targetId}`);
  if (!target) return;

  container.querySelectorAll('[data-tab-trigger]').forEach((btn) => {
    btn.classList.remove('is-active');
    btn.setAttribute('aria-selected', 'false');
  });
  container.querySelectorAll('.tabbed-products__panel').forEach((panel) => {
    panel.classList.remove('is-active');
    panel.hidden = true;
  });

  trigger.classList.add('is-active');
  trigger.setAttribute('aria-selected', 'true');
  target.classList.add('is-active');
  target.hidden = false;
}

function initTabbedProducts() {
  document.querySelectorAll('.tabbed-products').forEach((container) => {
    container.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-tab-trigger]');
      if (!trigger || !container.contains(trigger)) return;
      activateTab(container, trigger);
    });
  });
}

document.addEventListener('DOMContentLoaded', initTabbedProducts);
