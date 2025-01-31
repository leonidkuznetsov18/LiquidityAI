import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    verifyClient: ({ req }) => {
      // Ignore Vite HMR connections
      return !req.headers['sec-websocket-protocol']?.includes('vite-hmr');
    }
  });

  // Mock market data for WebSocket
  wss.on('connection', (ws) => {
    console.log('Client connected');

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          price: 2000 + Math.random() * 100,
          volume: Math.random() * 1000000,
          timestamp: Date.now(),
        }));
      }
    }, 1000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });

  // Market Data API
  app.get('/api/market-data', (_req, res) => {
    res.json({
      indicators: [
        {
          name: 'RSI',
          value: 45 + Math.random() * 10,
          signal: 'neutral',
        },
        {
          name: 'MACD',
          value: -2 + Math.random() * 4,
          signal: 'buy',
        },
        {
          name: 'BB Width',
          value: 2.5 + Math.random(),
          signal: 'sell',
        },
      ],
    });
  });

  // AI Predictions API
  app.get('/api/predictions', (_req, res) => {
    res.json({
      rangeLow: 1900 + Math.random() * 50,
      rangeHigh: 2100 + Math.random() * 50,
      confidence: 75 + Math.random() * 15,
    });
  });

  // Sentiment Analysis API
  app.get('/api/sentiment', (_req, res) => {
    res.json({
      twitter: {
        score: 0.6 + Math.random() * 0.2,
        volume: 50000 + Math.random() * 10000,
      },
      news: {
        score: 0.7 + Math.random() * 0.2,
        headlines: [
          "ETH Price Surges as DeFi Activity Increases",
          "Major Protocol Upgrade Expected Next Month",
          "Institutional Interest in ETH Grows",
        ],
      },
    });
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