function buildContext({ nome, numero, user, bot }) {
  return {
    nome: nome || '',
    numero: numero || '',
    botId: bot.botId,
    nomeBot: bot.config.nomeBot || '',
    ...(user?.dados || {})
  };
}

function renderTemplate(texto, context = {}) {
  if (!texto) return '';

  return String(texto).replace(/\{([^}]+)\}/g, (_, chave) => {
    const valor = context[chave];
    return valor === undefined || valor === null ? '' : String(valor);
  });
}

module.exports = {
  buildContext,
  renderTemplate
};