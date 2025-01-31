import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { getEthereumData, getTechnicalIndicators, getCryptoNews, generatePredictions } from './services/crypto';
import { getUniswapPools } from './services/uniswap';

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    verifyClient: ({ req }: { req: IncomingMessage }) => {
      // Ignore Vite HMR connections
      return !req.headers['sec-websocket-protocol']?.includes('vite-hmr');
    }
  });

  // Real-time market data WebSocket
  wss.on('connection', (ws) => {
    console.log('Client connected');

    const interval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const data = await getEthereumData();
          ws.send(JSON.stringify({
            price: data.price,
            volume: data.volume_24h,
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.error('WebSocket data fetch error:', error);
        }
      }
    }, 10000); // Update every 10 seconds

    ws.on('close', () => {
      clearInterval(interval);
    });
  });

  // Market Data API
  app.get('/api/market-data', async (_req, res) => {
    try {
      const data = await getTechnicalIndicators();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  });

  // Uniswap Pools API
  app.get('/api/uniswap/pools', async (_req, res) => {
    try {
      const { pools } = await getUniswapPools();
      res.json({ pools });
    } catch (error) {
      console.error('Error in /api/uniswap/pools:', error);
      // Send empty pools instead of error
      res.json({ pools: [] });
    }
  });

  // AI Predictions API
  app.get('/api/predictions', async (_req, res) => {
    try {
      const predictions = await generatePredictions();
      res.json(predictions);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ error: 'Failed to generate predictions' });
    }
  });

  // Sentiment Analysis API
  app.get('/api/sentiment', async (_req, res) => {
    try {
      const newsData = await getCryptoNews();
      res.json(newsData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sentiment data' });
    }
  });

  // Settings API
  app.post('/api/settings', (_req, res) => {
    res.json({ success: true });
  });

  // Range Update API
  app.post('/api/range', (_req, res) => {
    res.json({ success: true });
  });

  return httpServer;
}