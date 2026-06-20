/* ============================================================
   MAIN.JS
   ============================================================ */

/* --- Préloader — index.html uniquement, à chaque chargement --- */
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const word = preloader.querySelector('.preloader-word');

  // Mot monte du bas après 0.5s
  setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { word.classList.add('visible'); });
    });
  }, 500);

  // Slide-up à 3.1s → fin de transition à ~4s
  setTimeout(() => {
    preloader.classList.add('slide-up');
    preloader.addEventListener('transitionend', () => {
      preloader.style.display = 'none';
    }, { once: true });
  }, 3100);
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

/* --- Marquee — scroll JS + drag tactile direct + lightbox --- */
(function () {
  const wrap  = document.querySelector('.marquee-wrap');
  const track = document.querySelector('.marquee-track');
  const set   = track && track.querySelector('.marquee-set');
  if (!wrap || !track || !set) return;

  /* Supprime l'animation CSS — on gère tout en JS */
  track.style.animation = 'none';

  const BASE_SPEED = 75; // px/s

  let pos        = 0;
  let lastTs     = null;
  let extraVel   = 0;      // momentum post-drag (px/s, positif = vers droite)
  let isDragging = false;
  let isHovered  = false;
  let prevX      = 0;
  let prevTime   = 0;
  let dragStartX = 0;      // pour distinguer tap vs swipe

  function loop(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    /* Auto-scroll (s'arrête au hover desktop) */
    if (!isHovered) pos -= BASE_SPEED * dt;

    /* Momentum post-drag */
    if (!isDragging) {
      if (Math.abs(extraVel) > 2) {
        pos      += extraVel * dt;
        extraVel *= Math.pow(0.88, dt * 60); // décroissance indépendante du framerate
      } else {
        extraVel = 0;
      }
    }

    /* Boucle infinie */
    const sw = set.offsetWidth;
    if (sw > 0) {
      while (pos < -sw) pos += sw;
      while (pos > 0)   pos -= sw;
    }

    track.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* Desktop : pause au hover */
  wrap.addEventListener('mouseenter', () => { isHovered = true;  }, { passive: true });
  wrap.addEventListener('mouseleave', () => { isHovered = false; }, { passive: true });

  /* Touch : drag direct */
  wrap.addEventListener('touchstart', e => {
    isDragging = true;
    extraVel   = 0;
    prevX = dragStartX = e.touches[0].clientX;
    prevTime   = Date.now();
  }, { passive: true });

  wrap.addEventListener('touchmove', e => {
    const x   = e.touches[0].clientX;
    const now = Date.now();
    const dx  = x - prevX;
    const dt  = now - prevTime || 16;

    pos      += dx;                       // contrôle direct de la position
    extraVel  = (dx / dt) * 1000;        // vitesse en px/s pour le momentum

    prevX    = x;
    prevTime = now;
  }, { passive: true });

  wrap.addEventListener('touchend', e => {
    isDragging = false;

    /* Tap (< 12px de déplacement total) → ouvrir lightbox */
    const totalMove = Math.abs(e.changedTouches[0].clientX - dragStartX);
    if (totalMove < 12) {
      const el = document.elementFromPoint(
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY
      );
      if (el && el.classList.contains('marquee-img')) openLb(el.src);
    }
  }, { passive: true });

  /* Lightbox */
  const lb = document.createElement('div');
  lb.id = 'marquee-lightbox';
  lb.innerHTML = '<img id="mlb-img" alt=""><button id="mlb-close">✕</button>';
  document.body.appendChild(lb);

  const lbImg = document.getElementById('mlb-img');
  const lbClose = document.getElementById('mlb-close');

  function openLb(src) { lbImg.src = src; lb.classList.add('open'); }
  const closeLb = () => lb.classList.remove('open');

  /* Clic desktop sur les photos */
  document.querySelectorAll('.marquee-img').forEach(img => {
    img.addEventListener('click', () => openLb(img.src));
  });

  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
})();

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
