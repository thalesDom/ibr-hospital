// IBR Hospital — Dashboard Home
// script.js já faz auth check e carrega user info

document.addEventListener('ibr:ready', async () => {
  try {
    // noticias.php?action=lista, vagas.php?action=curriculos&lido=0 e as
    // duas chamadas de mensagens não lidas já foram buscadas pelo
    // loadBadges() do script.js — reaproveita em vez de repetir.
    const [rV, rC, rS] = await Promise.all([
      fetch(`${API}/vagas.php?action=lista`).then(r => r.json()),
      fetch(`${API}/vagas.php?action=curriculos`).then(r => r.json()),
      fetch(`${API}/hero.php?action=lista`).then(r => r.json()),
    ]);
    const rN  = ibrBadgeData?.noticias;
    const rNL = ibrBadgeData?.curriculosNaoLidos;
    const rCt = ibrBadgeData?.contatoNaoLidos;
    const rOu = ibrBadgeData?.ouvidoriaNaoLidos;

    if (rN?.success) document.getElementById('totalNoticias').textContent = rN.noticias?.length || 0;
    if (rV.success) {
      const abertas = rV.vagas?.filter(v => v.ativo == 1).length || 0;
      document.getElementById('totalVagas').textContent = abertas;
    }
    if (rC.success) document.getElementById('totalCurriculos').textContent = rC.curriculos?.length || 0;
    if (rNL?.success) document.getElementById('naoLidos').textContent = rNL.curriculos?.length || 0;
    if (rCt?.success && rOu?.success) {
      document.getElementById('totalMensagens').textContent = (rCt.mensagens?.length || 0) + (rOu.mensagens?.length || 0);
    }
    if (rS.success) {
      const ativos = rS.slides?.filter(s => s.ativo == 1).length || 0;
      document.getElementById('totalSlides').textContent = ativos;
    }
  } catch (e) {
    console.error(e);
  }
});