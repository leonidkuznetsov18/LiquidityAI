import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data/v2';

interface CryptoData {
  price: number;
  volume_24h: number;
  price_change_24h: number;
  market_cap: number;
  prices_24h: number[];
}

// Technical Analysis Functions
function calculateRSI(prices: number[], periods: number = 14): number {
  if (prices.length < periods) return 50;

  let gains = 0;
  let losses = 0;

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

function calculateStochastic(prices: number[], period: number = 14): number {
  if (prices.length < period) return 50;

  const currentPrice = prices[prices.length - 1];
  const lowestLow = Math.min(...prices.slice(-period));
  const highestHigh = Math.max(...prices.slice(-period));

  return ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;
}

function calculateADX(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let sumDM = 0;
  let sumTR = 0;

  for (let i = 1; i < period + 1; i++) {
    const high = prices[i];
    const low = prices[i - 1];
    const prevHigh = prices[i - 1];
    const prevLow = prices[i - 1];

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    const trueRange = Math.max(
      high - low,
      Math.abs(high - prices[i - 1]),
      Math.abs(low - prices[i - 1])
    );

    sumDM += plusDM - minusDM;
    sumTR += trueRange;
  }

  return Math.abs((sumDM / sumTR) * 100);
}

function calculateATR(prices: number[], period: number = 14): number {
  if (prices.length < period) return 0;

  let sum = 0;
  for (let i = 1; i < period; i++) {
    const tr = Math.max(
      prices[i] - prices[i - 1],
      Math.abs(prices[i] - prices[i - 1]),
      Math.abs(prices[i - 1] - prices[i - 2] || 0)
    );
    sum += tr;
  }

  return sum / period;
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

function calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
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

    const historicalResponse = await axios.get(
      `${COINGECKO_BASE_URL}/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=hourly`
    );

    const data = response.data.ethereum;
    const prices24h = historicalResponse.data.prices.map((p: number[]) => p[1]);

    const result: CryptoData = {
      price: data.usd,
      volume_24h: data.usd_24h_vol,
      price_change_24h: data.usd_24h_change,
      market_cap: data.usd_market_cap,
      prices_24h: prices24h,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching Ethereum data:', error);
    throw error;
  }
}

export async function getTechnicalIndicators() {
  try {
    const data = await getEthereumData();
    const prices = data.prices_24h;
    const currentPrice = data.price;

    if (prices.length === 0) {
      throw new Error('No price data available');
    }

    // Calculate all indicators
    const bb = calculateBollingerBands(prices);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const roc = calculateROC(prices);
    const stoch = calculateStochastic(prices);
    const adx = calculateADX(prices);
    const atr = calculateATR(prices);

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
          name: 'Stochastic',
          value: stoch,
          signal: stoch > 80 ? 'sell' : stoch < 20 ? 'buy' : 'neutral',
        },
        {
          name: 'ADX',
          value: adx,
          signal: adx > 25 ? 'buy' : adx < 20 ? 'sell' : 'neutral',
        },
        {
          name: 'ATR',
          value: atr,
          signal: atr > prices[prices.length - 1] * 0.02 ? 'sell' : 'neutral',
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
    return {
      indicators: [],
    };
  }
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