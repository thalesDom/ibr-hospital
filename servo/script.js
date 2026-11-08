// IBR Hospital — Serviços Médicos

(function () {
  // Navbar scroll
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Hamburger
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
  }

  // Dropdown mobile (Convênios / Fale Conosco)
  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        var parent = this.parentElement;
        document.querySelectorAll('.nav-dropdown').forEach(function (item) {
          if (item !== parent) item.classList.remove('open');
        });
        parent.classList.toggle('open');
      }
    });
  });

  // Reveal cards on scroll
  var cards = document.querySelectorAll('.srv-card');
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e, i) {
      if (e.isIntersecting) {
        setTimeout(function() { e.target.classList.add('visible'); }, i * 100);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(function(c) { io.observe(c); });
})();
/* ── Links das lojas do aplicativo do Servo ──────────────────────────
   Cole aqui os endereços oficiais quando o app estiver publicado.
   Enquanto estiverem vazios, o botão mostra um aviso em vez de abrir
   uma página quebrada. */
(function () {
  var LOJAS = {
    ios: '',      // ex.: 'https://apps.apple.com/br/app/servo/idXXXXXXXXX'
    android: ''   // ex.: 'https://play.google.com/store/apps/details?id=br.com.ibr.servo'
  };

  var toast = null, timer = 0;
  function aviso(msg) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'app-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('show'); }, 3200);
  }

  document.querySelectorAll('.app-store').forEach(function (a) {
    var url = LOJAS[a.dataset.loja];
    if (url) { a.href = url; return; }
    a.addEventListener('click', function (e) {
      e.preventDefault();
      aviso('O link de download estará disponível em breve.');
    });
  });
})();
