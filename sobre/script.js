// IBR Hospital — Sobre
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
});

document.addEventListener('DOMContentLoaded', () => {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  // ── Hamburguer: abre/fecha menu e garante submenus fechados
  hamburger?.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });

  // ── Accordion mobile — inicia FECHADO, abre só ao clicar
  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth > 768) return;
      e.preventDefault();
      const menu = link.nextElementSibling;
      if (!menu || !menu.classList.contains('dropdown-menu')) return;
      // Fecha outros dropdowns abertos
      document.querySelectorAll('.dropdown-menu.open').forEach(m => {
        if (m !== menu) m.classList.remove('open');
      });
      menu.classList.toggle('open');
    });
  });

  // ── Fecha ao clicar fora
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) navLinks.classList.remove('open');
  });
});