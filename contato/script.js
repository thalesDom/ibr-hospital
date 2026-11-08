// IBR Hospital — Contato

(function () {

  // ── Navbar scroll ──
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  // ── Hamburger ──
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  // ── Dropdown mobile (Convênios / Fale Conosco) ──
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

  // ── Máscara de telefone ──
  var telInput = document.getElementById('qTel');
  if (telInput) {
    telInput.addEventListener('input', function () {
      var v = telInput.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6)      v = '(' + v.substring(0,2) + ') ' + v.substring(2,7) + '-' + v.substring(7);
      else if (v.length > 2) v = '(' + v.substring(0,2) + ') ' + v.substring(2);
      else if (v.length > 0) v = '(' + v;
      telInput.value = v;
    });
  }

  // ── Enviar formulário ──
  var btnEnviar   = document.getElementById('btnEnviar');
  var formSuccess = document.getElementById('formSuccess');

  if (btnEnviar) {
    btnEnviar.addEventListener('click', function () {
      var nome    = document.getElementById('qNome').value.trim();
      var assunto = document.getElementById('qAssunto').value.trim();
      var msg     = document.getElementById('qMsg').value.trim();

      if (!assunto) { showToast('Informe o assunto da mensagem.'); return; }
      if (!msg)     { showToast('Escreva sua mensagem antes de enviar.'); return; }

      var payload = {
        nome:     nome,
        telefone: telInput ? telInput.value.trim() : '',
        assunto:  assunto,
        mensagem: msg
      };

      btnEnviar.disabled      = true;
      btnEnviar.textContent   = 'Enviando...';

      fetch('../api/contato.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          formSuccess.classList.remove('hidden');
          btnEnviar.style.display = 'none';
          document.getElementById('qNome').value    = '';
          document.getElementById('qTel').value     = '';
          document.getElementById('qAssunto').value = '';
          document.getElementById('qMsg').value     = '';
        } else {
          throw new Error(data.message || 'Erro desconhecido.');
        }
      })
      .catch(function (err) {
        console.error('Erro:', err);
        btnEnviar.disabled    = false;
        btnEnviar.textContent = 'Enviar Mensagem';
        showToast('Erro ao enviar. Tente novamente ou ligue: (77) 3425-8000.');
      });
    });
  }

  // ── Toast de erro ──
  function showToast(msg) {
    var existing = document.getElementById('ibr-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'ibr-toast';
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed', 'bottom:32px', 'right:32px', 'z-index:9999',
      'background:#e53e3e', 'color:#fff', 'padding:14px 22px',
      'border-radius:10px', 'font-size:.875rem', 'font-weight:600',
      'box-shadow:0 8px 24px rgba(229,62,62,.35)',
      'animation:fadeUp .3s ease'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
  }

})();