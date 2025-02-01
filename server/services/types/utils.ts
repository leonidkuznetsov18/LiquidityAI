// Technical Analysis Constants
export const TECHNICAL_ANALYSIS = {
  RSI: {
    OVERBOUGHT: 70,
    OVERSOLD: 30
  },
  FIBONACCI_LEVELS: [0.236, 0.382, 0.5, 0.618, 0.786],
  VOLUME_PROFILE_ZONES: {
    HIGH_VOLUME_THRESHOLD: 1000000,
    LOW_VOLUME_THRESHOLD: 100000
  }
};

export const TECHNICAL_INDICATORS = {
  RSI: {
    name: "Relative Strength Index (RSI)",
    description: "Momentum oscillator measuring speed and change of price movements. Values range from 0 to 100."
  },
  STOCH_RSI: {
    name: "Stochastic RSI",
    description: "Combines RSI and stochastic oscillator to provide more refined overbought/oversold signals."
  },
  BB: {
    name: "Bollinger Bands",
    description: "Shows volatility channels around a moving average to identify potential reversal points."
  },
  ATR: {
    name: "Average True Range",
    description: "Measures market volatility by decomposing price movement."
  },
  FIBONACCI: {
    name: "Fibonacci Retracement",
    description: "Key levels based on Fibonacci ratios to identify potential support/resistance."
  },
  VPVR: {
    name: "Volume Profile Visible Range",
    description: "Shows trading activity at specific price levels to identify support/resistance zones."
  }
};

// Interfaces for News Analysis
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

// Interfaces for AI Analysis
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
  indicators: {
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'neutral';
    confidence: number;
    description: string;
  }[];
  overallSentiment: number;  // -1 to 1 scale
  priceRange: {
    low: number;
    high: number;
    confidence: number;
  };
}

// Common Types
export type Signal = 'buy' | 'sell' | 'neutral';
export type Sentiment = 'positive' | 'negative' | 'neutral';
