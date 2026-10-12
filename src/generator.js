function gerarDezenas(qtd, min, max) {
  const dezenas = new Set();
  while (dezenas.size < qtd) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    dezenas.add(num);
  }
  return Array.from(dezenas).sort((a, b) => a - b);
}

module.exports = { gerarDezenas };
