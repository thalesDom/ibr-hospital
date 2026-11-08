/* Barra do topo rola junto com a página (some ao descer);
   só o menu fica fixo — e sobe suavemente até encostar no topo. */
(function () {
  var tb = document.querySelector('.topbar');
  var nav = document.querySelector('.navbar');
  if (!tb || !nav) return;
  function update() {
    var h = tb.offsetHeight;
    nav.style.top = Math.max(0, h - window.scrollY) + 'px';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ── Submenus (Convênios / Fale Conosco) no menu do celular — iguais em TODAS as páginas ──
   Cada página tinha o seu próprio script/CSS para isso, e nos celulares reais (toque) vários
   falhavam: o "hover" que o toque deixa preso empurrava o submenu para fora da tela e, entre
   769 e 1024px, o script nem rodava. Aqui o comportamento é único: toca abre, toca de novo fecha. */
(function () {
  var html = document.documentElement;
  function modoMobile() {
    var h = document.querySelector('.nav-hamburger, .hamburger');
    return !!h && getComputedStyle(h).display !== 'none';
  }
  function sincronizar() { html.classList.toggle('nav-mobile', modoMobile()); }
  sincronizar();
  window.addEventListener('resize', sincronizar);
  window.addEventListener('orientationchange', sincronizar);
  window.addEventListener('load', sincronizar);

  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!modoMobile()) return;               // no computador continua abrindo por hover
      e.preventDefault();
      e.stopImmediatePropagation();            // evita o script antigo da página abrir/fechar de novo
      var item = link.parentElement;
      var abrir = !item.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
      var m = item.querySelector('.dropdown-menu'); if (m) m.classList.remove('open');
      if (abrir) item.classList.add('open');
      link.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    }, true);
  });
})();
