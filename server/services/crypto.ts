import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
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
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/search/trending`
    );

    // Extract trending coins and create news items with sentiment
    const trendingCoins = response.data.coins.slice(0, 5); // Limit to top 5
    const headlines = trendingCoins.map((coin: any) => {
      const title = `${coin.item.name} (${coin.item.symbol.toUpperCase()}) is trending with market cap rank #${coin.item.market_cap_rank}`;
      const url = `https://www.coingecko.com/en/coins/${coin.item.id}`;
      // Determine sentiment based on price change and market cap rank
      const sentiment = determineNewsSentiment(coin.item);
      return { title, url, sentiment };
    });

    const result: NewsData = {
      news: {
        headlines,
        score: calculateOverallSentiment(headlines),
      }
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    throw error;
  }
}

function determineNewsSentiment(coinItem: any): 'positive' | 'negative' | 'neutral' {
  // Consider market cap rank for sentiment
  // Lower rank (closer to 1) is generally positive
  const rank = coinItem.market_cap_rank;

  if (rank <= 20) return 'positive';
  if (rank > 100) return 'negative';
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

  const average = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
  return average;
}