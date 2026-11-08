// IBR Hospital — Login
document.addEventListener('DOMContentLoaded', () => {
  // Redireciona se já logado
  fetch('../api/auth.php?action=check')
    .then(r => r.json())
    .then(d => { if (d.success) window.location.href = 'dashboard/index.html'; })
    .catch(() => {});

  const form    = document.getElementById('loginForm');
  const btnLogin = document.getElementById('btnLogin');
  const errEl   = document.getElementById('formError');
  const togglePass = document.getElementById('togglePass');
  const senhaInput = document.getElementById('senha');

  togglePass?.addEventListener('click', () => {
    senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    errEl.classList.remove('show');
    btnLogin.classList.add('loading');
    btnLogin.querySelector('span').textContent = 'Entrando...';

    const body = new FormData();
    body.append('action', 'login');
    body.append('email', document.getElementById('email').value);
    body.append('senha', senhaInput.value);

    try {
      const res  = await fetch('../api/auth.php', { method: 'POST', body });
      const data = await res.json();

      if (data.success) {
        window.location.href = 'dashboard/index.html';
      } else {
        errEl.textContent = data.message || 'Email ou senha incorretos.';
        errEl.classList.add('show');
      }
    } catch {
      errEl.textContent = 'Erro de conexão. Tente novamente.';
      errEl.classList.add('show');
    } finally {
      btnLogin.classList.remove('loading');
      btnLogin.querySelector('span').textContent = 'Entrar';
    }
  });
});