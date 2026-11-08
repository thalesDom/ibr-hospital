// IBR Hospital — Trabalhe Conosco
const API = '../api/vagas.php';

let vagaAtual = null;

// ── Carregar vagas ──────────────────────────────────────────
async function carregarVagas() {
  try {
    const r = await fetch(`${API}?action=publicas`);
    const d = await r.json();

    document.getElementById('vagasLoading').style.display = 'none';

    if (!d.success || !d.vagas?.length) {
      document.getElementById('vagasEmpty').style.display = 'block';
      return;
    }

    const grid = document.getElementById('vagasGrid');
    grid.style.display = 'grid';

    grid.innerHTML = d.vagas.map(v => `
      <div class="vaga-card">
        <div class="vaga-top">
          <h3>${escHtml(v.titulo)}</h3>
          <span class="vaga-badge">${escHtml(v.tipo)}</span>
        </div>
        <div class="vaga-depto">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          ${escHtml(v.departamento)}
        </div>
        ${v.salario ? `
        <div class="vaga-info">
          <span class="vaga-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            ${escHtml(v.salario)}
          </span>
        </div>` : ''}
        ${v.descricao ? `<p class="vaga-desc">${escHtml(v.descricao)}</p>` : ''}
        <button class="btn-candidatar" onclick="abrirFormulario(${JSON.stringify(v).replace(/"/g, '&quot;')})">
          Candidatar-se
        </button>
      </div>
    `).join('');

  } catch (e) {
    document.getElementById('vagasLoading').style.display = 'none';
    document.getElementById('vagasEmpty').style.display = 'block';
  }
}

// ── Abrir formulário ────────────────────────────────────────
function abrirFormulario(vaga) {
  vagaAtual = vaga;
  limparForm();

  const titulo = vaga ? vaga.titulo : 'Candidatura Espontânea';
  const depto  = vaga ? vaga.departamento : 'Envie seu currículo para futuras oportunidades';

  document.getElementById('modalVagaTitulo').textContent = titulo;
  document.getElementById('modalVagaDepto').textContent  = depto;
  document.getElementById('fVagaId').value = vaga?.id || '';

  document.getElementById('modalForm').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modalForm').classList.remove('open');
  document.body.style.overflow = '';
  limparForm();
}

function limparForm() {
  document.getElementById('fNome').value     = '';
  document.getElementById('fEmail').value    = '';
  document.getElementById('fTelefone').value = '';
  document.getElementById('fMensagem').value = '';
  document.getElementById('fArquivo').value  = '';
  document.getElementById('fileName').textContent = '';
  document.getElementById('fileUpload').classList.remove('has-file');
  document.getElementById('formError').classList.remove('show');
  document.getElementById('formSuccess').classList.remove('show');
}

// ── File handler ────────────────────────────────────────────
function handleFile(input) {
  const file = input.files[0];
  if (!file) return;

  const maxSize = 5 * 1024 * 1024;
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (!allowed.includes(file.type)) {
    showError('Formato inválido. Use PDF, DOC ou DOCX.');
    input.value = '';
    return;
  }
  if (file.size > maxSize) {
    showError('Arquivo muito grande. Máximo 5MB.');
    input.value = '';
    return;
  }

  document.getElementById('fileName').textContent = `✓ ${file.name}`;
  document.getElementById('fileUpload').classList.add('has-file');
}

// ── Enviar currículo ────────────────────────────────────────
async function enviarCurriculo() {
  const nome     = document.getElementById('fNome').value.trim();
  const email    = document.getElementById('fEmail').value.trim();
  const telefone = document.getElementById('fTelefone').value.trim();
  const mensagem = document.getElementById('fMensagem').value.trim();
  const vagaId   = document.getElementById('fVagaId').value;
  const arquivo  = document.getElementById('fArquivo').files[0];

  if (!nome) return showError('Por favor, informe seu nome.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Informe um email válido.');

  const btn = document.getElementById('btnEnviar');
  btn.disabled = true;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Enviando...`;

  const body = new FormData();
  body.append('action', 'curriculo');
  body.append('nome', nome);
  body.append('email', email);
  body.append('telefone', telefone);
  body.append('mensagem', mensagem);
  if (vagaId) body.append('vaga_id', vagaId);
  if (arquivo) body.append('curriculo', arquivo);

  try {
    const r = await fetch(API, { method: 'POST', body });
    const d = await r.json();

    if (d.success) {
      document.getElementById('formError').classList.remove('show');
      document.getElementById('formSuccess').textContent = d.message || 'Currículo enviado com sucesso! Entraremos em contato.';
      document.getElementById('formSuccess').classList.add('show');
      btn.style.display = 'none';
      document.querySelector('.btn-cancelar').textContent = 'Fechar';
    } else {
      showError(d.message || 'Erro ao enviar. Tente novamente.');
    }
  } catch {
    showError('Erro de conexão. Tente novamente.');
  } finally {
    if (!document.getElementById('formSuccess').classList.contains('show')) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Enviar Candidatura`;
    }
  }
}

function showError(msg) {
  const el = document.getElementById('formError');
  el.textContent = msg;
  el.classList.add('show');
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Fechar modal clicando fora ──────────────────────────────
document.addEventListener('click', e => {
  if (e.target.id === 'modalForm') fecharModal();
});

// ── Spin animation ──────────────────────────────────────────
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

// ── Navbar scroll + hamburger ────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', function () {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
}

// Dropdown mobile
document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function (link) {
  link.addEventListener('click', function (e) {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      const parent = this.parentElement;
      document.querySelectorAll('.nav-dropdown').forEach(function (item) {
        if (item !== parent) item.classList.remove('open');
      });
      parent.classList.toggle('open');
    }
  });
});

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', carregarVagas);