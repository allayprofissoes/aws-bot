const { renderTemplate } = require('./templateEngine');

function formatarRegistro(context) {
  const linhas = [];

  if (context.nome) linhas.push(`👤 Nome: ${context.nome}`);
  if (context.numero) linhas.push(`📞 Número: ${context.numero}`);
  if (context.nomeOracao) linhas.push(`🙏 Nome: ${context.nomeOracao}`);
  if (context.pedidoOracao) linhas.push(`📝 Pedido: ${context.pedidoOracao}`);
  if (context.observacaoEstudo) linhas.push(`📚 Observação: ${context.observacaoEstudo}`);

  return linhas.join('\n');
}

async function executeAction({ bot, action, context, etapaId }) {
  if (!action || !action.tipo || action.tipo === 'nenhuma') return;

  if (action.tipo === 'enviar_grupo') {
    const grupoId = bot.config[action.grupoCampoConfig];

    if (!grupoId) {
      throw new Error(`Grupo não configurado em ${action.grupoCampoConfig}`);
    }

    const mensagem = renderTemplate(action.template || '', context);

    // 1. envia para o grupo
    await bot.client.sendMessage(grupoId, mensagem);

    // 2. tenta registrar sem quebrar o fluxo principal
    if (action.salvarEmLista) {
      try {
        const registros = Array.isArray(bot.readRegistros?.())
          ? bot.readRegistros()
          : [];

        registros.push({
  id: `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  lista: action.salvarEmLista,
  etapaId,
  criadoEm: Date.now(),
  texto: formatarRegistro(context),
  contexto: context // opcional manter
});

        if (typeof bot.saveRegistros === 'function') {
          bot.saveRegistros(registros);
        } else {
          console.error(`[${bot.botId}] saveRegistros não existe`);
        }
      } catch (error) {
        console.error(`[${bot.botId}] erro ao salvar registro:`, error);
      }
    }
  }
}

module.exports = {
  executeAction
};