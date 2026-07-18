/**
 * Promotional popup (sections/popup.liquid): decides whether to show based
 * on the merchant's trigger/frequency settings, then handles open/close and
 * persists dismissal per the chosen frequency. All storage access is
 * guarded — some browsers (e.g. private mode) throw on localStorage access.
 */

const POPUP_STORAGE_KEY = 'bloom_popup_dismissed';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (error) {
    /* storage unavailable — ignore, popup just won't remember the dismissal */
  }
}

function shouldShow(root) {
  const frequency = root.dataset.popupFrequency || 'once_per_day';

  if (frequency === 'once_per_session') {
    return safeGet(sessionStorage, POPUP_STORAGE_KEY) !== '1';
  }

  if (frequency === 'once_per_day') {
    const lastDismissed = Number(safeGet(localStorage, POPUP_STORAGE_KEY));
    if (!lastDismissed) return true;
    return Date.now() - lastDismissed > ONE_DAY_MS;
  }

  // every_visit: always show unless already dismissed during this page view
  return root.dataset.popupDismissedThisView !== 'true';
}

function persistDismissal(root) {
  const frequency = root.dataset.popupFrequency || 'once_per_day';

  if (frequency === 'once_per_session') {
    safeSet(sessionStorage, POPUP_STORAGE_KEY, '1');
  } else if (frequency === 'once_per_day') {
    safeSet(localStorage, POPUP_STORAGE_KEY, String(Date.now()));
  } else {
    root.dataset.popupDismissedThisView = 'true';
  }
}

function openPopup(root) {
  if (root.classList.contains('is-open')) return;
  root.classList.add('is-open');
  root.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePopup(root) {
  root.classList.remove('is-open');
  root.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  persistDismissal(root);
}

function wireCloseHandlers(root) {
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-popup-close]')) closePopup(root);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) closePopup(root);
  });
}

function wireTrigger(root) {
  const trigger = root.dataset.popupTrigger || 'delay';
  const show = () => openPopup(root);

  if (trigger === 'exit_intent') {
    const onMouseLeave = (event) => {
      if (event.clientY <= 0) {
        show();
        document.removeEventListener('mouseleave', onMouseLeave);
      }
    };
    document.addEventListener('mouseleave', onMouseLeave);
    return;
  }

  const delaySeconds = Number(root.dataset.popupDelay) || 5;
  setTimeout(show, delaySeconds * 1000);
}

function initPopup() {
  const root = document.getElementById('PromoPopup');
  if (!root) return;
  if (root.dataset.popupEnabled !== 'true') return;
  if (!shouldShow(root)) return;

  wireCloseHandlers(root);
  wireTrigger(root);
}

document.addEventListener('DOMContentLoaded', initPopup);
