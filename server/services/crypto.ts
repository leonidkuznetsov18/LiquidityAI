import axios from 'axios';
import NodeCache from 'node-cache';
import { getDefaultIndicators } from './utils/calculations';
import { type NewsItem, type NewsData } from './utils/utils';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data/v2';

export interface CryptoData {
  price: number;
  volume_24h: number;
  price_change_24h: number;
  market_cap: number;
  volume_buy_24h?: number;
  volume_sell_24h?: number;
}

export async function getEthereumData(): Promise<CryptoData> {
  const cacheKey = 'ethereum_data';
  const cachedData = cache.get<CryptoData>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`
    );

    const data = response.data.ethereum;
    const result: CryptoData = {
      price: data.usd,
      volume_24h: data.usd_24h_vol,
      price_change_24h: data.usd_24h_change,
      market_cap: data.usd_market_cap,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching Ethereum data:', error);
    throw error;
  }
}

export async function getTechnicalIndicators() {
  const data = await getEthereumData();
  const priceChange = data.price_change_24h;
  const volume = data.volume_24h;

  // Calculate buy/sell volume based on price direction
  const buyVolume = volume * (priceChange > 0 ? 0.6 : 0.4);
  const sellVolume = volume * (priceChange > 0 ? 0.4 : 0.6);

  const indicators = getDefaultIndicators(data.price, volume);
  const sentiment = calculateOverallSentiment(data.price, volume);

  return {
    price24h: {
      current: data.price,
      change: priceChange,
      changePercentage: (priceChange / data.price) * 100,
    },
    volume24h: {
      total: volume,
      buy: buyVolume,
      sell: sellVolume,
    },
    indicators: indicators,
    sentiment: Math.max(0.01, sentiment), // Ensure sentiment is never 0
  };
}

export async function getCryptoNews(): Promise<NewsData> {
  const cacheKey = 'crypto_news';
  const cachedNews = cache.get<NewsData>(cacheKey);

  if (cachedNews) {
    return cachedNews;
  }

  try {
    const response = await axios.get(
      `${CRYPTOCOMPARE_BASE_URL}/news/?lang=EN&categories=ETH`
    );

    const newsItems = response.data.Data
      .slice(0, 5)
      .map((article: any) => ({
        title: article.title,
        url: article.url,
        sentiment: analyzeNewsSentiment(article.title)
      }));

    const result: NewsData = {
      news: {
        headlines: newsItems,
        score: calculateOverallSentiment(newsItems)
      }
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Failed to fetch crypto news:', error);
    throw error;
  }
}

function analyzeNewsSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const sentimentWords = {
    positive: [
      'launch', 'partnership', 'growth', 'success', 'improve',
      'upgrade', 'milestone', 'achievement', 'innovation', 'bullish',
      'adoption', 'advance', 'progress', 'breakthrough', 'support'
    ],
    negative: [
      'issue', 'delay', 'problem', 'bug', 'vulnerability',
      'hack', 'decline', 'suspend', 'concern', 'bearish',
      'crash', 'risk', 'warning', 'threat', 'crisis'
    ]
  };

  const lowerText = text.toLowerCase();
  let score = 0;
  let matches = 0;

  sentimentWords.positive.forEach(word => {
    if (lowerText.includes(word)) {
      score++;
      matches++;
    }
  });

  sentimentWords.negative.forEach(word => {
    if (lowerText.includes(word)) {
      score--;
      matches++;
    }
  });

  if (matches === 0) return 'neutral';
  const normalizedScore = score / matches;

  if (normalizedScore > 0.3) return 'positive';
  if (normalizedScore < -0.3) return 'negative';
  return 'neutral';
}

function calculateOverallSentiment(headlines: NewsItem[]): number {
  const sentimentValues = headlines.map(item => {
    switch (item.sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      default: return 0;
    }
  });

  const sum = sentimentValues.reduce((acc, val) => acc + val, 0);
  // Normalize to 0-1 range
  return (sum / headlines.length + 1) / 2;
}

export async function generatePredictions() {
  const data = await getEthereumData();

  // Calculate indicators using manual methods
  const { indicators } = await getTechnicalIndicators();

  // Find specific indicator values
  const ema = indicators.find(i => i.name === 'EMA (14)')?.value || data.price * 0.95;
  const bb = indicators.find(i => i.name === 'Bollinger Bands')?.value || data.price * 1.02;
  const rsi = indicators.find(i => i.name === 'RSI')?.value || 50;
  const macd = indicators.find(i => i.name === 'MACD')?.value || data.price * 0.02;
  const atr = indicators.find(i => i.name === 'ATR')?.value || data.price * 0.03;

  const volatility = atr / data.price;
  const sentiment = rsi > 70 ? -1 : rsi < 30 ? 1 : 0;

  // Calculate range based on volatility and sentiment
  const rangeLow = data.price * (1 - (volatility * (1 + sentiment * 0.5)));
  const rangeHigh = data.price * (1 + (volatility * (1 - sentiment * 0.5)));

  // Calculate confidence score based on multiple factors
  let confidenceScore = 75; // Base confidence

  // Adjust confidence based on technical signals
  if (data.price < ema && rangeLow < data.price) confidenceScore += 5;
  if (data.price > ema && rangeHigh > data.price) confidenceScore += 5;
  if (macd > 0 && sentiment > 0) confidenceScore += 5;
  if (macd < 0 && sentiment < 0) confidenceScore += 5;
  if (rsi > 50 && sentiment > 0) confidenceScore += 5;
  if (rsi < 50 && sentiment < 0) confidenceScore += 5;

  // Ensure confidence stays within reasonable bounds
  confidenceScore = Math.min(95, Math.max(60, confidenceScore));

  return {
    rangeLow,
    rangeHigh,
    confidence: confidenceScore,
    timestamp: Date.now(),
  };
}