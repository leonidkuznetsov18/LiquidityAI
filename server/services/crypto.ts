import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // Cache for 1 minute
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

interface CryptoData {
  price: number;
  volume_24h: number;
  price_change_24h: number;
  market_cap: number;
}

interface NewsItem {
  title: string;
  url: string;
  published_at: string;
}

interface NewsData {
  news: {
    headlines: string[];
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

interface TechnicalIndicators {
  indicators: Array<{
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'neutral';
  }>;
}

export async function getTechnicalIndicators(): Promise<TechnicalIndicators> {
  const data = await getEthereumData();

  // Calculate basic technical indicators
  const priceChange = data.price_change_24h;
  const volume = data.volume_24h;

  return {
    indicators: [
      {
        name: 'Price Change 24h',
        value: priceChange,
        signal: priceChange > 2 ? 'buy' : priceChange < -2 ? 'sell' : 'neutral',
      },
      {
        name: 'Volume 24h',
        value: volume / 1000000, // Convert to millions
        signal: volume > 1000000000 ? 'buy' : volume < 500000000 ? 'sell' : 'neutral',
      },
    ],
  };
}

export async function getCryptoNews(): Promise<NewsData> {
  const cacheKey = 'crypto_news';
  const cachedNews = cache.get<NewsData>(cacheKey);

  if (cachedNews) {
    return cachedNews;
  }

  try {
    // Using CoinGecko's trending search as a news source
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/search/trending`
    );

    // Extract trending coins and create news-like headlines
    const trendingCoins = response.data.coins.slice(0, 3);
    const headlines = trendingCoins.map((coin: any) => 
      `${coin.item.name} (${coin.item.symbol.toUpperCase()}) is trending with market cap rank #${coin.item.market_cap_rank}`
    );

    const result: NewsData = {
      news: {
        headlines,
        score: calculateSentimentScore(headlines),
      }
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    throw error;
  }
}

function calculateSentimentScore(headlines: string[]): number {
  const positiveWords = ['surge', 'gain', 'bull', 'up', 'high', 'growth', 'trending'];
  const negativeWords = ['crash', 'drop', 'bear', 'down', 'low', 'fall'];

  let score = 0.5; // Neutral starting point

  for (const headline of headlines) {
    const text = headline.toLowerCase();
    const posCount = positiveWords.filter(word => text.includes(word)).length;
    const negCount = negativeWords.filter(word => text.includes(word)).length;

    score += (posCount - negCount) * 0.1; // Adjust sentiment based on keyword matches
  }

  // Ensure score stays between 0 and 1
  return Math.max(0, Math.min(1, score));
}