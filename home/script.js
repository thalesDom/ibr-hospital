/* ═══════════════════════════════════════════════════════════
   IBR HOSPITAL — main.js
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar scroll ──────────────────────────────────────
  const navbar  = document.getElementById('navbar');
  const btt     = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
    btt.classList.toggle('visible', y > 400);
  }, { passive: true });

  btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── Mobile hamburger ──────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });

  // ── Mobile accordion — FORA do hamburger click ────────
document.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth > 768) return;
    e.preventDefault();
    const menu = link.nextElementSibling;
    if (!menu) return;
    menu.classList.toggle('open');
  });
});

  // Close on outside click
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) navLinks.classList.remove('open');
  });

  // ── Intersection Observer — section headers ────────────
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section-header').forEach(el => io.observe(el));

  // ── Staggered cards observer ──────────────────────────
  const cardIo = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll(
          '.servico-card, .esp-card, .qa-card, .noticia-card'
        );
        cards.forEach((card, i) => {
          setTimeout(() => card.classList.add('in-view'), i * 90);
        });
        cardIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.servicos-grid, .esp-grid, .qa-grid, .noticias-grid'
  ).forEach(el => cardIo.observe(el));

  // ── Sobre images observer ─────────────────────────────
  const sobreIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        sobreIo.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.sobre-images').forEach(el => sobreIo.observe(el));

  // ── Animated counters ─────────────────────────────────
  const counterIo = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach(el => counterIo.observe(el));

  function animateCounter(el) {
    const target   = +el.dataset.target;
    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── AOS (data-aos) observer ───────────────────────────
  const aosIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('aos-visible');
        aosIo.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-aos]').forEach(el => aosIo.observe(el));

  // ── Smooth scroll for anchor links ───────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
        navLinks.classList.remove('open');
      }
    });
  });

});

/* ═══════════════════════════════════════════════════════════
   IBR HOSPITAL — slider.js
   Hero carousel controller
═══════════════════════════════════════════════════════════ */

// Os slides vêm do painel (api/hero.php, menu "Slide"). Se a API
// falhar ou a tabela estiver vazia, os 3 slides fixos que já estão
// no HTML continuam servindo de fallback — o hero nunca fica vazio.
document.addEventListener('DOMContentLoaded', async () => {

  const heroSlidesEl = document.getElementById('heroSlides');
  const heroDotsEl   = document.getElementById('heroDots');

  try {
    const r = await fetch('../api/hero.php');
    const d = await r.json();
    if (d.success && d.slides?.length && heroSlidesEl && heroDotsEl) {
      const posMap = { center: 'center center', top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' };
      const phoneIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.4 2.18 2 2 0 012.38 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>';

      heroSlidesEl.innerHTML = d.slides.map((s, i) => {
        const titulo = s.destaque && s.titulo.includes(s.destaque)
          ? s.titulo.replace(s.destaque, `<em>${s.destaque}</em>`)
          : s.titulo;
        return `<div class="hero-slide${i === 0 ? ' active' : ''}" data-slide="${i}">
          <div class="hero-bg"></div>
          <div class="hero-scrim"></div>
          <div class="hero-inner">
            <div class="hero-content">
              ${s.eyebrow ? `<span class="hero-eyebrow">${s.eyebrow}</span>` : ''}
              <h1 class="hero-title">${titulo}</h1>
              ${s.descricao ? `<p class="hero-desc">${s.descricao}</p>` : ''}
              <div class="hero-ctas">
                <a href="#agendar" class="btn-hero-primary">Agendar Consulta</a>
                <a href="tel:7734258000" class="btn-hero-ghost">${phoneIcon}(77) 3425-8000</a>
              </div>
            </div>
            <div class="hero-visual">
              <div class="hero-visual-frame">
                <img src="${s.imagem}" alt="${s.eyebrow || 'IBR Hospital'}" style="object-position:${posMap[s.imagem_pos] || 'center center'}" loading="${i === 0 ? 'eager' : 'lazy'}" />
              </div>
            </div>
          </div>
        </div>`;
      }).join('');

      heroDotsEl.innerHTML = d.slides.map((_, i) => `<button class="hero-dot${i === 0 ? ' active' : ''}" data-dot="${i}"></button>`).join('');
    }
  } catch {
    // API indisponível — mantém os slides fixos do HTML.
  }

  const slides   = document.querySelectorAll('.hero-slide');
  const dots     = document.querySelectorAll('.hero-dot');
  const prevBtn  = document.getElementById('heroPrev');
  const nextBtn  = document.getElementById('heroNext');

  if (!slides.length) return;

  let current  = 0;
  let timer    = null;
  const DELAY  = 4000;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, DELAY);
  }

  function resetAuto() {
    startAuto();
  }

  // Buttons
  nextBtn?.addEventListener('click', () => { next(); resetAuto(); });
  prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });

  // Dot clicks
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(+dot.dataset.dot);
      resetAuto();
    });
  });

  // Touch swipe
  let touchStartX = 0;
  const heroEl = document.querySelector('.hero');

  heroEl?.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  heroEl?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
      resetAuto();
    }
  }, { passive: true });

  // Pause on hover
  heroEl?.addEventListener('mouseenter', () => clearInterval(timer));
  heroEl?.addEventListener('mouseleave', startAuto);

  // Init
  startAuto();

});

/* ═══════════════════════════════════════════════════════════
   IBR HOSPITAL — noticias.js
   Fetches latest news from PHP/MySQL API endpoint
═══════════════════════════════════════════════════════════ */

(function () {

  // ── Config ─────────────────────────────────────────────
  // Adjust this path to match your server setup
  const API_URL    = '../api/noticias.php';
  const MAX_NEWS   = 3;

  // ── Elements ───────────────────────────────────────────
  const gridEl    = document.getElementById('noticiasGrid');
  const loadingEl = document.getElementById('noticiasLoading');
  const errorEl   = document.getElementById('noticiasError');

  if (!gridEl) return;

  // ── Fetch ──────────────────────────────────────────────
  async function fetchNoticias() {
    try {
      const response = await fetch(`${API_URL}?limit=${MAX_NEWS}&action=latest`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success && Array.isArray(data.noticias) && data.noticias.length > 0) {
        renderNoticias(data.noticias);
      } else {
        throw new Error('Nenhuma notícia encontrada');
      }

    } catch (err) {
      console.warn('[IBR Notícias] Erro ao carregar:', err.message);
      renderFallback();
    } finally {
      loadingEl && (loadingEl.style.display = 'none');
    }
  }

  // ── Render cards ──────────────────────────────────────
  function renderNoticias(noticias) {
    gridEl.innerHTML = '';

    noticias.forEach((noticia, i) => {
      const card = buildCard(noticia, i);
      gridEl.appendChild(card);

      // Staggered entrance
      setTimeout(() => card.classList.add('in-view'), i * 100 + 80);
    });
  }

  function buildCard(noticia, index) {
    const card = document.createElement('article');
    card.className = 'noticia-card';

    const date    = formatDate(noticia.data_publicacao || noticia.created_at || '');
    const cat     = noticia.categoria || 'Notícias';
    const title   = escHtml(noticia.titulo || 'Sem título');
    const excerpt = escHtml(noticia.resumo || noticia.conteudo?.substring(0, 120) || '');
    const slug    = noticia.slug || `#noticia-${noticia.id}`;
    const imgUrl  = noticia.imagem || noticia.foto || '';

    card.innerHTML = `
      ${imgUrl
        ? `<img class="noticia-img" src="${escAttr(imgUrl)}" alt="${title}" loading="lazy" onerror="this.parentElement.querySelector('.noticia-img-placeholder')?.remove(); this.remove();" />`
        : `<div class="noticia-img-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg></div>`
      }
      <div class="noticia-body">
        <div class="noticia-meta">
          <span class="noticia-cat">${cat}</span>
          ${date ? `<span class="noticia-date">${date}</span>` : ''}
        </div>
        <h3>${title}</h3>
        ${excerpt ? `<p>${excerpt}</p>` : ''}
      </div>
    `;

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = slug.startsWith('#') ? slug : `../noticias/noticia.html?slug=${encodeURIComponent(slug)}`;
    });

    return card;
  }

  // ── Fallback (demo cards when API unavailable) ────────
  function renderFallback() {
    const fallbackNews = [
      {
        titulo: 'IBR Hospital conquista certificação ONA de Excelência',
        resumo: 'O Instituto Brandão de Reabilitação reafirma seu compromisso com a qualidade e segurança no atendimento ao paciente.',
        categoria: 'Institucional',
        data_publicacao: new Date().toISOString(),
        imagem: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&q=80',
        slug: '#'
      },
      {
        titulo: 'Nova ala de diagnóstico por imagem amplia capacidade do hospital',
        resumo: 'Equipamentos de última geração em ressonância magnética e tomografia computadorizada chegam ao IBR para oferecer diagnósticos mais precisos.',
        categoria: 'Estrutura',
        data_publicacao: new Date(Date.now() - 86400000 * 3).toISOString(),
        imagem: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
        slug: '#'
      },
      {
        titulo: 'Campanha de saúde cardiovascular: consultas gratuitas em junho',
        resumo: 'Durante o mês de junho, o IBR Hospital realiza triagem cardiovascular gratuita para a população de Vitória da Conquista.',
        categoria: 'Campanhas',
        data_publicacao: new Date(Date.now() - 86400000 * 7).toISOString(),
        imagem: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&q=80',
        slug: '#'
      }
    ];

    renderNoticias(fallbackNews);
  }

  // ── Helpers ───────────────────────────────────────────
  function formatDate(str) {
    if (!str) return '';
    try {
      const d = new Date(str);
      if (isNaN(d)) return '';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) { return escHtml(str); }

  // ── Init ──────────────────────────────────────────────
  fetchNoticias();

})();

/* ═══════════════════════════════════════════════════════════
   IBR HOSPITAL — animations.js
   Extra animation triggers
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar logo color on scroll ───────────────────────
  // (handled in main.js via .scrolled class)

  // ── Parallax subtle effect on hero bg ─────────────────
  const heroBgs = document.querySelectorAll('.hero-bg');
  if (heroBgs.length) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.5) {
        heroBgs.forEach(bg => {
          bg.style.transform = `scale(1) translateY(${y * 0.15}px)`;
        });
      }
    }, { passive: true });
  }

  // ── Number counter for hero stats ─────────────────────
  // Hero stat numbers are static but get a count-up on page load
  const heroStats = document.querySelectorAll('.stat-num');
  heroStats.forEach(el => {
    const text = el.textContent.trim();
    const num  = parseInt(text.replace(/\D/g, ''));
    const suffix = text.replace(/[\d]/g, '');
    if (!num || isNaN(num) || num > 999) return; // skip "24h", "Top 100"

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    function step(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * num) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    // Delay for hero entrance
    setTimeout(() => requestAnimationFrame(step), 800);
  });

  // ── Hover tilt on service cards ───────────────────────
  document.querySelectorAll('.servico-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-4px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ── Typed text effect on hero eyebrow (optional) ──────
  // Disabled by default; enable if desired

});

// ── Busca de médico ──────────────────────────────────────
function buscarMedico() {
  const nome = document.getElementById('homeBuscaNome')?.value.trim() || '';
  const esp  = document.getElementById('homeBuscaEsp')?.value || '';
  const params = new URLSearchParams();
  if (nome) params.set('q', nome);
  if (esp)  params.set('esp', esp);
  const query = params.toString();
  window.location.href = `../medicos/index.html${query ? '?' + query : ''}`;
}

// Enter na busca
document.getElementById('homeBuscaNome')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarMedico();
});