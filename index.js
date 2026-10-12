const readline = require('readline');
const c = require('./src/colors');
const { buscarConcurso } = require('./src/api');
const { gerarDezenas } = require('./src/generator');
const { salvarPalpite, carregarPalpites } = require('./src/storage');
const { analisarFrequencia, gerarPalpiteEstatistico } = require('./src/stats');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function menuModalidade(modalidade, minTotal, maxTotal, padraoDefault) {
  while (true) {
    console.log(`\n${c.cyan}${c.bold}=== OPÇÕES: ${modalidade.toUpperCase()} ===${c.reset}`);
    console.log("1. Gerar Palpite Aleatório");
    console.log("2. Gerar Palpite Estatístico (Baseado nos últimos concursos)");
    console.log("3. Ver Estatísticas (Mais e Menos Sorteados)");
    console.log("0. Voltar ao Menu Principal");

    const op = await ask("\nEscolha uma opção: ");

    if (op === "1" || op === "2") {
      const entrada = await ask(`Quantidade de dezenas (${minTotal} a 15) [Padrão: ${padraoDefault}]: `);
      let qtd = parseInt(entrada) || padraoDefault;
      if (qtd < minTotal || qtd > 15) qtd = padraoDefault;

      let palpite = [];
      if (op === "1") {
        palpite = gerarDezenas(qtd, 1, maxTotal);
      } else {
        console.log(`\n${c.yellow}A analisar últimos concursos da Caixa...${c.reset}`);
        const stats = await analisarFrequencia(modalidade, 15);
        if (stats) {
          palpite = gerarPalpiteEstatistico(stats, qtd, maxTotal);
          console.log(`${c.green}✔ Análise concluída em ${stats.totalAnalisados} concursos!${c.reset}`);
        } else {
          console.log(`${c.red}Falha ao obter estatísticas. Gerando aleatório...${c.reset}`);
          palpite = gerarDezenas(qtd, 1, maxTotal);
        }
      }

      const dezStr = palpite.map(n => String(n).padStart(2, '0')).join(' - ');
      console.log(`\n🎲 ${c.bold}Palpite Gerado (${op === '2' ? 'Estatístico' : 'Aleatório'}):${c.reset} [ ${c.green}${dezStr}${c.reset} ]`);

      const opSalvar = await ask("\nDeseja salvar este palpite? (s/N): ");
      if (opSalvar.toLowerCase() === 's') {
        salvarPalpite(modalidade, palpite);
        console.log(`${c.green}✔ Palpite salvo com sucesso!${c.reset}`);
      }
    } else if (op === "3") {
      console.log(`\n${c.yellow}A calcular frequência dos últimos 15 concursos...${c.reset}`);
      const stats = await analisarFrequencia(modalidade, 15);
      if (stats) {
        console.log(`\n${c.bold}📊 ESTATÍSTICAS (Últimos ${stats.totalAnalisados} Concursos - Até #${stats.ultimoConcurso})${c.reset}`);
        
        const mais = stats.maisFrequentes.map(i => `${String(i.numero).padStart(2,'0')} (${i.frequencia}x)`).join(', ');
        const menos = stats.menosFrequentes.map(i => `${String(i.numero).padStart(2,'0')} (${i.frequencia}x)`).join(', ');

        console.log(`🔥 ${c.green}${c.bold}Mais Sorteados:${c.reset} ${mais}`);
        console.log(`❄️  ${c.blue}${c.bold}Menos Sorteados:${c.reset} ${menos}`);
      } else {
        console.log(`${c.red}Não foi possível carregar as estatísticas no momento.${c.reset}`);
      }
    } else if (op === "0") {
      break;
    }
  }
}

async function exibirResultadoOficial(modalidade) {
  console.log(`\n${c.blue}${c.bold}=== A CONSULTAR CAIXA (${modalidade.toUpperCase()}) ===${c.reset}`);
  const dados = await buscarConcurso(modalidade);

  if (dados) {
    console.log(`Concurso: ${c.bold}${dados.numero}${c.reset} (${dados.dataApuracao})`);
    console.log(`Dezenas: ${c.green}${c.bold}${dados.listaDezenas ? dados.listaDezenas.join(' - ') : 'N/D'}${c.reset}`);
    console.log(`Acumulou: ${dados.acumulado ? `${c.red}SIM${c.reset}` : `${c.green}NÃO${c.reset}`}`);
    const est = dados.valorEstimadoProximoConcurso
      ? dados.valorEstimadoProximoConcurso.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ 0,00';
    console.log(`Estimativa Próximo Concurso: ${c.yellow}${est}${c.reset}`);
  } else {
    console.log(`${c.red}Não foi possível obter dados da Caixa no momento.${c.reset}`);
  }
}

async function verHistorico() {
  console.log(`\n${c.magenta}${c.bold}=== PALPITES SALVOS ===${c.reset}`);
  const historico = carregarPalpites();
  if (historico.length === 0) {
    console.log("Nenhum palpite salvo ainda.");
    return;
  }
  historico.forEach((item, index) => {
    const dezStr = item.dezenas.map(n => String(n).padStart(2, '0')).join(' - ');
    console.log(`${index + 1}. [${item.data}] ${item.modalidade.toUpperCase()}: ${c.green}${dezStr}${c.reset}`);
  });
}

async function main() {
  while (true) {
    console.log(`\n${c.bold}===================================${c.reset}`);
    console.log(`   ${c.cyan}SORTEIO VIRTUAL LOTERIAS CAIXA${c.reset}`);
    console.log(`${c.bold}===================================${c.reset}`);
    console.log("1. Mega-Sena (Palpites & Estatísticas)");
    console.log("2. Quina (Palpites & Estatísticas)");
    console.log("3. Ver Resultados da Caixa");
    console.log("4. Ver Meus Palpites Salvos");
    console.log("0. Sair");

    const opcao = await ask("\nEscolha uma opção: ");

    if (opcao === "1") await menuModalidade("megasena", 6, 60, 6);
    else if (opcao === "2") await menuModalidade("quina", 5, 80, 5);
    else if (opcao === "3") {
      console.log("\n1. Mega-Sena | 2. Quina");
      const opRes = await ask("Qual modalidade deseja consultar? ");
      if (opRes === "1") await exibirResultadoOficial("megasena");
      else if (opRes === "2") await exibirResultadoOficial("quina");
    }
    else if (opcao === "4") await verHistorico();
    else if (opcao === "0") {
      console.log(`${c.yellow}A encerrar o aplicativo...${c.reset}`);
      rl.close();
      break;
    } else {
      console.log(`${c.red}Opção inválida!${c.reset}`);
    }
  }
}

main();
