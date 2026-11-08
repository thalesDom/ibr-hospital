// IBR Hospital — Dashboard shared utilities

const API = '../../api';

// ── Bfcache guard ──────────────────────────────────────────────
// Ao voltar pelo botão "voltar" do navegador, páginas elegíveis pro
// bfcache são restauradas da memória tal como estavam — sem disparar
// DOMContentLoaded de novo — então o checkAuth() abaixo nunca roda e
// o painel fica visível mesmo sem sessão válida. Força um reload real
// nesse caso, o que dispara o checkAuth normalmente.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

// ── Auth check ─────────────────────────────────────────────
async function checkAuth() {
  try {
    const r = await fetch(`${API}/auth.php?action=check`);
    const d = await r.json();
    if (!d.success) { window.location.href = '../login.html'; return null; }
    return d;
  } catch {
    window.location.href = '../login.html';
    return null;
  }
}

// ── Logout ──────────────────────────────────────────────────
async function logout() {
  await fetch(`${API}/auth.php`, { method: 'POST', body: new URLSearchParams({ action: 'logout' }) });
  window.location.href = '../login.html';
}

// ── Toast ───────────────────────────────────────────────────
function toast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.className = `toast toast--${type} show`;
  el.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      ${type === 'success'
        ? '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      }
    </svg>
    <span>${msg}</span>`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Controle de acesso por tela ───────────────────────────────
// Some do menu (e barra o acesso direto pela URL) as telas que o
// usuário logado não tem permissão de ver. Admin sempre vê tudo.
function aplicarControleDeAcesso(user) {
  const isAdmin     = user.nivel === 'admin';
  const permissoes  = user.permissoes || [];
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');

  if (!isAdmin) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
      const page = href.replace('.html', '');
      if (page === 'index') return; // Dashboard é sempre visível
      if (page === 'usuarios' || !permissoes.includes(page)) item.remove();
    });

    if (currentPage === 'usuarios' || (currentPage !== 'index' && !permissoes.includes(currentPage))) {
      window.location.href = 'index.html';
    }
  }
}

// ── DOMContentLoaded ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;

  aplicarControleDeAcesso(user);

  // Fill user info
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');
  const nome     = user.nome || 'Usuário';
  if (nameEl)   nameEl.textContent   = nome;
  if (roleEl)   roleEl.textContent   = user.nivel === 'admin' ? 'Administrador' : 'Editor';
  if (avatarEl) avatarEl.textContent = nome.charAt(0).toUpperCase();

  // Aviso enquanto a conta ainda usa a senha padrão de instalação
  if (user.senha_padrao) mostrarAvisoSenhaPadrao(user);

  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    if (confirm('Deseja sair do painel?')) logout();
  });

  // Sidebar toggle (mobile)
  const sidebar  = document.getElementById('sidebar');
  const backdrop = getSidebarBackdrop();
  document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    backdrop.classList.toggle('show', sidebar?.classList.contains('open'));
  });
  backdrop.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    backdrop.classList.remove('show');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    }
  });

  // ── Active nav: remove todos, aplica só no atual ──
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active'); // limpa hardcoded
    const href = item.getAttribute('href');
    if (!href) return;
    const itemPage = href.split('/').pop();
    if (itemPage === currentPage) {
      item.classList.add('active');
    }
  });

  await loadBadges();

  // Avisa as páginas que a autenticação terminou e os dados do
  // usuário/sidebar já estão prontos — evita depender de setTimeout
  // "no chute" para sincronizar o carregamento das listagens.
  document.dispatchEvent(new CustomEvent('ibr:ready', { detail: user }));
});

function getSidebarBackdrop() {
  let el = document.getElementById('sidebarBackdrop');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sidebarBackdrop';
    el.className = 'sidebar-backdrop';
    document.body.appendChild(el);
  }
  return el;
}

// Cache das duas chamadas abaixo — a página inicial do dashboard (index.js)
// precisa dos mesmos dados pra montar os cards de totais, então reaproveita
// isso em vez de disparar as mesmas duas requisições de novo.
let ibrBadgeData = null;

async function loadBadges() {
  try {
    const [rN, rC, rCt, rO] = await Promise.all([
      fetch(`${API}/noticias.php?action=lista`).then(r => r.json()),
      fetch(`${API}/vagas.php?action=curriculos&lido=0`).then(r => r.json()),
      fetch(`${API}/ouvidoria.php?action=lista&origem=contato&lido=0`).then(r => r.json()),
      fetch(`${API}/ouvidoria.php?action=lista&origem=ouvidoria&lido=0`).then(r => r.json()),
    ]);
    ibrBadgeData = { noticias: rN, curriculosNaoLidos: rC, contatoNaoLidos: rCt, ouvidoriaNaoLidos: rO };
    const bN  = document.getElementById('badgeNoticias');
    const bC  = document.getElementById('badgeCurriculos');
    const bCt = document.getElementById('badgeContato');
    const bO  = document.getElementById('badgeOuvidoria');
    if (bN  && rN.success)  { const n = rN.noticias?.length || 0; bN.textContent = n ? n : ''; }
    if (bC  && rC.success)  { const n = rC.curriculos?.length || 0; bC.textContent = n ? n : ''; }
    if (bCt && rCt.success) { const n = rCt.mensagens?.length || 0; bCt.textContent = n ? n : ''; }
    if (bO  && rO.success)  { const n = rO.mensagens?.length || 0; bO.textContent = n ? n : ''; }
  } catch {}
}

// ── Modal helpers ────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── Confirm dialog ───────────────────────────────────────────
function confirmDelete(msg, cb) {
  if (confirm(msg || 'Tem certeza que deseja excluir?')) cb();
}

// ── Format date ──────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// ── Segurança: texto vindo de visitantes (formulários, currículos) ──────
// Qualquer texto digitado por quem não é do painel deve passar por aqui
// ANTES de entrar em innerHTML — senão um nome como <img onerror=...>
// executaria no navegador do administrador.
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
// Contato/Ouvidoria já gravam o texto com entidades HTML (&lt; &quot;...).
// Decodifica para texto puro e só então escapa, para exibir certo sem duplicar.
function decodeEntities(s) {
  const t = document.createElement('textarea');
  t.innerHTML = String(s ?? '');   // textarea trata o conteúdo como texto: não executa nada
  return t.value;
}
// Devolve uma cópia do registro com todos os campos de texto seguros para innerHTML.
function safeFields(obj, jaVemComEntidades = false) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[k] = typeof v === 'string' ? esc(jaVemComEntidades ? decodeEntities(v) : v) : v;
  }
  return out;
}


// ── Aviso: senha padrão ─────────────────────────────────────────
function mostrarAvisoSenhaPadrao(user) {
  if (document.getElementById('avisoSenha')) return;
  const el = document.createElement('div');
  el.id = 'avisoSenha';
  el.className = 'aviso-senha';
  el.setAttribute('role', 'alert');
  el.innerHTML =
    '<span><strong>Troque a senha padrão.</strong> Esta conta ainda usa a senha de instalação — quem a conhece consegue entrar no painel.</span>' +
    (user.nivel === 'admin' ? '<a href="usuarios.html">Alterar agora</a>' : '');
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.insertAdjacentElement('afterend', el); else document.querySelector('.main')?.prepend(el);
}
