function defaultConfig(nomeBot = 'Aylla') {
  return {
    nomeBot,
    etapaInicial: 'menu',
    grupoOracaoId: '120363426999679065@g.us',
    grupoEstudoId: '120363407685169341@g.us',
    tempoResposta: 2000,
    limiteMensagens: 200,
    tempoResetMensagensMs: 60 * 60 * 1000,

    etapas: {
      menu: {
        id: 'menu',
        nome: 'Menu principal',
        tipo: 'menu',
        mensagem: `Olá, {nome}! 😊

Eu sou o ${nomeBot}, a Assistente Virtual do *Projeto Gênese* 🌱

Como posso te ajudar hoje?

1️⃣ Encontrar uma igreja
2️⃣ Falar com alguém
3️⃣ Conhecer a Bíblia
4️⃣ Pedido de oração
5️⃣ Sobre o Projeto

Digite o número 👇`,
        aceitaVoltar: true,
        opcoes: [
          { tecla: '1', rotulo: 'Encontrar igreja', destino: 'igrejas' },
          { tecla: '2', rotulo: 'Falar com alguém', destino: 'contatos' },
          { tecla: '3', rotulo: 'Conhecer a Bíblia', destino: 'biblia_inicio' },
          { tecla: '4', rotulo: 'Pedido de oração', destino: 'oracao_nome' },
          { tecla: '5', rotulo: 'Sobre o projeto', destino: 'projeto' }
        ]
      },

      igrejas: {
        id: 'igrejas',
        nome: 'Igrejas',
        tipo: 'texto',
        mensagem: `📍 Nossas Igrejas em Itumbiara:

Setor Central https://maps.app.goo.gl/idnhiLoGq6sB7EYr5

Bairro Planalto https://maps.app.goo.gl/g7RvuGzkNEpWu1Hr5

Bairro Nossa Senhora da Saúde https://maps.app.goo.gl/RnoxPxCpbtc2veLX6

Bairro Marolina https://maps.app.goo.gl/BWhngfTphdfYq1LE7

Bairro Jardim Leonora https://maps.app.goo.gl/H6cpqrjw9FCwYwYx6

Digite *0* para voltar ao menu principal.`,
        aceitaVoltar: true
      },

      contatos: {
        id: 'contatos',
        nome: 'Contatos',
        tipo: 'texto',
        mensagem: `🤝 Fale com alguém:

📞 Pastor Jordan (Distrital) wa.me/556182909161
📞 Cleiton Antonio (Planalto) wa.me/556496602455
📞 Ednilson Silva (Central) wa.me/556493067898
📞 Leonardo Lima (Marolina) wa.me/556481035062
📞 Thiago (Saúde) wa.me/556493421947
📞 Leonardo (Leonora) wa.me/556492388080

Digite *0* para voltar ao menu principal.`,
        aceitaVoltar: true
      },

      projeto: {
        id: 'projeto',
        nome: 'Sobre o projeto',
        tipo: 'texto',
        mensagem: `*Projeto Gênese*

O Projeto Gênese é um movimento missionário da *Igreja Adventista do Sétimo Dia no distrito de Itumbiara.*

Nasceu com o propósito de aproximar pessoas de Deus de forma simples, acessível e real, usando tanto o contato pessoal quanto a tecnologia para alcançar vidas.

Acreditamos que ninguém chega aqui por acaso. Por isso, o Projeto Gênese existe para:

• Conectar você com uma igreja próxima
• Oferecer apoio espiritual e humano
• Ajudar no conhecimento da Bíblia
• Caminhar ao lado nos momentos difíceis

Mais do que um projeto, é um convite: um recomeço, um encontro, um caminho com Deus ✨

Digite *0* para voltar ao menu principal.`,
        aceitaVoltar: true
      },

      biblia_inicio: {
        id: 'biblia_inicio',
        nome: 'Bíblia início',
        tipo: 'menu',
        mensagem: `📖 Estudar a Bíblia

Que bom que você quer conhecer mais a Bíblia 💛

Como você prefere começar?

8️⃣ Estudar online agora
9️⃣ Estudar com alguém

Digite o número 👇`,
        aceitaVoltar: true,
        opcoes: [
          { tecla: '8', rotulo: 'Curso online', destino: 'biblia_online' },
          { tecla: '9', rotulo: 'Estudar com alguém', destino: 'biblia_pedido' }
        ]
      },

      biblia_online: {
        id: 'biblia_online',
        nome: 'Curso online',
        tipo: 'texto',
        mensagem: `Perfeito! 🙏

👉 https://biblia.com.br/curso/

Vai no seu tempo 💛

Digite *0* para voltar ao menu principal.`,
        aceitaVoltar: true
      },

      biblia_pedido: {
        id: 'biblia_pedido',
        nome: 'Pedido de estudo bíblico',
        tipo: 'entrada',
        mensagem: `Perfeito… 🙏

Você prefere presencial ou online?

Pode me dizer também algum detalhe 💙`,
        aceitaVoltar: true,
        salvarEm: 'observacaoEstudo',
        proximaEtapa: 'biblia_confirmacao',
        acao: {
          tipo: 'enviar_grupo',
          grupoCampoConfig: 'grupoEstudoId',
          template: `📖 *Novo interessado em estudo bíblico*

👤 Nome: {nome}
📱 Número: {numero}

📝 Observação:
{observacaoEstudo}`,
          salvarEmLista: 'estudos'
        }
      },

      biblia_confirmacao: {
        id: 'biblia_confirmacao',
        nome: 'Confirmação estudo',
        tipo: 'texto',
        mensagem: `Perfeito… já recebi aqui 💛

Alguém vai entrar em contato com você 🙏

Digite *0* para voltar ao menu principal.`,
        aceitaVoltar: true
      },

      oracao_nome: {
        id: 'oracao_nome',
        nome: 'Nome para oração',
        tipo: 'entrada',
        mensagem: `Pode me dizer por quem você gostaria de pedir oração? 🙏
Pode ser por você ou por outra pessoa 💙`,
        aceitaVoltar: true,
        salvarEm: 'nomeOracao',
        proximaEtapa: 'oracao_pedido'
      },

      oracao_pedido: {
        id: 'oracao_pedido',
        nome: 'Pedido de oração',
        tipo: 'entrada',
        mensagem: `Entendi… 🙏

Agora me conta qual é o pedido de oração 💙`,
        aceitaVoltar: true,
        salvarEm: 'pedidoOracao',
        proximaEtapa: 'pos_oracao',
        acao: {
          tipo: 'enviar_grupo',
          grupoCampoConfig: 'grupoOracaoId',
          template: `🙏 *Pedido de oração*

👤 Solicitante: {nome}
📱 Número: {numero}

🙌 Por: {nomeOracao}

📝 Pedido:
{pedidoOracao}`,
          salvarEmLista: 'oracoes'
        }
      },

      pos_oracao: {
        id: 'pos_oracao',
        nome: 'Pós oração',
        tipo: 'menu',
        mensagem: `Recebi seu pedido… de verdade 💙

Vamos orar por isso 🙏

E olha… você não precisa passar por isso sozinho(a).

Se quiser:
7️⃣ Falar com alguém agora

Digite o número 👇`,
        aceitaVoltar: true,
        opcoes: [
          { tecla: '7', rotulo: 'Falar com alguém agora', destino: 'contatos_pos_oracao' }
        ]
      },

      contatos_pos_oracao: {
        id: 'contatos_pos_oracao',
        nome: 'Contatos pós oração',
        tipo: 'texto',
        mensagem: `🤝 Fale com alguém agora:

1️⃣ João - wa.me/5564993000001
2️⃣ Maria - wa.me/5564993000002
3️⃣ Pedro - wa.me/5564993000003
4️⃣ Ana - wa.me/5564993000004
5️⃣ Lucas - wa.me/5564993000005
6️⃣ Sara - wa.me/5564993000006

Digite *0* para voltar ao menu principal.`,
        aceitaVoltar: true
      }
    }
  };
}

module.exports = defaultConfig;