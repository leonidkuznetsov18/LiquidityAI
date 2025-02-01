// Market Data Types
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

// AI Analysis Types
export interface AINewsAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  impact: {
    shortTerm: number;  // 0-1 scale
    longTerm: number;   // 0-1 scale
  };
}

export interface AITechnicalAnalysis {
  indicators: TechnicalIndicator[];
  overallSentiment: number;  // -1 to 1 scale
  priceRange: {
    low: number;
    high: number;
    confidence: number;
  };
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  description: string;
  learnMoreUrl?: string;
}

// Constants
export const TECHNICAL_INDICATORS = {
  RSI: {
    name: 'RSI',
    description: 'Relative Strength Index measures momentum and overbought/oversold conditions',
    learnMoreUrl: 'https://www.investopedia.com/terms/r/rsi.asp'
  },
  STOCH_RSI: {
    name: 'Stochastic RSI',
    description: 'Combines RSI with stochastic oscillator for enhanced momentum signals',
    learnMoreUrl: 'https://www.investopedia.com/terms/s/stochrsi.asp'
  },
  BB: {
    name: 'Bollinger Bands',
    description: 'Shows price volatility and potential reversals using standard deviations',
    learnMoreUrl: 'https://www.investopedia.com/terms/b/bollingerbands.asp'
  },
  ATR: {
    name: 'Average True Range',
    description: 'Measures market volatility and potential trend strength',
    learnMoreUrl: 'https://www.investopedia.com/terms/a/atr.asp'
  },
  FIBONACCI: {
    name: 'Fibonacci Retracement',
    description: 'Identifies potential support/resistance levels using Fibonacci ratios',
    learnMoreUrl: 'https://www.investopedia.com/terms/f/fibonacciretracement.asp'
  },
  VPVR: {
    name: 'Volume Profile',
    description: 'Shows trading activity at price levels to identify support/resistance',
    learnMoreUrl: 'https://www.investopedia.com/terms/v/volume-profile.asp'
  },
  MACD: {
    name: 'MACD',
    description: 'Moving Average Convergence Divergence shows momentum and trend changes',
    learnMoreUrl: 'https://www.investopedia.com/terms/m/macd.asp'
  },
  EMA: {
    name: 'EMA',
    description: 'Exponential Moving Average emphasizes recent price changes',
    learnMoreUrl: 'https://www.investopedia.com/terms/e/ema.asp'
  }
};

// API Endpoints and Configuration
export const API_ENDPOINTS = {
  COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
  CRYPTOCOMPARE_BASE_URL: 'https://min-api.cryptocompare.com/data/v2'
};

export const CACHE_CONFIG = {
  DEFAULT_TTL: 3600 // 1 hour
};

// Technical Analysis Constants
export const TECHNICAL_ANALYSIS = {
  RSI: {
    OVERBOUGHT: 70,
    OVERSOLD: 30
  },
  BB: {
    PERIOD: 20,
    STD_DEV: 2
  },
  FIBONACCI_LEVELS: [0.236, 0.382, 0.5, 0.618, 0.786],
  VOLUME_PROFILE_ZONES: 12
};
