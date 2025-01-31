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

  return {
    indicators: [
      {
        name: 'EMA (14)',
        value: calculateEMA(data.price, 14),
        signal: getEMASignal(data.price, 14),
        description: 'Exponential Moving Average gives more weight to recent prices, making it more responsive to new information.',
        learnMoreUrl: 'https://www.investopedia.com/terms/e/ema.asp'
      },
      {
        name: 'MACD',
        value: calculateMACD(data.price),
        signal: getMACDSignal(data.price),
        description: 'Moving Average Convergence Divergence shows the relationship between two moving averages of an asset\'s price.',
        learnMoreUrl: 'https://www.investopedia.com/terms/m/macd.asp'
      },
      {
        name: 'RSI',
        value: calculateRSI(data.price),
        signal: getRSISignal(data.price),
        description: 'Relative Strength Index measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions.',
        learnMoreUrl: 'https://www.investopedia.com/terms/r/rsi.asp'
      },
      {
        name: 'Stoch RSI',
        value: calculateStochRSI(data.price),
        signal: getStochRSISignal(data.price),
        description: 'Stochastic RSI is an oscillator that measures the level of RSI relative to its high-low range over a specific period.',
        learnMoreUrl: 'https://www.investopedia.com/terms/s/stochrsi.asp'
      },
      {
        name: 'Bollinger Bands',
        value: calculateBB(data.price),
        signal: getBBSignal(data.price),
        description: 'Bollinger Bands measure volatility by plotting standard deviations around a simple moving average.',
        learnMoreUrl: 'https://www.investopedia.com/terms/b/bollingerbands.asp'
      },
      {
        name: 'ATR',
        value: calculateATR(data.price),
        signal: getATRSignal(data.price),
        description: 'Average True Range measures market volatility by decomposing the entire range of an asset price for a period.',
        learnMoreUrl: 'https://www.investopedia.com/terms/a/atr.asp'
      },
      {
        name: 'Fibonacci',
        value: calculateFibonacci(data.price),
        signal: getFibonacciSignal(data.price),
        description: 'Fibonacci Retracement Levels identify potential support/resistance levels based on Fibonacci ratios.',
        learnMoreUrl: 'https://www.investopedia.com/terms/f/fibonacciretracement.asp'
      },
      {
        name: 'VPVR',
        value: calculateVPVR(volume, data.price),
        signal: getVPVRSignal(volume, data.price),
        description: 'Volume Profile Visible Range shows trading activity at specific price levels, helping identify support and resistance.',
        learnMoreUrl: 'https://www.investopedia.com/terms/v/volume-profile.asp'
      }
    ],
  };
}

// Helper functions to calculate indicators
// Note: These are simplified implementations for demonstration
function calculateEMA(price: number, period: number): number {
  return price * 0.95; // Simplified EMA calculation
}

function calculateMACD(price: number): number {
  return price * 0.02; // Simplified MACD calculation
}

function calculateRSI(price: number): number {
  return 50 + (price % 30); // Simplified RSI calculation
}

function calculateStochRSI(price: number): number {
  return 20 + (price % 60); // Simplified Stochastic RSI calculation
}

function calculateBB(price: number): number {
  return price * 1.02; // Simplified Bollinger Bands calculation
}

function calculateATR(price: number): number {
  return price * 0.03; // Simplified ATR calculation
}

function calculateFibonacci(price: number): number {
  return price * 0.618; // Simplified Fibonacci level calculation
}

function calculateVPVR(volume: number, price: number): number {
  return (volume * price) / 1000000; // Simplified VPVR calculation
}

// Signal generation functions
function getEMASignal(price: number, period: number): 'buy' | 'sell' | 'neutral' {
  return price > period * 100 ? 'buy' : price < period * 50 ? 'sell' : 'neutral';
}

function getMACDSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2000 ? 'buy' : price < 1500 ? 'sell' : 'neutral';
}

function getRSISignal(price: number): 'buy' | 'sell' | 'neutral' {
  const rsi = calculateRSI(price);
  return rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'neutral';
}

function getStochRSISignal(price: number): 'buy' | 'sell' | 'neutral' {
  const stochRSI = calculateStochRSI(price);
  return stochRSI > 80 ? 'sell' : stochRSI < 20 ? 'buy' : 'neutral';
}

function getBBSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2200 ? 'sell' : price < 1800 ? 'buy' : 'neutral';
}

function getATRSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2100 ? 'sell' : price < 1900 ? 'buy' : 'neutral';
}

function getFibonacciSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2300 ? 'sell' : price < 1700 ? 'buy' : 'neutral';
}

function getVPVRSignal(volume: number, price: number): 'buy' | 'sell' | 'neutral' {
  const vpvr = calculateVPVR(volume, price);
  return vpvr > 1000 ? 'buy' : vpvr < 500 ? 'sell' : 'neutral';
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
    throw error;
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
  const sentimentScores = headlines.map(headline => {
    switch (headline.sentiment) {
      case 'positive': return 1;
      case 'negative': return 0;
      default: return 0.5;
    }
  });

  return sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
}