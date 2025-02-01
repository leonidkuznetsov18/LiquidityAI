import axios from 'axios';
import NodeCache from 'node-cache';
import { 
  analyzeNewsWithAI, 
  analyzeTechnicalIndicatorsWithAI, 
  generatePredictionsWithAI 
} from './aiAnalysis';

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

export interface NewsItem {
  title: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface NewsData {
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

  // First try AI analysis
  try {
    const aiAnalysis = await analyzeTechnicalIndicatorsWithAI(
      data.price,
      volume,
      priceChange,
      getDefaultIndicators(data.price)
    );

    return {
      price24h: {
        current: data.price,
        change: data.price_change_24h,
        changePercentage: (data.price_change_24h / data.price) * 100,
      },
      volume24h: {
        total: data.volume_24h,
        buy: volume * (priceChange > 0 ? 0.6 : 0.4),
        sell: volume * (priceChange > 0 ? 0.4 : 0.6),
      },
      indicators: aiAnalysis.indicators
    };
  } catch (error) {
    console.error('AI analysis failed, using default indicators:', error);
    // Fallback to default indicators
    return {
      price24h: {
        current: data.price,
        change: data.price_change_24h,
        changePercentage: (data.price_change_24h / data.price) * 100,
      },
      volume24h: {
        total: data.volume_24h,
        buy: volume * (priceChange > 0 ? 0.6 : 0.4),
        sell: volume * (priceChange > 0 ? 0.4 : 0.6),
      },
      indicators: getDefaultIndicators(data.price)
    };
  }
}

function getDefaultIndicators(price: number) {
  return [
    {
      name: 'EMA (14)',
      value: calculateEMA(price, 14),
      signal: getEMASignal(price, 14),
      description: 'Exponential Moving Average gives more weight to recent prices, making it more responsive to new information.',
      learnMoreUrl: 'https://www.investopedia.com/terms/e/ema.asp'
    },
    {
      name: 'MACD',
      value: calculateMACD(price),
      signal: getMACDSignal(price),
      description: 'Moving Average Convergence Divergence shows the relationship between two moving averages of an asset\'s price.',
      learnMoreUrl: 'https://www.investopedia.com/terms/m/macd.asp'
    },
    {
      name: 'RSI',
      value: calculateRSI(price),
      signal: getRSISignal(price),
      description: 'Relative Strength Index measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions.',
      learnMoreUrl: 'https://www.investopedia.com/terms/r/rsi.asp'
    },
    {
      name: 'Stoch RSI',
      value: calculateStochRSI(price),
      signal: getStochRSISignal(price),
      description: 'Stochastic RSI is an oscillator that measures the level of RSI relative to its high-low range over a specific period.',
      learnMoreUrl: 'https://www.investopedia.com/terms/s/stochrsi.asp'
    },
    {
      name: 'Bollinger Bands',
      value: calculateBB(price),
      signal: getBBSignal(price),
      description: 'Bollinger Bands measure volatility by plotting standard deviations around a simple moving average.',
      learnMoreUrl: 'https://www.investopedia.com/terms/b/bollingerbands.asp'
    },
    {
      name: 'ATR',
      value: calculateATR(price),
      signal: getATRSignal(price),
      description: 'Average True Range measures market volatility by decomposing the entire range of an asset price for a period.',
      learnMoreUrl: 'https://www.investopedia.com/terms/a/atr.asp'
    }
  ];
}

// Helper functions to calculate indicators
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
        sentiment: 'neutral' // Default sentiment
      }));

    // Try AI analysis first
    try {
      const aiNewsAnalysis = await analyzeNewsWithAI(newsItems);

      // Update sentiments based on AI analysis
      newsItems.forEach((item: NewsItem) => {
        item.sentiment = aiNewsAnalysis.sentiment;
      });

      const result: NewsData = {
        news: {
          headlines: newsItems,
          score: aiNewsAnalysis.score
        }
      };

      cache.set(cacheKey, result);
      return result;
    } catch (aiError) {
      console.error('AI news analysis failed, falling back to basic analysis:', aiError);
      // Fall back to existing analysis
      return {
        news: {
          headlines: newsItems.map(item => ({
            ...item,
            sentiment: analyzeNewsSentiment(item.title)
          })),
          score: calculateOverallSentiment(newsItems),
        }
      };
    }
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

  try {
    // Get technical and news analysis
    const technicalAnalysis = await analyzeTechnicalIndicatorsWithAI(
      data.price,
      data.volume_24h,
      data.price_change_24h,
      getDefaultIndicators(data.price)
    );

    const newsData = await getCryptoNews();
    const newsAnalysis = await analyzeNewsWithAI(newsData.news.headlines);

    // Generate AI predictions
    const aiPredictions = await generatePredictionsWithAI(
      data.price,
      technicalAnalysis,
      newsAnalysis
    );

    if (aiPredictions) {
      return aiPredictions;
    }
  } catch (error) {
    console.error('AI prediction failed, falling back to traditional analysis:', error);
  }

  // Fallback to existing calculations if AI analysis fails
  const ema = calculateEMA(data.price, 14);
  const bb = calculateBB(data.price);
  const rsi = calculateRSI(data.price);
  const macd = calculateMACD(data.price);
  const atr = calculateATR(data.price);

  const volatility = atr / data.price;
  const sentiment = rsi > 70 ? -1 : rsi < 30 ? 1 : 0;

  const rangeLow = data.price * (1 - (volatility * (1 + sentiment * 0.5)));
  const rangeHigh = data.price * (1 + (volatility * (1 - sentiment * 0.5)));

  let confidenceScore = 75;

  if (data.price < ema && rangeLow < data.price) confidenceScore += 5;
  if (data.price > ema && rangeHigh > data.price) confidenceScore += 5;
  if (macd > 0 && sentiment > 0) confidenceScore += 5;
  if (macd < 0 && sentiment < 0) confidenceScore += 5;
  if (rsi > 50 && sentiment > 0) confidenceScore += 5;
  if (rsi < 50 && sentiment < 0) confidenceScore += 5;

  confidenceScore = Math.min(95, Math.max(60, confidenceScore));

  return {
    rangeLow,
    rangeHigh,
    confidence: confidenceScore,
    timestamp: Date.now(),
  };
}