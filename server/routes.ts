import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { getEthereumData, getCryptoNews } from './services/crypto';
import { analyzeNewsWithAI, analyzeTechnicalIndicatorsWithAI, generatePredictionsWithAI } from './services/aiAnalysis';

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    verifyClient: ({ req }: { req: IncomingMessage }) => {
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
    }, 10000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });

  // Technical Analysis API
  app.get('/api/market-data', async (_req, res) => {
    try {
      const ethData = await getEthereumData();
      const aiAnalysis = await analyzeTechnicalIndicatorsWithAI(
        ethData.price,
        ethData.volume_24h,
        ethData.price_change_24h,
        []
      );

      if (!aiAnalysis || !aiAnalysis.indicators) {
        throw new Error('Failed to generate AI technical analysis');
      }

      res.json({
        price24h: {
          current: ethData.price,
          change: ethData.price_change_24h,
          changePercentage: (ethData.price_change_24h / ethData.price) * 100,
        },
        volume24h: {
          total: ethData.volume_24h,
          buy: ethData.volume_24h * (ethData.price_change_24h > 0 ? 0.6 : 0.4),
          sell: ethData.volume_24h * (ethData.price_change_24h > 0 ? 0.4 : 0.6),
        },
        indicators: aiAnalysis.indicators,
        sentiment: aiAnalysis.overallSentiment || 0.01,
        trend: aiAnalysis.trend || 'neutral',
      });
    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Predictions API
  app.get('/api/predictions', async (_req, res) => {
    try {
      const ethData = await getEthereumData();
      const technicalAnalysis = await analyzeTechnicalIndicatorsWithAI(
        ethData.price,
        ethData.volume_24h,
        ethData.price_change_24h,
        []
      );

      if (!technicalAnalysis) {
        throw new Error('Failed to generate technical analysis');
      }

      const newsData = await getCryptoNews();
      const newsAnalysis = await analyzeNewsWithAI(newsData.news.headlines);

      if (!newsAnalysis || !newsAnalysis.impact) {
        throw new Error('Failed to analyze news data');
      }

      const predictions = await generatePredictionsWithAI(
        ethData.price,
        technicalAnalysis,
        newsAnalysis
      );

      if (!predictions) {
        throw new Error('Failed to generate predictions');
      }

      const response = {
        ...predictions,
        technicalAnalysis: {
          sentiment: technicalAnalysis.overallSentiment || 0.01,
          marketTrend: technicalAnalysis.trend || 'neutral',
          confidence: technicalAnalysis.priceRange?.confidence || 0.5
        },
        newsImpact: {
          sentiment: newsAnalysis.sentiment || 'neutral',
          shortTerm: newsAnalysis.impact?.shortTerm || 0.5,
          longTerm: newsAnalysis.impact?.longTerm || 0.5
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ 
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Sentiment Analysis API
  app.get('/api/sentiment', async (_req, res) => {
    try {
      const newsData = await getCryptoNews();
      const aiSentiment = await analyzeNewsWithAI(newsData.news.headlines);

      if (!aiSentiment || !aiSentiment.impact) {
        throw new Error('Failed to analyze sentiment');
      }

      res.json({
        news: {
          headlines: newsData.news.headlines,
          score: aiSentiment.score || 0.5,
          sentiment: aiSentiment.sentiment || 'neutral',
          impact: {
            shortTerm: aiSentiment.impact.shortTerm || 0.5,
            longTerm: aiSentiment.impact.longTerm || 0.5
          }
        }
      });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sentiment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return httpServer;
}