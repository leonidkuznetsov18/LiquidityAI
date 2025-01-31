import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { getEthereumData, getTechnicalIndicators, getCryptoNews } from './services/crypto';

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

  // AI Predictions API (using real price data for range calculation)
  app.get('/api/predictions', async (_req, res) => {
    try {
      const data = await getEthereumData();
      const currentPrice = data.price;
      res.json({
        rangeLow: currentPrice * 0.95,
        rangeHigh: currentPrice * 1.05,
        confidence: 75 + Math.random() * 15, // This will be replaced with AI predictions later
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch price data' });
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