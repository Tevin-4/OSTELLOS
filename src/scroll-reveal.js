const DECRYPT_CHARS = '!@#$%^&*()_+-=[]{}|;:<>?/~`0123456789';

function initNavPill() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => {
    const y = window.scrollY;
    const start = 20;
    const end = 200;
    const progress = Math.min(1, Math.max(0, (y - start) / (end - start)));
    const ease = progress * progress * (3 - 2 * progress);
    nav.style.setProperty('--pill', ease);
    nav.classList.toggle('nav--scrolled', progress > 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function decryptText(el) {
  const final = el.dataset.decryptText || el.textContent;
  const duration = 1200;
  const steps = 18;
  const interval = duration / steps;
  let step = 0;

  const id = setInterval(() => {
    step++;
    const progress = step / steps;
    const revealed = Math.floor(progress * final.length);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      if (i < revealed) {
        out += final[i];
      } else if (final[i] === ' ') {
        out += ' ';
      } else {
        out += DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
      }
    }
    el.textContent = out;
    if (step >= steps) {
      clearInterval(id);
      el.textContent = final;
      el.classList.add('decrypted');
    }
  }, interval);
}

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

  // Decrypted text effect
  const decryptEls = document.querySelectorAll('[data-decrypt]');
  if (!decryptEls.length) return;

  const ioDecrypt = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          decryptText(entry.target);
          ioDecrypt.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  decryptEls.forEach((el) => ioDecrypt.observe(el));

  initNavPill();
}