// IBR Hospital — Serviço Médico — script.js

// ── Navbar scroll ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

// ── Hamburger mobile ──
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

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

// ── Reveal rows on scroll ──
const rows = document.querySelectorAll('.servico-row');
const rowObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      rowObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
rows.forEach(r => rowObserver.observe(r));

// ── Modal ──
function openModal(id) {
  document.getElementById('modal-' + id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('open');
  document.body.style.overflow = '';
}

function closeOnOverlay(event, id) {
  if (event.target === event.currentTarget) closeModal(id);
}

// Fechar com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});
/* ── Modal: mesma foto do card + visual novo ───────────────────────────
   1) A foto do modal passa a ser a mesma do card (antes vinha de um banco
      de imagens da internet e não combinava com o serviço).
   2) "Confira os serviços disponíveis: A; B; C" vira etiquetas.
   3) Botões de ligar e WhatsApp no rodapé do modal. */
(function () {
  document.querySelectorAll('.modal-overlay').forEach(function (ov) {
    var id = ov.id.replace('modal-', '');

    // 1) foto do card
    var btn = document.querySelector('[onclick="openModal(\'' + id + '\')"]');
    var row = btn && btn.closest('.servico-row');
    var cardImg = row && row.querySelector('.servico-img img');
    var modalImg = ov.querySelector('.modal-img img');
    if (cardImg && modalImg && cardImg.getAttribute('src')) {
      modalImg.src = cardImg.getAttribute('src');
      if (cardImg.alt) modalImg.alt = cardImg.alt;
    }

    var text = ov.querySelector('.modal-text');
    if (!text) return;

    // 2) lista de serviços em etiquetas
    text.querySelectorAll('p').forEach(function (p) {
      var m = p.textContent.trim().match(/^(Confira[^:]*):\s*([\s\S]+)$/i);
      if (!m) return;
      var itens = m[2].replace(/\.\s*$/, '').split(';').map(function (s) { return s.trim(); }).filter(Boolean);
      if (itens.length < 2) return;
      var box = document.createElement('div');
      box.className = 'modal-servicos';
      var label = document.createElement('span');
      label.className = 'modal-servicos-label';
      label.textContent = 'Serviços disponíveis';
      var chips = document.createElement('div');
      chips.className = 'modal-chips';
      itens.forEach(function (t) {
        var c = document.createElement('span');
        c.textContent = t;
        chips.appendChild(c);
      });
      box.appendChild(label);
      box.appendChild(chips);
      p.replaceWith(box);
    });

    // 3) botões de contato
    var cta = document.createElement('div');
    cta.className = 'modal-cta';
    cta.innerHTML =
      '<a class="modal-cta-primary" href="tel:7734258000">Ligar (77) 3425-8000</a>' +
      '<a class="modal-cta-ghost" href="https://wa.me/557734258000" target="_blank" rel="noopener">WhatsApp</a>';
    text.appendChild(cta);
  });
})();
