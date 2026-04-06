const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const BotManager = require('./core/botManager');

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '5mb' }));

const manager = new BotManager({
  basePath: __dirname,
  onChange: () => broadcast()
});

function snapshot() {
  return {
    bots: manager.listBots()
  };
}

function broadcast() {
  io.emit('snapshot', snapshot());
}

io.on('connection', (socket) => {
  socket.emit('snapshot', snapshot());
});

app.get('/api/bots', (req, res) => {
  res.json(manager.listBots());
});

app.post('/api/bots', async (req, res) => {
  try {
    const { nomeBot } = req.body || {};
    const bot = await manager.createBot({ nomeBot });
    broadcast();
    res.json({ ok: true, bot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


app.delete('/api/bots/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    await manager.deleteBot(botId);
    broadcast();
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir bot:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


app.post('/api/bots/:botId/restart', async (req, res) => {
  try {
    await manager.restartBot(req.params.botId, { forceNewQr: true });
    broadcast();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/bots/:botId/stop', async (req, res) => {
  try {
    await manager.stopBot(req.params.botId);
    broadcast();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/bots/:botId/start', async (req, res) => {
  try {
    await manager.startBot(req.params.botId);
    broadcast();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/bots/:botId/config', (req, res) => {
  try {
    res.json(manager.getBotConfig(req.params.botId));
  } catch (error) {
    res.status(404).json({ ok: false, error: error.message });
  }
});

app.post('/api/bots/:botId/config', (req, res) => {
  try {
    const config = manager.saveBotConfig(req.params.botId, req.body || {});
    broadcast();
    res.json({ ok: true, config });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/bots/:botId/usuarios', (req, res) => {
  try {
    res.json(manager.getBotData(req.params.botId).usuarios);
  } catch (error) {
    res.status(404).json({ ok: false, error: error.message });
  }
});

app.get('/api/bots/:botId/registros', (req, res) => {
  try {
    res.json(manager.getBotData(req.params.botId).registros);
  } catch (error) {
    res.status(404).json({ ok: false, error: error.message });
  }
});

async function bootstrap() {
  await manager.loadExistingBots();

  if (manager.listBots().length === 0) {
    await manager.createBot({ nomeBot: 'Aylla' });
  }

  server.listen(PORT, '0.0.0.0', () => {
  console.log(`Painel multi-bot em http://localhost:${PORT}`);
});
}

bootstrap().catch(err => {
  console.error('Erro ao iniciar sistema:', err);
});