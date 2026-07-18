/**
 * Customer account pages: confirm before deleting a saved address.
 */
document.addEventListener('submit', (event) => {
  const button = event.submitter;
  if (!button || !button.dataset.confirm) return;
  if (!window.confirm(button.dataset.confirm)) {
    event.preventDefault();
  }
});
