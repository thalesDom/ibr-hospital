// IBR Hospital — Especialidades
// Busca dados da API (banco de dados)

(function () {

  var API = '../api/especialidades.php';

  var lista      = document.getElementById('espLista');
  var modaisCont = document.getElementById('modaisContainer');

  /* ══════════════════════════════════════
     BUSCA DA API
  ══════════════════════════════════════ */
  fetch(API)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.success || !d.data || !d.data.length) {
        lista.innerHTML = '<div style="text-align:center;padding:80px 24px;color:#94a3b8"><p style="font-size:1rem">Nenhuma especialidade cadastrada no momento.</p></div>';
        return;
      }
      // Filtra só as ativas
      var ativas = d.data.filter(function(e) { return e.status === 'ativo'; });
      if (!ativas.length) {
        lista.innerHTML = '<div style="text-align:center;padding:80px 24px;color:#94a3b8"><p style="font-size:1rem">Nenhuma especialidade disponível no momento.</p></div>';
        return;
      }
      renderizar(ativas);
    })
    .catch(function(err) {
      console.error('Erro ao carregar especialidades:', err);
      lista.innerHTML = '<div style="text-align:center;padding:80px 24px;color:#94a3b8"><p style="font-size:1rem">Erro ao carregar especialidades.</p></div>';
    });

  /* ══════════════════════════════════════
     RENDERIZAR LISTA + MODAIS
  ══════════════════════════════════════ */
  function renderizar(dados) {
    lista.innerHTML = '';
    modaisCont.innerHTML = '';

    dados.forEach(function(esp, idx) {
      var reverse = idx % 2 !== 0;

      // ── Row ──
      var row = document.createElement('div');
      row.className = 'esp-row' + (reverse ? ' reverse' : '');

      var imgDiv = document.createElement('div');
      imgDiv.className = 'esp-img';
      imgDiv.innerHTML = '<img src="' + esc(esp.imagem) + '" alt="' + esc(esp.titulo) + '" loading="lazy"/>';

      var infoDiv = document.createElement('div');
      infoDiv.className = 'esp-info';
      infoDiv.innerHTML =
        '<h2>' + esc(esp.titulo) + '</h2>' +
        '<p>' + esc(esp.desc_curta) + '</p>' +
        '<button class="btn-saiba-mais" data-modal="esp-' + esp.id + '">Saiba Mais</button>';

      row.appendChild(imgDiv);
      row.appendChild(infoDiv);
      lista.appendChild(row);

      // ── Modal ──
      var paragrafos = (esp.desc_completa || esp.desc_curta)
        .split('\n\n')
        .filter(function(p) { return p.trim(); })
        .map(function(p) { return '<p>' + esc(p.trim()) + '</p>'; })
        .join('');

      var overlay = document.createElement('div');
      overlay.className = 'esp-modal-overlay';
      overlay.id = 'modal-esp-' + esp.id;
      overlay.innerHTML =
        '<div class="esp-modal">' +
          '<button class="esp-modal-close" data-close="esp-' + esp.id + '">✕</button>' +
          '<div class="esp-modal-body">' +
            '<div class="esp-modal-img"><img src="' + esc(esp.imagem) + '" alt="' + esc(esp.titulo) + '"/></div>' +
            '<div class="esp-modal-text"><h2>' + esc(esp.titulo) + '</h2>' + paragrafos +
              '<div class="esp-modal-cta"><a class="esp-cta-primary" href="tel:7734258000">Agendar: (77) 3425-8000</a><a class="esp-cta-ghost" href="https://wa.me/557734258000" target="_blank" rel="noopener">WhatsApp</a></div></div>' +
          '</div>' +
        '</div>';

      modaisCont.appendChild(overlay);
    });

    // ── Reveal on scroll ──
    var rows = document.querySelectorAll('.esp-row');
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e, i) {
        if (e.isIntersecting) {
          setTimeout(function() { e.target.classList.add('visible'); }, i * 60);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    rows.forEach(function(r) { io.observe(r); });
  }

  /* ══════════════════════════════════════
     MODAL — abrir / fechar
  ══════════════════════════════════════ */
  function abrirModal(id) {
    var ov = document.getElementById('modal-' + id);
    if (!ov) return;
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function fecharModal(id) {
    var ov = document.getElementById('modal-' + id);
    if (!ov) return;
    ov.classList.remove('open');
    document.body.style.overflow = '';
  }

  function fecharTodos() {
    document.querySelectorAll('.esp-modal-overlay.open').forEach(function(ov) {
      ov.classList.remove('open');
    });
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function(e) {
    var btnModal = e.target.closest('[data-modal]');
    if (btnModal) { abrirModal(btnModal.dataset.modal); return; }

    var btnClose = e.target.closest('[data-close]');
    if (btnClose) { fecharModal(btnClose.dataset.close); return; }

    if (e.target.classList.contains('esp-modal-overlay')) { fecharTodos(); }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') fecharTodos();
  });

  /* ══════════════════════════════════════
     NAVBAR SCROLL + HAMBURGER
  ══════════════════════════════════════ */
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
  }

  // Dropdown mobile
document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function(link) {

  link.addEventListener('click', function(e) {

    if (window.innerWidth <= 768) {

      e.preventDefault();

      var parent = this.parentElement;

      document.querySelectorAll('.nav-dropdown').forEach(function(item) {
        if (item !== parent) {
          item.classList.remove('open');
        }
      });

      parent.classList.toggle('open');
    }

  });

});
  /* ── Escape HTML ── */
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();