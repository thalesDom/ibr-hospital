// IBR Hospital — Ouvidoria

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

  // ── Stepper ──
  var step1       = document.getElementById('step1');
  var step2       = document.getElementById('step2');
  var stepSuccess = document.getElementById('stepSuccess');
  var btnNext     = document.getElementById('btnNext');
  var btnBack     = document.getElementById('btnBack');
  var btnSubmit   = document.getElementById('btnSubmit');
  var stepLine    = document.querySelector('.step-line');
  var steps       = document.querySelectorAll('.step');

  function setStep(n) {
    steps.forEach(function (s) { s.classList.remove('active', 'done'); });
    if (n === 1) {
      steps[0].classList.add('active');
      stepLine.classList.remove('active');
      step1.classList.remove('hidden');
      step2.classList.add('hidden');
      stepSuccess.classList.add('hidden');
    } else if (n === 2) {
      steps[0].classList.add('done');
      steps[1].classList.add('active');
      stepLine.classList.add('active');
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
      stepSuccess.classList.add('hidden');
      step2.style.animation = 'none';
      step2.offsetHeight;
      step2.style.animation = '';
    } else if (n === 3) {
      document.querySelector('.stepper').style.display = 'none';
      step2.classList.add('hidden');
      stepSuccess.classList.remove('hidden');
    }
    window.scrollTo({
      top: document.querySelector('.ouvidoria-section').offsetTop - 120,
      behavior: 'smooth'
    });
  }

  btnNext.addEventListener('click', function () { setStep(2); });
  btnBack.addEventListener('click', function () { setStep(1); });

  // ── Contador de caracteres ──
  var descricao = document.getElementById('descricao');
  var charCount = document.getElementById('charCount');
  descricao.addEventListener('input', function () {
    var len = descricao.value.length;
    if (len > 1000) descricao.value = descricao.value.substring(0, 1000);
    charCount.textContent = Math.min(len, 1000) + ' / 1000 caracteres';
  });

  // ── Máscara de telefone ──
  var telInput = document.getElementById('telefone');
  telInput.addEventListener('input', function () {
    var v = telInput.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 6)      v = '(' + v.substring(0,2) + ') ' + v.substring(2,7) + '-' + v.substring(7);
    else if (v.length > 2) v = '(' + v.substring(0,2) + ') ' + v.substring(2);
    else if (v.length > 0) v = '(' + v;
    telInput.value = v;
  });

  // ── Enviar ──
  btnSubmit.addEventListener('click', function () {
    var tipo    = document.getElementById('tipo').value;
    var descVal = document.getElementById('descricao').value.trim();

    if (!tipo)    { showError('tipo',      'Selecione o tipo de manifestação.'); return; }
    if (!descVal) { showError('descricao', 'Descreva sua manifestação.');        return; }

    var tipoLabel = {
      elogio: 'Elogio', sugestao: 'Sugestão', reclamacao: 'Reclamação',
      denuncia: 'Denúncia', informacao: 'Solicitação de Informação'
    }[tipo] || tipo;

    var payload = {
      tipo:      tipoLabel,
      nome:      document.getElementById('nome').value.trim(),
      email:     document.getElementById('email').value.trim(),
      telefone:  document.getElementById('telefone').value.trim(),
      setor:     document.getElementById('setor').value.trim(),
      descricao: descVal
    };

    // Loading
    var btnText = document.getElementById('btnSubmitText');
    btnSubmit.disabled = true;
    btnText.textContent = 'Enviando...';

    // Chama o endpoint PHP
    // O arquivo ouvidoria.php fica em /api/ouvidoria.php na raiz do projeto
    fetch('../api/ouvidoria.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success) {
        setStep(3);
      } else {
        throw new Error(data.message || 'Erro desconhecido.');
      }
    })
    .catch(function (err) {
      console.error('Erro:', err);
      btnSubmit.disabled  = false;
      btnText.textContent = 'Enviar Manifestação';
      showToast('Erro ao enviar. Tente novamente ou ligue: (77) 3425-8000.');
    });
  });

  // ── Helper: destaca campo inválido ──
  function showError(fieldId, msg) {
    var el = document.getElementById(fieldId);
    el.style.borderColor = '#e53e3e';
    el.style.boxShadow   = '0 0 0 3px rgba(229,62,62,.12)';
    el.focus();
    el.addEventListener('input', function () {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    }, { once: true });
    showToast(msg);
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