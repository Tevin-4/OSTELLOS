export function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.revealDelay || 0;
          setTimeout(() => entry.target.classList.add('revealed'), +delay);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.001 }
  );

  els.forEach((el) => io.observe(el));
}