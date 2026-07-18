/**
 * Before/after comparison slider: a draggable vertical handle that clips the
 * "after" image with clip-path based on pointer position. Supports pointer
 * drag and arrow-key accessibility on the handle (role="slider").
 */
function setBeforeAfterPosition(root, percent) {
  const clamped = Math.min(100, Math.max(0, percent));
  const afterImage = root.querySelector('[data-before-after-after]');
  const handle = root.querySelector('[data-before-after-handle]');

  if (afterImage) {
    afterImage.style.clipPath = `inset(0 0 0 ${clamped}%)`;
  }
  if (handle) {
    handle.style.left = `${clamped}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(clamped)));
  }
}

function percentFromClientX(frame, clientX) {
  const rect = frame.getBoundingClientRect();
  const relative = ((clientX - rect.left) / rect.width) * 100;
  return Math.min(100, Math.max(0, relative));
}

function initBeforeAfter(root) {
  const frame = root.querySelector('.before-after__frame');
  const handle = root.querySelector('[data-before-after-handle]');
  if (!frame || !handle) return;

  let dragging = false;

  setBeforeAfterPosition(root, 50);

  const onPointerMove = (event) => {
    if (!dragging) return;
    setBeforeAfterPosition(root, percentFromClientX(frame, event.clientX));
  };

  const stopDragging = () => {
    dragging = false;
  };

  handle.addEventListener('pointerdown', (event) => {
    dragging = true;
    handle.setPointerCapture(event.pointerId);
  });
  frame.addEventListener('pointerdown', (event) => {
    if (event.target === handle) return;
    dragging = true;
    setBeforeAfterPosition(root, percentFromClientX(frame, event.clientX));
  });
  frame.addEventListener('pointermove', onPointerMove);
  frame.addEventListener('pointerup', stopDragging);
  frame.addEventListener('pointercancel', stopDragging);
  frame.addEventListener('pointerleave', stopDragging);

  handle.addEventListener('keydown', (event) => {
    const current = Number(handle.getAttribute('aria-valuenow')) || 50;
    let next = current;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      next = current - 5;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      next = current + 5;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = 100;
    } else {
      return;
    }

    event.preventDefault();
    setBeforeAfterPosition(root, next);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-before-after]').forEach(initBeforeAfter);
});
