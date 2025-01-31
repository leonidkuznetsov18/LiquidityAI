import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';
const API_KEY = process.env.COINGECKO_API_KEY;

// Add API key to all CoinGecko requests
const coingeckoAxios = axios.create({
  baseURL: COINGECKO_BASE_URL,
  headers: {
    'x-cg-pro-api-key': API_KEY
  }
});

async function fetchWithRetry(url: string, maxRetries = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await coingeckoAxios.get(url);
      return response.data;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error.response?.status, error.response?.data);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

export async function getEthereumData(): Promise<CryptoData> {
  const cacheKey = 'ethereum_data';
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Get current price data
    const priceData = await fetchWithRetry(
      `/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`
    );

    // Get historical data
    const historicalData = await fetchWithRetry(
      `/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=hourly`
    );

    const prices24h = historicalData.prices.map((p: number[]) => p[1]);
    const data = priceData.ethereum;

    const result: CryptoData = {
      price: data.usd,
      volume_24h: data.usd_24h_vol,
      price_change_24h: data.usd_24h_change,
      market_cap: data.usd_market_cap,
      prices_24h,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching Ethereum data:', error);
    throw new Error('Failed to fetch market data');
  }
}

interface CryptoData {
  price: number;
  volume_24h: number;
  price_change_24h: number;
  market_cap: number;
  prices_24h: number[]; // Array of hourly prices for the last 24 hours
}

interface NewsItem {
  title: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface NewsData {
  news: {
    headlines: NewsItem[];
    score: number;
  };
}

// Technical Analysis Functions
function calculateRSI(prices: number[], periods: number = 14): number {
  if (prices.length < periods) return 50; // Default to neutral if not enough data

  let gains = 0;
  let losses = 0;

  // Calculate average gains and losses
  for (let i = 1; i < periods; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  const avgGain = gains / periods;
  const avgLoss = losses / periods;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { value: number; signal: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([macdLine], 9);

  return {
    value: macdLine,
    signal: signalLine
  };
}

function calculateEMA(prices: number[], periods: number): number {
  if (prices.length === 0) return 0;

  const multiplier = 2 / (periods + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateBollingerBands(prices: number[]): { upper: number; lower: number; middle: number } {
  if (prices.length === 0) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map(price => Math.pow(price - sma, 2));
  const standardDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / prices.length);

  return {
    upper: sma + (standardDeviation * 2),
    middle: sma,
    lower: sma - (standardDeviation * 2)
  };
}

function calculateROC(prices: number[], periods: number = 12): number {
  if (prices.length < periods) return 0;
  return ((prices[prices.length - 1] - prices[prices.length - periods]) / prices[prices.length - periods]) * 100;
}


export async function getTechnicalIndicators() {
  try {
    const data = await getEthereumData();
    const prices = data.prices_24h;
    const currentPrice = data.price;

    if (prices.length === 0) {
      throw new Error('No price data available');
    }

    // Calculate Bollinger Bands
    const bb = calculateBollingerBands(prices);

    // Calculate RSI
    const rsi = calculateRSI(prices);

    // Calculate MACD
    const macd = calculateMACD(prices);

    // Calculate Rate of Change
    const roc = calculateROC(prices);

    // Calculate Moving Averages
    const ma20 = calculateEMA(prices, 20);
    const ma50 = calculateEMA(prices, 50);

    return {
      indicators: [
        {
          name: 'RSI (14)',
          value: rsi,
          signal: rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'neutral',
        },
        {
          name: 'MACD',
          value: macd.value,
          signal: macd.value > macd.signal ? 'buy' : 'sell',
        },
        {
          name: 'Bollinger Bands',
          value: currentPrice,
          signal: currentPrice > bb.upper ? 'sell' : currentPrice < bb.lower ? 'buy' : 'neutral',
          details: {
            upper: bb.upper,
            middle: bb.middle,
            lower: bb.lower,
          }
        },
        {
          name: 'Price Rate of Change',
          value: roc,
          signal: roc > 5 ? 'sell' : roc < -5 ? 'buy' : 'neutral',
        },
        {
          name: 'MA Crossover',
          value: ma20,
          signal: ma20 > ma50 ? 'buy' : 'sell',
          details: {
            ma20,
            ma50,
          }
        },
        {
          name: 'Volume 24h',
          value: data.volume_24h / 1000000, // Convert to millions
          signal: data.volume_24h > 1000000000 ? 'buy' : data.volume_24h < 500000000 ? 'sell' : 'neutral',
        },
      ],
    };
  } catch (error) {
    console.error('Error calculating technical indicators:', error);
    // Return empty indicators if calculations fail
    return {
      indicators: [],
    };
  }
}

export async function getCryptoNews(): Promise<NewsData> {
  const cacheKey = 'crypto_news';
  const cachedNews = cache.get<NewsData>(cacheKey);

  if (cachedNews) {
    return cachedNews;
  }

  try {
    // Fetch news from CryptoCompare
    const response = await axios.get(
      `${CRYPTOCOMPARE_BASE_URL}/news/?lang=EN&categories=ETH`
    );

    const newsItems = response.data.Data
      .slice(0, 5) // Take only top 5 news items
      .map((article: any) => ({
        title: article.title,
        url: article.url,
        sentiment: analyzeNewsSentiment(article.title + ' ' + article.body)
      }));

    const result: NewsData = {
      news: {
        headlines: newsItems,
        score: calculateOverallSentiment(newsItems),
      }
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    return {
      news: {
        headlines: [],
        score: 50,
      }
    };
  }
}

function analyzeNewsSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = [
    'launch', 'partnership', 'growth', 'success', 'improve',
    'upgrade', 'milestone', 'achievement', 'innovation', 'bullish',
    'adoption', 'advance', 'progress', 'breakthrough', 'support'
  ];

  const negativeWords = [
    'issue', 'delay', 'problem', 'bug', 'vulnerability',
    'hack', 'decline', 'suspend', 'concern', 'bearish',
    'crash', 'risk', 'warning', 'threat', 'crisis'
  ];

  const lowerText = text.toLowerCase();
  const posCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

function calculateOverallSentiment(headlines: NewsItem[]): number {
  if (headlines.length === 0) return 50;

  const sentimentScores = headlines.map(headline => {
    switch (headline.sentiment) {
      case 'positive': return 1;
      case 'negative': return 0;
      default: return 0.5;
    }
  });

  return (sentimentScores.reduce((a, b) => a + b, 0) / headlines.length) * 100;
}
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data/v2';