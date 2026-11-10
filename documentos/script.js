// IBR Hospital — Documentos Institucionais
(function () {
  // ── Navbar scroll ──
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // ── Hamburger ──
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () { navLinks.classList.toggle('open'); });
  }

  // ── Lista de documentos (alimentada pela área restrita) ──
  var lista = document.getElementById('docsLista');
  if (!lista) return;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function urlSegura(u) { return /^\/uploads\/documentos\/[\w.\-]+$/.test(u) ? '..' + u : '#'; }

  function render(docs) {
    if (!docs.length) { lista.innerHTML = '<div class="docs-estado">Nenhum documento disponível no momento.</div>'; return; }
    lista.innerHTML = docs.map(function (d, i) {
      return '<div class="doc-item" style="transition-delay:' + Math.min(i, 8) * 70 + 'ms">' +
        '<span class="doc-nome">' + esc(d.titulo) + '</span>' +
        '<a class="doc-btn" href="' + esc(urlSegura(d.arquivo)) + '" target="_blank" rel="noopener" download>Download ' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>' +
        '</div>';
    }).join('');
    var itens = lista.querySelectorAll('.doc-item');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      itens.forEach(function (el) { el.classList.add('in'); });
    }); });
  }

  // textos da página (editáveis na área restrita)
  fetch('../api/documentos.php?textos=1').then(function (r) { return r.json(); }).then(function (j) {
    var t = (j && j.success && j.textos) || {};
    var sub = document.getElementById('docsSubtitulo'), av = document.getElementById('docsAviso');
    if (sub && typeof t.subtitulo === 'string' && t.subtitulo.trim()) sub.textContent = t.subtitulo;
    if (av && typeof t.aviso === 'string') { if (t.aviso.trim()) av.textContent = t.aviso; else av.style.display = 'none'; }
  }).catch(function () {});

  fetch('../api/documentos.php')
    .then(function (r) { return r.json(); })
    .then(function (j) { render(j && j.success ? (j.data || []) : []); })
    .catch(function () { lista.innerHTML = '<div class="docs-estado">Não foi possível carregar os documentos agora. Tente novamente em instantes.</div>'; });
})();
