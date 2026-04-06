const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const defaultConfig = require('./defaultConfig');
const { processFlow, enterStage } = require('./flowEngine');

class BotInstance {
  constructor({ botId, store, basePath, onChange }) {
    this.botId = botId;
    this.store = store;
    this.basePath = basePath;
    this.onChange = onChange || (() => {});
    this.client = null;
    this.status = 'parado';
    this.qr = null;
    this.groups = [];
    this.restarting = false;

    this.ensureFiles();
  }

  ensureFiles() {
    this.store.ensureBotDir(this.botId);
    this.store.readJson(this.store.file(this.botId, 'config.json'), defaultConfig(this.botId));
    this.store.readJson(this.store.file(this.botId, 'usuarios.json'), {});
    this.store.readJson(this.store.file(this.botId, 'registros.json'), []);
  }

  get config() {
  const atual = this.store.readJson(
    this.store.file(this.botId, 'config.json'),
    defaultConfig(this.botId)
  );

  const padrao = defaultConfig(this.botId);

  return {
    ...padrao,
    ...atual,
    etapas: {
      ...(padrao.etapas || {}),
      ...(atual.etapas || {})
    }
  };
}

  saveConfig(nextConfig) {
  const atual = this.config;

  const merged = {
    ...atual,
    ...nextConfig,
    etapas: {
      ...(atual.etapas || {}),
      ...(nextConfig.etapas || {})
    }
  };

  this.store.writeJson(this.store.file(this.botId, 'config.json'), merged);
  this.onChange();
  return merged;
}

  readUsers() {
    return this.store.readJson(this.store.file(this.botId, 'usuarios.json'), {});
  }

  saveUsers(data) {
    this.store.writeJson(this.store.file(this.botId, 'usuarios.json'), data);
  }

  readRegistros() {
    return this.store.readJson(this.store.file(this.botId, 'registros.json'), []);
  }

  saveRegistros(data) {
    this.store.writeJson(this.store.file(this.botId, 'registros.json'), data);
  }

  summary() {
    return {
      id: this.botId,
      nomeBot: this.config.nomeBot,
      status: this.status,
      qr: this.qr,
      grupos: this.groups
    };
  }

  extrairNumero(msg, contato) {
    let numero = contato?.number || msg.from?.split('@')[0];
    if (!numero) return 'Não disponível';

    numero = numero.replace(/\D/g, '');

    if (numero.length > 13) return 'Número não disponível';
    if (numero.length === 13) return `(${numero.slice(2, 4)}) ${numero.slice(4, 9)}-${numero.slice(9)}`;
    if (numero.length === 11) return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;

    return numero;
  }

 responderComDelay(msg, texto) {
  const tempo = this.config.tempoResposta || 2000;
  const chatId = msg?.from;

  setTimeout(async () => {
    try {
      if (!chatId) return;
      if (!this.client) return;
      if (!this.client.pupPage) return;
      if (this.client.pupPage.isClosed()) return;
      if (this.status !== 'conectado' && this.status !== 'autenticado') return;

      await this.client.sendMessage(chatId, texto);
    } catch (error) {
      console.error(`[${this.botId}] erro ao responder com delay:`, error?.message || error);
    }
  }, tempo);
}

async start() {
  if (this.client) return;

  this.status = 'inicializando';
  this.onChange();

 this.client = new Client({
  authStrategy: new LocalAuth({ clientId: this.botId }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});
  this.registerEvents();
  await this.client.initialize();
}

  async stop() {
    if (!this.client) return;

    try {
      await this.client.destroy();
    } catch (error) {
      console.log(`[${this.botId}] aviso ao parar:`, error.message);
    }

    this.client = null;
    this.status = 'parado';
    this.qr = null;
    this.onChange();
  }

  async restart({ forceNewQr = false } = {}) {
    this.restarting = true;
    this.status = 'reiniciando';
    this.qr = null;
    this.onChange();

    if (this.client) {
      if (forceNewQr) {
        try {
          await this.client.logout();
        } catch (error) {
          console.log(`[${this.botId}] aviso logout:`, error.message);
        }
      }

      try {
        await this.client.destroy();
      } catch (error) {
        console.log(`[${this.botId}] aviso destroy:`, error.message);
      }

      this.client = null;
    }

    if (forceNewQr) {
      const authDir = path.join(this.basePath, '.wwebjs_auth');
      if (fs.existsSync(authDir)) {
        const target = path.join(authDir, 'session-' + this.botId);
        if (fs.existsSync(target)) {
          fs.rmSync(target, { recursive: true, force: true });
        }
      }
    }

    this.restarting = false;
    await this.start();
  }

  registerEvents() {
    this.client.on('qr', async (qr) => {
  this.status = 'aguardando_qr';
  this.qr = await QRCode.toDataURL(qr);
  this.onChange();
});

    this.client.on('authenticated', () => {
      this.status = 'autenticado';
      this.onChange();
    });

    this.client.on('ready', async () => {
      this.status = 'conectado';
      this.qr = null;
      this.groups = [];

      try {
        const chats = await this.client.getChats();

        chats.forEach(chat => {
          if (chat.isGroup) {
            this.groups.push({
              nome: chat.name,
              id: chat.id._serialized
            });
          }
        });
      } catch (error) {
        console.error(`[${this.botId}] erro grupos:`, error.message);
      }

      this.onChange();
    });

    this.client.on('auth_failure', (msg) => {
      console.error(`[${this.botId}] falha auth:`, msg);
      this.status = 'falha_autenticacao';
      this.onChange();
    });

    this.client.on('disconnected', (reason) => {
  console.log(`[${this.botId}] desconectado:`, reason);
  this.status = this.restarting ? 'reiniciando' : 'desconectado';
  this.qr = null;
  this.groups = [];
  this.onChange();
});

    this.client.on('message', async (msg) => {
  try {
    await this.handleMessage(msg);
  } catch (error) {
    console.error(`[${this.botId}] erro no listener message:`, error?.stack || error);
  }
});
  }

async delete() {
  await this.stop();

  const botDir = this.store.botDir
    ? this.store.botDir(this.botId)
    : path.join(this.basePath, 'bots', this.botId);

  const authDir = path.join(this.basePath, '.wwebjs_auth', `session-${this.botId}`);

  try {
    if (fs.existsSync(botDir)) {
      fs.rmSync(botDir, { recursive: true, force: true });
    }

    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    this.status = 'apagado';
    this.qr = null;
    this.groups = [];
    this.onChange();
  } catch (error) {
    console.error(`[${this.botId}] erro ao excluir bot:`, error);
    throw error;
  }
}


  async handleMessage(msg) {
    try {
      if (msg.from.endsWith('@g.us')) return;

      const contato = await msg.getContact();
      const nome = contato.pushname || 'amigo';
      const numero = this.extrairNumero(msg, contato);
      const numeroKey = msg.from;
      const textoBruto = msg.body;
      const texto = textoBruto.toLowerCase().trim();

      const usuarios = this.readUsers();

      if (!usuarios[numeroKey]) {
        usuarios[numeroKey] = {
          nome,
          etapa: this.config.etapaInicial || 'menu',
          mensagens: 0,
          ultimaInteracao: Date.now(),
          dados: {}
        };
      }

      const user = usuarios[numeroKey];
      user.nome = nome;

      if (Date.now() - user.ultimaInteracao > (this.config.tempoResetMensagensMs || 3600000)) {
        user.mensagens = 0;
      }

      user.mensagens++;
      user.ultimaInteracao = Date.now();

      if (user.mensagens > (this.config.limiteMensagens || 200)) {
        this.saveUsers(usuarios);
        this.onChange();
        return this.responderComDelay(msg, 'Você enviou muitas mensagens seguidas 😅 Tenta novamente daqui a pouco.');
      }

      if (texto === 'oi' || texto === 'olá' || texto === 'ola' || texto === 'menu') {
        await enterStage({
          bot: this,
          msg,
          user,
          stageId: this.config.etapaInicial || 'menu',
          nome,
          numero
        });

        this.saveUsers(usuarios);
        this.onChange();
        return;
      }

      await processFlow({
        bot: this,
        msg,
        user,
        textoBruto,
        nome,
        numero
      });

      this.saveUsers(usuarios);
      this.onChange();
    } catch (error) {
  console.error(`[${this.botId}] erro geral message:`, error?.stack || error);

  try {
    if (
      this.client &&
      this.client.pupPage &&
      !this.client.pupPage.isClosed() &&
      (this.status === 'conectado' || this.status === 'autenticado')
    ) {
      await this.responderComDelay(
        msg,
        'Ocorreu um erro inesperado 😥 Digite *0* para voltar ao menu.'
      );
    }
  } catch (sendError) {
    console.error(`[${this.botId}] erro ao enviar mensagem de falha:`, sendError?.message || sendError);
  }

  return;
}
  }
}

module.exports = BotInstance;