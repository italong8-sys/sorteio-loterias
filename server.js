const express = require('express');
const path = require('path');
const { buscarConcurso } = require('./src/api');
const { gerarDezenas } = require('./src/generator');
const { salvarPalpite, carregarPalpites } = require('./src/storage');
const { analisarFrequencia, gerarPalpiteEstatistico } = require('./src/stats');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar para buscar concurso
async function tratarResultado(req, res) {
  const { modalidade, numero } = req.params;
  const dados = await buscarConcurso(modalidade, numero || '');
  if (dados && dados.numero) {
    res.json({ success: true, dados });
  } else {
    res.status(404).json({ success: false, message: 'Concurso não encontrado' });
  }
}

// Rota 1: Busca o último concurso (sem número)
app.get('/api/resultado/:modalidade', tratarResultado);

// Rota 2: Busca um concurso específico (com número)
app.get('/api/resultado/:modalidade/:numero', tratarResultado);

// Rota: Gerar Palpite
app.get('/api/gerar', async (req, res) => {
  const { modalidade = 'megasena', qtd = 6, tipo = 'aleatorio' } = req.query;
  const numQtd = parseInt(qtd, 10);
  const maxNum = modalidade === 'megasena' ? 60 : 80;

  let dezenas = [];
  if (tipo === 'estatistico') {
    const stats = await analisarFrequencia(modalidade, 15);
    if (stats) {
      dezenas = gerarPalpiteEstatistico(stats, numQtd, maxNum);
    } else {
      dezenas = gerarDezenas(numQtd, 1, maxNum);
    }
  } else {
    dezenas = gerarDezenas(numQtd, 1, maxNum);
  }

  res.json({ success: true, modalidade, dezenas, tipo });
});

// Rota: Consultar Estatísticas
app.get('/api/estatisticas/:modalidade', async (req, res) => {
  const { modalidade } = req.params;
  const stats = await analisarFrequencia(modalidade, 15);
  if (stats) res.json({ success: true, stats });
  else res.status(500).json({ success: false, message: 'Erro ao carregar estatísticas' });
});

// Rota: Histórico
app.get('/api/historico', (req, res) => {
  const historico = carregarPalpites();
  res.json({ success: true, historico });
});

// Rota: Salvar Palpite
app.post('/api/salvar', (req, res) => {
  const { modalidade, dezenas } = req.body;
  if (!modalidade || !dezenas || !Array.isArray(dezenas)) {
    return res.status(400).json({ success: false, message: 'Dados inválidos' });
  }
  salvarPalpite(modalidade, dezenas);
  res.json({ success: true, message: 'Palpite guardado com sucesso!' });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SERVIDOR WEB ONLINE EM: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
