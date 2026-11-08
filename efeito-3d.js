/* Inclinação 3D das fotos empilhadas (segue o mouse, com suavização).
   Funciona em: .sobre-images (home) e .historia-imgs (página Sobre). */
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.sobre-images, .historia-imgs, .app-visual').forEach(function (box) {
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, active = false;

    function paint() {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      box.style.setProperty('--ry', (x * 10).toFixed(2));
      box.style.setProperty('--rx', (-y * 7).toFixed(2));
      box.style.setProperty('--gx', (40 + x * 40).toFixed(1));
      box.style.setProperty('--gy', (30 + y * 40).toFixed(1));
      if (active || Math.abs(x) > 0.002 || Math.abs(y) > 0.002) raf = requestAnimationFrame(paint);
      else raf = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(paint); }

    box.addEventListener('pointermove', function (e) {
      var r = box.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      active = true; kick();
    }, { passive: true });
    box.addEventListener('pointerleave', function () { tx = 0; ty = 0; active = false; kick(); });
  });
})();
