const fs = require('fs');
const path = require('path');

class FileStore {
  constructor(basePath) {
    this.basePath = basePath;
    this.dataPath = path.join(basePath, 'data');
    this.botsPath = path.join(this.dataPath, 'bots');
    this.ensureDir(this.dataPath);
    this.ensureDir(this.botsPath);
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  botDir(botId) {
    return path.join(this.botsPath, botId);
  }

  ensureBotDir(botId) {
    const dir = this.botDir(botId);
    this.ensureDir(dir);
    return dir;
  }

  file(botId, fileName) {
    return path.join(this.ensureBotDir(botId), fileName);
  }

  readJson(filePath, fallback) {
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
        return fallback;
      }

      const raw = fs.readFileSync(filePath, 'utf8');
      if (!raw.trim()) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.error(`Erro lendo ${filePath}:`, error.message);
      return fallback;
    }
  }

  writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  listBotIds() {
    this.ensureDir(this.botsPath);
    return fs.readdirSync(this.botsPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }
}

module.exports = FileStore;