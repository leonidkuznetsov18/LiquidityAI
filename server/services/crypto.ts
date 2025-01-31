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

export async function getTechnicalIndicators() {
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
    // Using CoinGecko's companies public treasury API as a news source
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/companies/public_treasury/ethereum`
    );

    const newsItems = response.data.companies
      .slice(0, 5) // Take only top 5 companies
      .map((company: any) => ({
        title: `${company.name} holds ${company.total_holdings} ETH (${company.total_current_value_usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`,
        url: `https://www.coingecko.com/en/companies/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
        sentiment: analyzeNewsSentiment(company.total_holdings, company.total_current_value_usd)
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

function analyzeNewsSentiment(holdings: number, value: number): 'positive' | 'negative' | 'neutral' {
  // Simple sentiment analysis based on holdings and value
  if (holdings > 1000 && value > 1000000) return 'positive';
  if (holdings < 100 || value < 100000) return 'negative';
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