/* ── script.js — uCode Landing Page Interactions ── */

// ── Navbar scroll effect ───────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ── Smooth scroll for anchor links ────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── Mini heatmap generator ─────────────────────────────────────
function buildMiniHeatmap() {
  const container = document.getElementById('mini-heatmap');
  if (!container) return;
  const levels = [0, 0, 1, 0, 2, 3, 1, 0, 0, 4, 2, 1, 0, 3, 2, 0, 1, 5, 3, 2,
                  1, 0, 2, 4, 3, 1, 0, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 5, 1, 0,
                  2, 3, 1, 0, 4, 2, 1, 3, 2, 0, 1, 3, 4, 2, 1, 0];
  const colors = ['#1e2433', '#2d5016', '#3d7a1a', '#5ba424', '#7bc832', '#a0e04a'];
  levels.forEach(lvl => {
    const cell = document.createElement('div');
    cell.className = 'hm-cell';
    cell.style.background = colors[lvl];
    container.appendChild(cell);
  });
}
buildMiniHeatmap();

// ── Intersection Observer for fade-in animations ───────────────
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, observerOptions);

// Animate feature cards, guide cards, install steps on scroll
const animateEls = document.querySelectorAll(
  '.feature-card, .guide-card, .install-step, .how-step, .tech-pill'
);
animateEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
  io.observe(el);
});

// ── Progress bar animation on scroll ──────────────────────────
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fills = entry.target.querySelectorAll('.mini-bar-fill');
      fills.forEach(fill => {
        const target = fill.style.width;
        fill.style.width = '0%';
        requestAnimationFrame(() => {
          setTimeout(() => { fill.style.width = target; }, 100);
        });
      });
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const miniBarSection = document.querySelector('.mini-bars');
if (miniBarSection) barObserver.observe(miniBarSection);

// ── Active nav link highlight on scroll ───────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle(
          'nav-link-active',
          link.getAttribute('href') === `#${entry.target.id}`
        );
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(section => navObserver.observe(section));

// ── Add nav-link-active style dynamically ─────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `.nav-link-active { color: var(--accent) !important; background: var(--accent-glow2) !important; }`;
document.head.appendChild(styleTag);

// ── Typed hero badge animation ─────────────────────────────────
const heroBadge = document.querySelector('.hero-badge');
if (heroBadge) {
  heroBadge.style.animation = 'fade-up 0.6s ease both';
}

// ── Copy-to-clipboard for code snippets ───────────────────────
document.querySelectorAll('.guide-code, .code-preview').forEach(block => {
  block.style.cursor = 'pointer';
  block.title = 'Click to copy';
  block.addEventListener('click', () => {
    const text = block.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const prev = block.style.outline;
      block.style.outline = '2px solid rgba(245,158,11,0.4)';
      block.style.outlineOffset = '3px';
      setTimeout(() => {
        block.style.outline = prev;
        block.style.outlineOffset = '0';
      }, 900);
    }).catch(() => {});
  });
});

// ── Particle / star burst on CTA button click ─────────────────
document.querySelectorAll('.btn-cta').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      createParticle(e.clientX, e.clientY);
    }
  });
});

function createParticle(x, y) {
  const p = document.createElement('span');
  p.style.cssText = `
    position: fixed;
    left: ${x}px; top: ${y}px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #f59e0b;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    animation: particle-burst 0.6s ease forwards;
  `;
  document.body.appendChild(p);

  const angle = Math.random() * Math.PI * 2;
  const dist = 30 + Math.random() * 50;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;

  p.animate([
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
  ], { duration: 500 + Math.random() * 200, easing: 'ease-out', fill: 'forwards' })
    .onfinish = () => p.remove();
}
