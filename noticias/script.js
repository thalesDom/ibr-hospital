// IBR Hospital — Notícias (listagem)

(function () {

  const API_URL = '../api/noticias.php';

  const gridEl    = document.getElementById('noticiasGrid');
  const loadingEl = document.getElementById('noticiasLoading');
  const emptyEl   = document.getElementById('noticiasEmpty');

  async function fetchNoticias() {
    try {
      const response = await fetch(`${API_URL}?action=lista_publica&limit=60`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success && Array.isArray(data.noticias) && data.noticias.length > 0) {
        renderNoticias(data.noticias);
      } else {
        emptyEl.style.display = 'block';
      }
    } catch (err) {
      console.warn('[IBR Notícias] Erro ao carregar:', err.message);
      emptyEl.style.display = 'block';
    } finally {
      loadingEl.style.display = 'none';
    }
  }

  function renderNoticias(noticias) {
    gridEl.innerHTML = '';
    noticias.forEach((noticia, i) => {
      const card = buildCard(noticia);
      gridEl.appendChild(card);
      setTimeout(() => card.classList.add('in-view'), i * 60 + 60);
    });
  }

  const ICON_CAL = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const ICON_ARROW = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function buildCard(noticia) {
    const card = document.createElement('a');
    card.className = 'noticia-card';

    const date    = formatDate(noticia.data_publicacao || '');
    const cat     = escHtml(noticia.categoria || 'Notícias');
    const title   = escHtml(noticia.titulo || 'Sem título');
    const excerpt = escHtml(noticia.resumo || '');
    const slug    = noticia.slug || '';
    const imgUrl  = noticia.imagem || '';

    // href continua existindo (abrir em nova aba, SEO), mas o clique normal abre o modal
    card.href = slug ? 'noticia.html?slug=' + encodeURIComponent(slug) : '#';

    card.innerHTML =
      '<div class="noticia-media">' +
        (imgUrl
          ? '<img class="noticia-img" src="' + escAttr(imgUrl) + '" alt="' + title + '" loading="lazy" onerror="this.remove();" />'
          : '<div class="noticia-img-placeholder"></div>') +
        '<span class="noticia-cat">' + cat + '</span>' +
      '</div>' +
      '<div class="noticia-body">' +
        (date ? '<span class="noticia-date">' + ICON_CAL + date + '</span>' : '') +
        '<h3>' + title + '</h3>' +
        (excerpt ? '<p>' + excerpt + '</p>' : '') +
        '<span class="noticia-readmore">Ler notícia ' + ICON_ARROW + '</span>' +
      '</div>';

    card.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      abrirModal(noticia);
    });

    return card;
  }

  /* ── Modal de leitura ─────────────────────────────────────── */
  let modalEl = null;
  let ultimoFoco = null;
  let reqId = 0;

  function criarModal() {
    modalEl = document.createElement('div');
    modalEl.className = 'nt-overlay';
    modalEl.innerHTML =
      '<div class="nt-modal" role="dialog" aria-modal="true" aria-labelledby="ntTitle">' +
        '<button class="nt-close" type="button" aria-label="Fechar">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<div class="nt-scroll">' +
          '<div class="nt-hero" id="ntHero"><img id="ntImg" alt="" /><span class="nt-cat" id="ntCat"></span></div>' +
          '<div class="nt-content">' +
            '<div class="nt-meta" id="ntMeta"></div>' +
            '<h2 id="ntTitle"></h2>' +
            '<div class="nt-body" id="ntBody"></div>' +
            '<div class="nt-actions">' +
              '<a class="nt-btn nt-btn--wa" id="ntWa" target="_blank" rel="noopener">Compartilhar no WhatsApp</a>' +
              '<button class="nt-btn nt-btn--ghost" id="ntCopy" type="button">Copiar link</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) fecharModal(); });
    modalEl.querySelector('.nt-close').addEventListener('click', fecharModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('open')) fecharModal();
    });
  }

  function textoParaHtml(texto) {
    return String(texto || '')
      .split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + escHtml(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  function linkDaNoticia(slug) {
    return slug ? new URL('noticia.html?slug=' + encodeURIComponent(slug), location.href).href : location.href;
  }

  function preencherModal(n, conteudoCompleto) {
    const titulo = n.titulo || 'Notícia';
    const longa = (n.data_publicacao ? new Date(String(n.data_publicacao).replace(' ', 'T')) : null);
    const dataLonga = longa && !isNaN(longa)
      ? longa.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

    const hero = modalEl.querySelector('#ntHero');
    const img = modalEl.querySelector('#ntImg');
    if (n.imagem) { img.src = n.imagem; img.alt = titulo; hero.style.display = ''; }
    else { img.removeAttribute('src'); hero.style.display = 'none'; }

    modalEl.querySelector('#ntCat').textContent = n.categoria || 'Notícias';
    modalEl.querySelector('#ntTitle').textContent = titulo;
    modalEl.querySelector('#ntMeta').innerHTML =
      (dataLonga ? '<span>' + ICON_CAL + dataLonga + '</span>' : '') +
      (n.autor ? '<span>Por ' + escHtml(n.autor) + '</span>' : '');

    const corpo = (conteudoCompleto && conteudoCompleto.trim()) ? conteudoCompleto : (n.resumo || '');
    modalEl.querySelector('#ntBody').innerHTML = textoParaHtml(corpo) || '<p>Sem conteúdo disponível.</p>';

    const url = linkDaNoticia(n.slug);
    modalEl.querySelector('#ntWa').href = 'https://wa.me/?text=' + encodeURIComponent(titulo + ' — ' + url);
    const copy = modalEl.querySelector('#ntCopy');
    copy.textContent = 'Copiar link';
    copy.onclick = function () {
      const ok = function () { copy.textContent = 'Link copiado!'; setTimeout(function () { copy.textContent = 'Copiar link'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, ok); else ok();
    };
  }

  async function abrirModal(noticia) {
    if (!modalEl) criarModal();
    ultimoFoco = document.activeElement;
    const id = ++reqId;

    // mostra já o que temos (título, imagem, resumo) e completa quando o texto chegar
    preencherModal(noticia, '');
    modalEl.querySelector('.nt-scroll').scrollTop = 0;
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalEl.querySelector('.nt-close').focus();

    if (!noticia.slug) return;
    try {
      const r = await fetch(API_URL + '?action=get_publica&slug=' + encodeURIComponent(noticia.slug), { headers: { 'Accept': 'application/json' } });
      const d = await r.json();
      if (id === reqId && d.success && d.noticia) preencherModal(Object.assign({}, noticia, d.noticia), d.noticia.conteudo || '');
    } catch (err) {
      console.warn('[IBR Notícias] Não foi possível carregar o texto completo:', err.message);
    }
  }

  function fecharModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  function formatDate(str) {
    if (!str) return '';
    try {
      const d = new Date(str.replace(' ', 'T'));
      if (isNaN(d)) return '';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(str) { return escHtml(str); }

  fetchNoticias();

  // ── Navbar scroll + hamburger ────────────────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = this.parentElement;
        document.querySelectorAll('.nav-dropdown').forEach(function (item) {
          if (item !== parent) item.classList.remove('open');
        });
        parent.classList.toggle('open');
      }
    });
  });

})();
