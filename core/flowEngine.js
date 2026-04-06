const { buildContext, renderTemplate } = require('./templateEngine');
const { executeAction } = require('./actions');

function getInitialStageId(bot) {
  return bot.config.etapaInicial || 'menu';
}

function getStage(bot, stageId) {
  return bot.config.etapas?.[stageId] || null;
}

async function enterStage({ bot, msg, user, stageId, nome, numero }) {
  const stage = getStage(bot, stageId);
  const initialStageId = getInitialStageId(bot);

  if (!stage) {
    user.etapa = initialStageId;
    const fallback = getStage(bot, initialStageId);
    if (!fallback) {
      return bot.responderComDelay(msg, 'Fluxo inicial não encontrado.');
    }

    const context = buildContext({ nome, numero, user, bot });
    return bot.responderComDelay(msg, renderTemplate(fallback.mensagem, context));
  }

  user.etapa = stageId;

  const context = buildContext({ nome, numero, user, bot });
  const mensagem = renderTemplate(stage.mensagem || '', context);

  return bot.responderComDelay(msg, mensagem);
}

async function processFlow({ bot, msg, user, textoBruto, nome, numero }) {
  const initialStageId = getInitialStageId(bot);

  if (!user.etapa) {
    user.etapa = initialStageId;
  }

  const stage = getStage(bot, user.etapa);

  if (!stage) {
    user.etapa = initialStageId;
    return enterStage({ bot, msg, user, stageId: initialStageId, nome, numero });
  }

  if (textoBruto === '0' && stage.aceitaVoltar) {
    return enterStage({ bot, msg, user, stageId: initialStageId, nome, numero });
  }

  if (stage.tipo === 'menu') {
    const opcoes = Array.isArray(stage.opcoes) ? stage.opcoes : [];
    const match = opcoes.find(op => op.tecla === textoBruto);

    if (!match) {
      const permitidas = opcoes.map(op => `*${op.tecla}*`).join(', ');
      return bot.responderComDelay(msg, `Digite apenas ${permitidas} ou *0*.`);
    }

    return enterStage({ bot, msg, user, stageId: match.destino, nome, numero });
  }

  if (stage.tipo === 'texto') {
    return bot.responderComDelay(msg, 'Digite *0* para voltar ao menu principal.');
  }

  if (stage.tipo === 'entrada') {
    user.dados = user.dados || {};

    if (stage.salvarEm) {
      user.dados[stage.salvarEm] = textoBruto;
    }

    const context = buildContext({ nome, numero, user, bot });

    if (stage.acao) {
      await executeAction({
        bot,
        action: stage.acao,
        context,
        etapaId: stage.id
      });
    }

    const nextStage = stage.proximaEtapa || initialStageId;
    return enterStage({ bot, msg, user, stageId: nextStage, nome, numero });
  }

  return bot.responderComDelay(msg, 'Tipo de etapa inválido.');
}

module.exports = {
  processFlow,
  enterStage
};