const { buscarConcurso } = require('./api');

async function analisarFrequencia(modalidade, qtdConcursos = 15) {
  const ultimo = await buscarConcurso(modalidade);
  if (!ultimo || !ultimo.numero) return null;

  const ultimoNum = ultimo.numero;
  const maxNum = modalidade === 'megasena' ? 60 : 80;
  const contagem = {};

  for (let i = 1; i <= maxNum; i++) contagem[i] = 0;

  const requisicoes = [];
  for (let i = 0; i < qtdConcursos; i++) {
    const num = ultimoNum - i;
    if (num > 0) requisicoes.push(buscarConcurso(modalidade, num));
  }

  const resultados = await Promise.all(requisicoes);

  resultados.forEach(res => {
    if (res && res.listaDezenas) {
      res.listaDezenas.forEach(d => {
        const dezena = parseInt(d, 10);
        if (contagem[dezena] !== undefined) contagem[dezena]++;
      });
    }
  });

  const ordenados = Object.entries(contagem)
    .map(([num, freq]) => ({ numero: parseInt(num, 10), frequencia: freq }))
    .sort((a, b) => b.frequencia - a.frequencia);

  return {
    ultimoConcurso: ultimoNum,
    totalAnalisados: resultados.length,
    maisFrequentes: ordenados.slice(0, 10),
    menosFrequentes: ordenados.slice(-10).reverse(),
    todos: ordenados
  };
}

function gerarPalpiteEstatistico(estatisticas, qtdNumeros, maxNum) {
  const topQuentes = estatisticas.maisFrequentes.map(item => item.numero);
  const palpite = new Set();

  // Seleciona ~60% das dezenas do grupo de números mais frequentes
  const qtdQuentes = Math.min(Math.ceil(qtdNumeros * 0.6), topQuentes.length);
  while (palpite.size < qtdQuentes) {
    const randomIdx = Math.floor(Math.random() * topQuentes.length);
    palpite.add(topQuentes[randomIdx]);
  }

  // Preenche o restante com sorteio aleatório global
  while (palpite.size < qtdNumeros) {
    const num = Math.floor(Math.random() * maxNum) + 1;
    palpite.add(num);
  }

  return Array.from(palpite).sort((a, b) => a - b);
}

module.exports = { analisarFrequencia, gerarPalpiteEstatistico };
