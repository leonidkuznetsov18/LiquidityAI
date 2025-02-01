import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { getEthereumData, getTechnicalIndicators, getCryptoNews, generatePredictions } from './services/crypto';

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
          ws.send(JSON.stringify({ error: 'Failed to fetch market data' }));
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
      if (!data) {
        throw new Error('Failed to get technical indicators');
      }
      res.json(data);
    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // AI Predictions API
  app.get('/api/predictions', async (_req, res) => {
    try {
      const predictions = await generatePredictions();
      if (!predictions) {
        throw new Error('Failed to generate predictions');
      }
      res.json(predictions);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ 
        error: 'Failed to generate predictions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Sentiment Analysis API
  app.get('/api/sentiment', async (_req, res) => {
    try {
      const newsData = await getCryptoNews();
      if (!newsData) {
        throw new Error('Failed to get crypto news');
      }
      res.json(newsData);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sentiment data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  return httpServer;
}