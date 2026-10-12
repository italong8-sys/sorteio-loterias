const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', 'palpites_salvos.json');

function salvarPalpite(modalidade, dezenas) {
  let lista = [];
  if (fs.existsSync(ARQUIVO)) {
    try {
      lista = JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'));
    } catch (e) {
      lista = [];
    }
  }
  lista.push({
    data: new Date().toLocaleString('pt-BR'),
    modalidade,
    dezenas
  });
  fs.writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2));
}

function carregarPalpites() {
  if (!fs.existsSync(ARQUIVO)) return [];
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'));
  } catch (e) {
    return [];
  }
}

module.exports = { salvarPalpite, carregarPalpites };
