const FileStore = require('./fileStore');
const BotInstance = require('./botInstance');
const defaultConfig = require('./defaultConfig');

class BotManager {
  constructor({ basePath, onChange }) {
    this.basePath = basePath;
    this.onChange = onChange || (() => {});
    this.store = new FileStore(basePath);
    this.bots = new Map();
  }

async deleteBot(botId) {
  const bot = this.bots.get(botId);
  if (!bot) throw new Error(`Bot não encontrado: ${botId}`);

  await bot.delete();
  this.bots.delete(botId);
  this.onChange();
}

  createBotId() {
    let index = 1;
    while (this.bots.has(`bot_${index}`) || this.store.listBotIds().includes(`bot_${index}`)) {
      index++;
    }
    return `bot_${index}`;
  }

  async createBot({ nomeBot } = {}) {
    const botId = this.createBotId();

    this.store.ensureBotDir(botId);
    this.store.writeJson(
      this.store.file(botId, 'config.json'),
      defaultConfig(nomeBot || botId)
    );
    this.store.writeJson(this.store.file(botId, 'usuarios.json'), {});
    this.store.writeJson(this.store.file(botId, 'registros.json'), []);

    const instance = new BotInstance({
      botId,
      store: this.store,
      basePath: this.basePath,
      onChange: this.onChange
    });

    this.bots.set(botId, instance);
    await instance.start();
    this.onChange();

    return instance.summary();
  }

  async loadExistingBots() {
    const botIds = this.store.listBotIds();

    for (const botId of botIds) {
      const instance = new BotInstance({
        botId,
        store: this.store,
        basePath: this.basePath,
        onChange: this.onChange
      });

      this.bots.set(botId, instance);
      await instance.start();
    }

    this.onChange();
  }

  listBots() {
    return Array.from(this.bots.values()).map(bot => bot.summary());
  }

  getBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) throw new Error(`Bot ${botId} não encontrado`);
    return bot;
  }

  async restartBot(botId, options = {}) {
    await this.getBot(botId).restart(options);
    this.onChange();
  }

  async stopBot(botId) {
    await this.getBot(botId).stop();
    this.onChange();
  }

  async startBot(botId) {
    await this.getBot(botId).start();
    this.onChange();
  }

  getBotConfig(botId) {
    return this.getBot(botId).config;
  }

  saveBotConfig(botId, nextConfig) {
    return this.getBot(botId).saveConfig(nextConfig);
  }

  getBotData(botId) {
    const bot = this.getBot(botId);

    const usuariosMap = bot.readUsers();
    const usuarios = Object.entries(usuariosMap).map(([numero, item]) => ({
      numero,
      ...item
    })).sort((a, b) => (b.ultimaInteracao || 0) - (a.ultimaInteracao || 0));

    const registros = (bot.readRegistros() || []).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    return { usuarios, registros };
  }
}

module.exports = BotManager;