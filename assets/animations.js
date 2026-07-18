/**
 * Scroll-reveal: adds .is-revealed to [data-scroll-reveal] elements as they
 * enter the viewport. No-ops (elements stay visible) if the setting is off
 * or the browser lacks IntersectionObserver support.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('scroll-reveal-enabled')) return;
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('[data-scroll-reveal]');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.scrollRevealDelay) || 0;
        setTimeout(() => entry.target.classList.add('is-revealed'), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );

  targets.forEach((target) => observer.observe(target));
});
