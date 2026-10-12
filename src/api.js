const API_MEGASENA = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena";
const API_QUINA = "https://servicebus2.caixa.gov.br/portaldeloterias/api/quina";

async function buscarConcurso(modalidade, numero = '') {
  const baseUrl = modalidade === 'megasena' ? API_MEGASENA : API_QUINA;
  const url = numero ? `${baseUrl}/${numero}` : baseUrl;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Falha na conexão
  }
  return null;
}

module.exports = { buscarConcurso };
