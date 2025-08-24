import express from 'express';
import { TradingEngine } from './trading/TradingEngine.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(express.json());

// Initialize trading engine
const tradingEngine = new TradingEngine();

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: '1.0.0',
  });
});

app.get('/status', (req, res) => {
  const positions = tradingEngine.getPositions();
  const riskMetrics = tradingEngine.getRiskMetrics();
  const portfolioValue = tradingEngine.getPortfolioValue();
  
  res.json({
    isRunning: true,
    portfolioValue,
    positions: positions.length,
    riskMetrics,
    timestamp: new Date(),
  });
});

app.get('/positions', (req, res) => {
  const positions = tradingEngine.getPositions();
  res.json({
    count: positions.length,
    positions,
  });
});

app.get('/trades', (req, res) => {
  const trades = tradingEngine.getTrades();
  res.json({
    count: trades.length,
    trades,
  });
});

app.get('/risk-metrics', (req, res) => {
  const metrics = tradingEngine.getRiskMetrics();
  res.json(metrics);
});

app.post('/analyze', async (req, res) => {
  try {
    await tradingEngine.forceAnalysis();
    res.json({
      status: 'success',
      message: 'Analysis triggered',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// WebSocket for real-time updates
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast updates to all connected clients
function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Trading engine event listeners
tradingEngine.on('marketUpdate', (data) => {
  broadcast({
    type: 'marketUpdate',
    data,
    timestamp: new Date(),
  });
});

tradingEngine.on('sentimentUpdate', (data) => {
  broadcast({
    type: 'sentimentUpdate',
    data,
    timestamp: new Date(),
  });
});

tradingEngine.on('technicalUpdate', (data) => {
  broadcast({
    type: 'technicalUpdate',
    data,
    timestamp: new Date(),
  });
});

tradingEngine.on('tradeExecuted', (data) => {
  broadcast({
    type: 'tradeExecuted',
    data,
    timestamp: new Date(),
  });
  
  logger.info('Trade executed', data);
});

tradingEngine.on('analysisComplete', (data) => {
  broadcast({
    type: 'analysisComplete',
    data,
    timestamp: new Date(),
  });
});

tradingEngine.on('analysisError', (error) => {
  broadcast({
    type: 'analysisError',
    error: error instanceof Error ? error.message : error,
    timestamp: new Date(),
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  logger.info('New WebSocket connection');
  
  // Send initial status
  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      portfolioValue: tradingEngine.getPortfolioValue(),
      positions: tradingEngine.getPositions().length,
      riskMetrics: tradingEngine.getRiskMetrics(),
    },
    timestamp: new Date(),
  }));
  
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// Start server
export async function startServer() {
  try {
    // Start trading engine
    await tradingEngine.start();
    
    // Start HTTP server
    server.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`WebSocket available on ws://localhost:${config.server.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  
  tradingEngine.stop();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  
  tradingEngine.stop();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});