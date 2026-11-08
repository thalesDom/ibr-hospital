// IBR Hospital — Médicos
const API = '../api/medicos.php';
let todosMedicos = [];
let tagAtiva = '';

// Cores por especialidade
const CORES = {
  'Cardiologia':          ['#c53030','#e53e3e'],
  'Ortopedia':            ['#2b6cb0','#3182ce'],
  'Neurologia':           ['#553c9a','#805ad5'],
  'Neurocirurgia':        ['#44337a','#6b46c1'],
  'Cirurgia Geral':       ['#276749','#38a169'],
  'Cirurgia Cardiovascular':['#9c4221','#dd6b20'],
  'Cirurgia Plástica':    ['#b7791f','#d69e2e'],
  'Cirurgia de Coluna':   ['#1a365d','#2b6cb0'],
  'Cirurgia':             ['#2c5282','#3182ce'],
  'Cirurgia Torácica':    ['#2d3748','#4a5568'],
  'Pneumologia':          ['#065666','#0987a0'],
  'Angiologia':           ['#322659','#553c9a'],
  'Bucomaxilofacial':     ['#7b341e','#c05621'],
  'Urologia':             ['#1a4731','#276749'],
  'Reumatologia':         ['#702459','#97266d'],
  'Nefrologia':           ['#1d4044','#285e61'],
  'Infectologia':         ['#1c4532','#276749'],
  'Pediatria':            ['#744210','#c05621'],
  'Oncologia':            ['#63171b','#9b2c2c'],
  'Hematologia':          ['#521b41','#97266d'],
  'Coloproctologia':      ['#3c366b','#553c9a'],
  'Endocrinologia':       ['#234e52','#285e61'],
  'Gastroenterologia':    ['#1a202c','#2d3748'],
  'Otorrinolaringologia': ['#2a4365','#2b6cb0'],
  'Psicologia':           ['#744210','#b7791f'],
  'Oftalmologia':         ['#065666','#0987a0'],
  'Dermatologia':         ['#744210','#c05621'],
};

function getCor(esp) {
  return CORES[esp] || ['#1a5ccc','#2e7ae0'];
}

function getInitials(nome) {
  const parts = nome.trim().split(' ').filter(p => p.length > 2);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nome.substring(0, 2).toUpperCase();
}

async function carregarMedicos() {
  try {
    const [rM, rE] = await Promise.all([
      fetch(`${API}?action=lista_publica`).then(r => r.json()),
      fetch(`${API}?action=especialidades`).then(r => r.json()),
    ]);

    if (rM.success && rM.medicos?.length) {
      todosMedicos = rM.medicos;
      renderMedicos(todosMedicos);
    } else {
      document.getElementById('emptyState').style.display = 'block';
      document.getElementById('medicosGrid').innerHTML = '';
    }

    if (rE.success) {
      const sel = document.getElementById('selectEsp');
      rE.especialidades.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.textContent = e;
        sel.appendChild(opt);
      });
    }
  } catch (e) {
    console.error('Erro ao carregar médicos:', e);
  }
}

function renderMedicos(lista) {
  const grid = document.getElementById('medicosGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('resultCount');

  if (!lista.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    count.textContent = '';
    return;
  }

  empty.style.display = 'none';
  count.textContent = `${lista.length} médico${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;

  grid.innerHTML = lista.map(m => {
    const [c1, c2] = getCor(m.especialidade);
    const initials = getInitials(m.nome);
    const nomeDisplay = m.titulo ? `${m.titulo} ${m.nome}` : m.nome;
    const sub = m.sub_especialidade ? `<p class="medico-esp">${m.sub_especialidade}</p>` : '';
    const estilo = `--c1:${c1};--c2:${c2};--t1:${c2}1a;--t2:${c2}40`;

    return `<div class="medico-card" style="${estilo}">
      <div class="medico-avatar">
        ${m.foto
          ? `<img src="${m.foto}" alt="${m.nome}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><span class="medico-initials" style="display:none">${initials}</span>`
          : `<span class="medico-initials">${initials}</span>`
        }
      </div>
      <div class="medico-body">
        <p class="medico-nome">${nomeDisplay}</p>
        ${sub}
        ${m.crm ? `<p class="medico-crm">CRM: ${m.crm}</p>` : ''}
        <span class="medico-badge">${m.especialidade}</span>
      </div>
    </div>`;
  }).join('');
}

function filtrarSelect() {
  const esp = document.getElementById('selectEsp').value;
  tagAtiva = esp;
  if (todosMedicos.length === 0) {
    carregarMedicos();
    return;
  }
  filtrar();
}

function filtrar() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const lista = todosMedicos.filter(m => {
    const matchTag = !tagAtiva || m.especialidade === tagAtiva;
    const matchQ   = !q || m.nome.toLowerCase().includes(q) || m.especialidade.toLowerCase().includes(q);
    return matchTag && matchQ;
  });
  renderMedicos(lista);
}

function setTag(btn, esp) {
  tagAtiva = esp;
  document.querySelectorAll('.esp-tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('selectEsp').value = esp;
  filtrar();
}

document.addEventListener('DOMContentLoaded', () => {
  carregarMedicos().then(() => {
    const params = new URLSearchParams(window.location.search);
    const q   = params.get('q') || '';
    const esp = params.get('esp') || '';
    if (q) document.getElementById('searchInput').value = q;
    if (esp) {
      document.getElementById('selectEsp').value = esp;
      tagAtiva = esp;
    }
    if (q || esp) filtrar();
  });

  // Hamburger menu mobile
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.querySelector('.nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
  }

  // Dropdown mobile
  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        var parent = this.parentElement;
        document.querySelectorAll('.nav-dropdown').forEach(function(item) {
          if (item !== parent) item.classList.remove('open');
        });
        parent.classList.toggle('open');
      }
    });
  });
});

// Navbar scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
});