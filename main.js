/* ============================================================
   MAIN.JS
   ============================================================ */

/* --- Préloader — une seule fois par session --- */
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Déjà affiché dans cette session → on cache immédiatement
  if (sessionStorage.getItem('preloader-shown')) {
    preloader.style.display = 'none';
    return;
  }
  sessionStorage.setItem('preloader-shown', '1');

  const word = preloader.querySelector('.preloader-word');

  // Mot monte du bas → centre
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { word.classList.add('visible'); });
  });

  // Après 1.1s → préloader glisse vers le haut
  setTimeout(() => {
    preloader.classList.add('slide-up');
    preloader.addEventListener('transitionend', () => {
      preloader.style.display = 'none';
    }, { once: true });
  }, 1100);
})();

/* --- Custom cursor --- */
const cursor = document.createElement('div');
cursor.className = 'cursor';
document.body.appendChild(cursor);

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

document.querySelectorAll('a, button, .card-3d, .hp-project-card, .platform-link, .marquee-img').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('expand'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('expand'));
});
document.addEventListener('mousedown', () => cursor.classList.add('expand'));
document.addEventListener('mouseup',   () => cursor.classList.remove('expand'));

/* --- Fade-in on scroll --- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => io.observe(el));

/* --- Hero parallax --- */
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    heroBg.style.transform = `translateY(${window.scrollY * 0.15}px)`;
  }, { passive: true });
}

/* --- Platform selector modal --- */
const platformModal = document.getElementById('platform-modal');
if (platformModal) {
  const linksContainer = document.getElementById('platform-links');
  const titleEl        = document.getElementById('platform-modal-title');
  const closeBtn       = document.getElementById('platform-close');

  const PLATFORMS = [
    { key: 'spotify', label: 'SPOTIFY',      cls: 'spotify' },
    { key: 'apple',   label: 'APPLE MUSIC',  cls: 'apple'   },
    { key: 'youtube', label: 'YOUTUBE',       cls: 'youtube' },
    { key: 'deezer',  label: 'DEEZER',        cls: 'deezer'  },
  ];

  document.querySelectorAll('.platform-link').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      titleEl.textContent = card.dataset.title || '';
      linksContainer.innerHTML = '';
      PLATFORMS.forEach(({ key, label, cls }) => {
        const url = card.dataset[key];
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = `platform-modal-link ${cls}`;
        a.innerHTML = `<span>${label}</span><span>↗</span>`;
        linksContainer.appendChild(a);
      });
      platformModal.classList.add('open');
    });
  });

  const closeModal = () => platformModal.classList.remove('open');
  closeBtn.addEventListener('click', closeModal);
  platformModal.addEventListener('click', e => { if (e.target === platformModal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ============================================================
   3D CARD TILT — tous les éléments .card-3d
   ============================================================ */
const TILT = 13;
const P    = '820px';

document.querySelectorAll('.card-3d').forEach(card => {
  const shine = card.querySelector('.card-shine');
  let raf, cx = 0, cy = 0, tx = 0, ty = 0, active = false;

  const tick = () => {
    if (!active) return;
    cx += (tx - cx) * .1;
    cy += (ty - cy) * .1;
    card.style.transform = `perspective(${P}) rotateX(${cx}deg) rotateY(${cy}deg) scale3d(1.04,1.04,1.04)`;
    raf = requestAnimationFrame(tick);
  };

  card.addEventListener('mouseenter', () => {
    active = true;
    card.style.transition = 'none';
    if (shine) shine.style.opacity = '1';
    tick();
  });

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    ty =  ((x - r.width  / 2) / (r.width  / 2)) * TILT;
    tx = -((y - r.height / 2) / (r.height / 2)) * TILT;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${(x/r.width)*100}% ${(y/r.height)*100}%, rgba(255,255,255,.16) 0%, transparent 65%)`;
    }
  });

  card.addEventListener('mouseleave', () => {
    active = false;
    cancelAnimationFrame(raf);
    if (shine) shine.style.opacity = '0';
    card.style.transition = 'transform .55s cubic-bezier(.23,1,.32,1)';
    card.style.transform  = `perspective(${P}) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
    cx = cy = tx = ty = 0;
  });
});
