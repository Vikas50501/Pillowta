/**
 * Countdown section: finds every [data-countdown] wrapper, parses its
 * data-end-date, and updates the days/hours/minutes/seconds display every
 * second. Shows the "expired" message and hides the timer once the target
 * date has passed.
 */
function updateCountdown(wrapper) {
  const endDateValue = wrapper.dataset.endDate;
  const endDate = new Date(endDateValue);

  if (Number.isNaN(endDate.getTime())) return null;

  const timer = wrapper.querySelector('[data-countdown-timer]');
  const expired = wrapper.querySelector('[data-countdown-expired]');
  const daysEl = wrapper.querySelector('[data-countdown-days]');
  const hoursEl = wrapper.querySelector('[data-countdown-hours]');
  const minutesEl = wrapper.querySelector('[data-countdown-minutes]');
  const secondsEl = wrapper.querySelector('[data-countdown-seconds]');

  const tick = () => {
    const now = new Date().getTime();
    const distance = endDate.getTime() - now;

    if (distance <= 0) {
      if (timer) timer.hidden = true;
      if (expired) expired.hidden = false;
      return false;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

    return true;
  };

  return tick;
}

function initCountdowns() {
  const wrappers = document.querySelectorAll('[data-countdown]');

  wrappers.forEach((wrapper) => {
    const tick = updateCountdown(wrapper);
    if (!tick) return;

    const stillRunning = tick();
    if (!stillRunning) return;

    const intervalId = setInterval(() => {
      const running = tick();
      if (!running) clearInterval(intervalId);
    }, 1000);
  });
}

document.addEventListener('DOMContentLoaded', initCountdowns);
