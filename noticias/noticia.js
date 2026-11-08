// IBR Hospital — Notícia (detalhe)

(function () {

  const API_URL = '../api/noticias.php';

  const loadingEl = document.getElementById('detailLoading');
  const emptyEl   = document.getElementById('detailEmpty');
  const contentEl = document.getElementById('detailContent');

  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('slug') || '').trim();
  }

  async function fetchNoticia() {
    const slug = getSlug();
    if (!slug) {
      showEmpty();
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=get_publica&slug=${encodeURIComponent(slug)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.success && data.noticia) {
        renderNoticia(data.noticia);
      } else {
        showEmpty();
      }
    } catch (err) {
      console.warn('[IBR Notícia] Erro ao carregar:', err.message);
      showEmpty();
    }
  }

  function renderNoticia(n) {
    const title = n.titulo || 'Notícia';
    document.title = title + ' — IBR Hospital';
    document.getElementById('detailTitle').textContent = title;
    document.getElementById('detailCat').textContent = n.categoria || 'Notícias';
    document.getElementById('detailDate').textContent = formatDate(n.data_publicacao || '');

    const img = document.getElementById('detailImg');
    if (n.imagem) {
      img.src = n.imagem;
      img.alt = title;
      img.style.display = 'block';
    }

    const bodyEl = document.getElementById('detailBody');
    const texto = n.conteudo && n.conteudo.trim() ? n.conteudo : (n.resumo || '');
    bodyEl.innerHTML = texto
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${escHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('') || '<p>Sem conteúdo disponível.</p>';

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';
  }

  function showEmpty() {
    loadingEl.style.display = 'none';
    emptyEl.style.display = 'block';
  }

  function formatDate(str) {
    if (!str) return '';
    try {
      const d = new Date(str.replace(' ', 'T'));
      if (isNaN(d)) return '';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return ''; }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  fetchNoticia();

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
