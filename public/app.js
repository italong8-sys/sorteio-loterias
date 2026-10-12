let currentModalidade = 'megasena';
let currentResultadoModalidade = 'megasena';
let currentConcursoNumero = null;
let ultimoPalpite = [];

const API_MEGASENA = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";
const API_QUINA = "https://servicebus2.caixa.gov.br/portaldeloterias/api/quina";

function init() {
  updateOptions();
  const naoExibir = localStorage.getItem('naoExibirTermos');
  if (naoExibir !== 'true') {
    abrirModalAjuda(true);
  }
}

function abrirModalAjuda(obrigatorio = false) {
  const modal = document.getElementById('modal-ajuda');
  const modalBody = document.getElementById('modal-body-content');
  const btnEntendi = document.getElementById('btn-entendi-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  modal.classList.remove('hidden');
  modalBody.scrollTop = 0;

  closeBtn.style.display = obrigatorio ? 'none' : 'block';
  btnEntendi.disabled = true;
  btnEntendi.innerText = 'Role até o fim para aceitar';

  function verificarScroll() {
    const rolouAteFim = modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 15;
    const semScrollNecessario = modalBody.scrollHeight <= modalBody.clientHeight;

    if (rolouAteFim || semScrollNecessario) {
      btnEntendi.disabled = false;
      btnEntendi.innerText = 'Entendi';
    }
  }

  modalBody.onscroll = verificarScroll;
  setTimeout(verificarScroll, 100);
}

function fecharModalAjuda() {
  const btnEntendi = document.getElementById('btn-entendi-modal');
  if (btnEntendi.disabled) return;

  const chk = document.getElementById('chk-nao-exibir');
  if (chk && chk.checked) {
    localStorage.setItem('naoExibirTermos', 'true');
  }

  document.getElementById('modal-ajuda').classList.add('hidden');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-jogo').classList.add('hidden');
  document.getElementById('tab-resultados').classList.add('hidden');
  document.getElementById('tab-historico').classList.add('hidden');

  if (tab === 'megasena' || tab === 'quina') {
    currentModalidade = tab;
    document.getElementById('tab-jogo').classList.remove('hidden');
    document.getElementById('jogo-titulo').innerText = tab === 'megasena' ? 'Mega-Sena' : 'Quina';
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.innerText.toLowerCase().includes(tab));
    if (activeBtn) activeBtn.classList.add('active');
    updateOptions();
    limparPalpite();
  } else if (tab === 'resultados') {
    document.getElementById('tab-resultados').classList.remove('hidden');
    event.target.classList.add('active');
    setResultadoModalidade(currentResultadoModalidade);
  } else if (tab === 'historico') {
    document.getElementById('tab-historico').classList.remove('hidden');
    event.target.classList.add('active');
    carregarHistorico();
  }
}

function updateOptions() {
  const select = document.getElementById('qtd-dezenas');
  select.innerHTML = '';
  const min = currentModalidade === 'megasena' ? 6 : 5;
  for (let i = min; i <= 15; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.innerText = `${i} Dezenas`;
    select.appendChild(opt);
  }
}

function limparPalpite() {
  document.getElementById('balls-container').innerHTML = '';
  document.getElementById('btn-salvar').classList.add('hidden');
  document.getElementById('stats-result').innerHTML = '';
  ultimoPalpite = [];
}

async function fetchCaixaAPI(modalidade, numero = '') {
  const baseUrl = modalidade === 'megasena' ? API_MEGASENA : API_QUINA;
  const url = numero ? `${baseUrl}/${numero}` : baseUrl;
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

function gerarDezenasUnicas(qtd, maxNum) {
  const dezenas = new Set();
  while (dezenas.size < qtd) {
    dezenas.add(Math.floor(Math.random() * maxNum) + 1);
  }
  return Array.from(dezenas).sort((a, b) => a - b);
}

async function gerarPalpite(tipo) {
  const qtd = parseInt(document.getElementById('qtd-dezenas').value, 10);
  const container = document.getElementById('balls-container');
  const maxNum = currentModalidade === 'megasena' ? 60 : 80;
  container.innerHTML = 'A gerar dezenas...';

  let dezenas = [];
  if (tipo === 'estatistico') {
    const stats = await obterEstatisticasLocais(currentModalidade, 15);
    if (stats) {
      const topQuentes = stats.maisFrequentes.map(i => i.numero);
      const palpiteSet = new Set();
      const qtdQuentes = Math.min(Math.ceil(qtd * 0.6), topQuentes.length);

      while (palpiteSet.size < qtdQuentes) {
        const idx = Math.floor(Math.random() * topQuentes.length);
        palpiteSet.add(topQuentes[idx]);
      }
      while (palpiteSet.size < qtd) {
        palpiteSet.add(Math.floor(Math.random() * maxNum) + 1);
      }
      dezenas = Array.from(palpiteSet).sort((a, b) => a - b);
    } else {
      dezenas = gerarDezenasUnicas(qtd, maxNum);
    }
  } else {
    dezenas = gerarDezenasUnicas(qtd, maxNum);
  }

  ultimoPalpite = dezenas;
  renderBalls(dezenas, container, currentModalidade);
  document.getElementById('btn-salvar').classList.remove('hidden');
}

function renderBalls(dezenas, container, modalidade) {
  container.innerHTML = '';
  dezenas.forEach(num => {
    const ball = document.createElement('div');
    ball.className = `ball ball-${modalidade}`;
    ball.innerText = String(num).padStart(2, '0');
    container.appendChild(ball);
  });
}

function salvarAtual() {
  if (!ultimoPalpite.length) return;
  let historico = JSON.parse(localStorage.getItem('palpitesSalvos') || '[]');
  historico.push({
    data: new Date().toLocaleString('pt-BR'),
    modalidade: currentModalidade,
    dezenas: ultimoPalpite
  });
  localStorage.setItem('palpitesSalvos', JSON.stringify(historico));
  alert('Palpite guardado com sucesso!');
}

async function obterEstatisticasLocais(modalidade, qtdConcursos = 15) {
  const ultimo = await fetchCaixaAPI(modalidade);
  if (!ultimo || !ultimo.numero) return null;

  const ultimoNum = ultimo.numero;
  const maxNum = modalidade === 'megasena' ? 60 : 80;
  const contagem = {};
  for (let i = 1; i <= maxNum; i++) contagem[i] = 0;

  const reqs = [];
  for (let i = 0; i < qtdConcursos; i++) {
    const n = ultimoNum - i;
    if (n > 0) reqs.push(fetchCaixaAPI(modalidade, n));
  }

  const resultados = await Promise.all(reqs);
  resultados.forEach(res => {
    if (res && res.listaDezenas) {
      res.listaDezenas.forEach(d => {
        const dez = parseInt(d, 10);
        if (contagem[dez] !== undefined) contagem[dez]++;
      });
    }
  });

  const ordenados = Object.entries(contagem)
    .map(([num, freq]) => ({ numero: parseInt(num, 10), frequencia: freq }))
    .sort((a, b) => b.frequencia - a.frequencia);

  return {
    maisFrequentes: ordenados.slice(0, 10),
    menosFrequentes: ordenados.slice(-10).reverse()
  };
}

async function carregarEstatisticas() {
  const box = document.getElementById('stats-result');
  box.innerHTML = 'A analisar histórico...';
  const stats = await obterEstatisticasLocais(currentModalidade, 15);
  if (stats) {
    const mais = stats.maisFrequentes.map(i => String(i.numero).padStart(2,'0')).join(', ');
    const menos = stats.menosFrequentes.map(i => String(i.numero).padStart(2,'0')).join(', ');
    box.innerHTML = `
      <p style="margin-top:8px;">🔥 <b>Mais Frequentes:</b> ${mais}</p>
      <p>❄️ <b>Menos Frequentes:</b> ${menos}</p>
    `;
  } else {
    box.innerHTML = 'Erro ao carregar estatísticas.';
  }
}

async function setResultadoModalidade(modalidade) {
  currentResultadoModalidade = modalidade;
  currentConcursoNumero = null;
  await consultarResultado(modalidade);
}

async function consultarResultado(modalidade, numero = '') {
  const box = document.getElementById('resultado-oficial-box');
  const nav = document.getElementById('nav-concurso');
  box.innerHTML = 'A consultar Caixa...';
  nav.classList.add('hidden');

  const d = await fetchCaixaAPI(modalidade, numero);
  if (d && d.numero) {
    currentConcursoNumero = parseInt(d.numero, 10);
    document.getElementById('input-concurso').value = currentConcursoNumero;

    let rateioHtml = '';
    if (d.listaRateioPremio && d.listaRateioPremio.length > 0) {
      rateioHtml += '<div class="rateio-container"><h4>💰 Valores Pagos por Faixa de Acertos:</h4><ul class="rateio-list">';
      d.listaRateioPremio.forEach(item => {
        const valorFmt = item.valorPremio ? item.valorPremio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
        const ganhadoresFmt = item.numeroDeGanhadores !== undefined ? item.numeroDeGanhadores.toLocaleString('pt-BR') : '0';
        rateioHtml += `<li class="rateio-linha">
          <span class="rateio-faixa">🎯 <b>${item.descricaoFaixa}</b></span>
          <span class="rateio-ganhadores">${ganhadoresFmt} aposta(s)</span>
          <span class="rateio-valor"><b>${valorFmt}</b></span>
        </li>`;
      });
      rateioHtml += '</ul></div>';
    }

    box.innerHTML = `
      <div style="text-align:center; margin-bottom:8px;">
        <span class="badge-modalidade ${modalidade}">${modalidade.toUpperCase()}</span>
      </div>
      <h3>Concurso ${d.numero} (${d.dataApuracao})</h3>
      <p style="margin: 6px 0;"><b>Acumulou?</b> ${d.acumulado ? '<span style="color:#e74c3c;font-weight:bold;">SIM</span>' : '<span style="color:#27ae60;font-weight:bold;">NÃO</span>'}</p>
      <div class="balls-grid"></div>
      ${rateioHtml}
      <p style="margin-top:14px;"><b>Estimativa Próximo Concurso:</b> <span style="color:#209869;font-weight:bold;">R$ ${d.valorEstimadoProximoConcurso ? d.valorEstimadoProximoConcurso.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</span></p>
    `;
    renderBalls(d.listaDezenas.map(Number), box.querySelector('.balls-grid'), modalidade);
    nav.classList.remove('hidden');
  } else {
    box.innerHTML = `<p style="color:#e74c3c; padding:10px 0;">Concurso <b>${numero}</b> não encontrado ou ainda não foi realizado.</p>`;
  }
}

async function mudarConcurso(delta) {
  if (!currentConcursoNumero) return;
  const novo = currentConcursoNumero + delta;
  if (novo < 1) return;
  await consultarResultado(currentResultadoModalidade, novo);
}

async function buscarConcursoManual() {
  const val = document.getElementById('input-concurso').value.trim();
  if (!val) return;
  await consultarResultado(currentResultadoModalidade, val);
}

function carregarHistorico() {
  const box = document.getElementById('historico-list');
  const historico = JSON.parse(localStorage.getItem('palpitesSalvos') || '[]');
  if (historico.length > 0) {
    box.innerHTML = '';
    historico.reverse().forEach(item => {
      const div = document.createElement('div');
      div.className = 'historico-item';
      const dezStr = item.dezenas.map(n => String(n).padStart(2, '0')).join(' - ');
      div.innerHTML = `
        <small>${item.data}</small>
        <p><b>${item.modalidade.toUpperCase()}</b>: [ ${dezStr} ]</p>
      `;
      box.appendChild(div);
    });
  } else {
    box.innerHTML = 'Nenhum palpite guardado ainda.';
  }
}

init();
