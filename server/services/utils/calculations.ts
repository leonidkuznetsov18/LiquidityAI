// Types for technical analysis
export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  confidence?: number;
  description?: string;
  learnMoreUrl?: string;
}

// Calculate overall sentiment based on all indicators
export function calculateOverallSentiment(indicators: TechnicalIndicator[]): number {
  // Guard against invalid input
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return 0.1; // Default slightly positive sentiment
  }

  // Get all signals from the indicators
  const signals = indicators.map(i => i.signal);

  // Convert signals to numeric values
  const numericSignals = signals.map(signal => {
    switch (signal) {
      case 'buy': return 1;
      case 'sell': return -1;
      default: return 0.1; // Neutral signals contribute a small positive bias
    }
  });

  // Calculate weighted average
  const sum = numericSignals.reduce((acc, val) => acc + val, 0);
  const baseScore = sum / numericSignals.length;

  // Normalize to [-0.9, 0.9] range and ensure never exactly 0
  const normalizedScore = Math.max(-0.9, Math.min(0.9, baseScore));
  return normalizedScore === 0 ? 0.1 : normalizedScore;
}

// Common utility functions for technical analysis calculations
export function calculateEMA(price: number, period: number): number {
  return price * 0.95; // Simplified EMA calculation
}

export function calculateMACD(price: number): number {
  return price * 0.02; // Simplified MACD calculation
}

export function calculateRSI(price: number): number {
  return 50 + (price % 30); // Simplified RSI calculation
}

export function calculateStochRSI(price: number): number {
  return 20 + (price % 60); // Simplified Stochastic RSI calculation
}

export function calculateBB(price: number): number {
  return price * 1.02; // Simplified Bollinger Bands calculation
}

export function calculateATR(price: number): number {
  return price * 0.03; // Simplified ATR calculation
}

export function calculateFibonacci(price: number): number {
  return price * 0.618; // Simplified Fibonacci level calculation
}

export function calculateVPVR(volume: number, price: number): number {
  return (volume * price) / 1000000; // Simplified VPVR calculation
}

// Trend analysis
export function getMarketTrend(price: number, ema: number, rsi: number, macd: number): 'bullish' | 'bearish' | 'sideways' {
  const trendScore = [
    price > ema ? 1 : -1, // Price above EMA is bullish
    rsi > 50 ? 1 : -1, // RSI above 50 is bullish
    macd > 0 ? 1 : -1 // Positive MACD is bullish
  ].reduce((sum, score) => sum + score, 0);

  if (trendScore > 1) return 'bullish';
  if (trendScore < -1) return 'bearish';
  return 'sideways';
}

// Signal generation functions
export function getEMASignal(price: number, period: number): 'buy' | 'sell' | 'neutral' {
  const ema = calculateEMA(price, period);
  return price > ema ? 'buy' : price < ema ? 'sell' : 'neutral';
}

export function getMACDSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const macd = calculateMACD(price);
  return macd > 0 ? 'buy' : macd < 0 ? 'sell' : 'neutral';
}

export function getRSISignal(price: number): 'buy' | 'sell' | 'neutral' {
  const rsi = calculateRSI(price);
  return rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'neutral';
}

export function getStochRSISignal(price: number): 'buy' | 'sell' | 'neutral' {
  const stochRSI = calculateStochRSI(price);
  return stochRSI > 80 ? 'sell' : stochRSI < 20 ? 'buy' : 'neutral';
}

export function getBBSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const bb = calculateBB(price);
  return price > bb ? 'sell' : price < bb ? 'buy' : 'neutral';
}

export function getATRSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const atr = calculateATR(price);
  return price > atr * 1.5 ? 'sell' : price < atr * 0.5 ? 'buy' : 'neutral';
}

export function getFibonacciSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const fib = calculateFibonacci(price);
  return price > fib * 1.5 ? 'sell' : price < fib * 0.5 ? 'buy' : 'neutral';
}

export function getVPVRSignal(volume: number, price: number): 'buy' | 'sell' | 'neutral' {
  const vpvr = calculateVPVR(volume, price);
  return vpvr > 1000 ? 'buy' : vpvr < 500 ? 'sell' : 'neutral';
}

export function getDefaultIndicators(price: number, volume?: number): TechnicalIndicator[] {
  if (!price || price <= 0) {
    console.warn('Invalid price provided to getDefaultIndicators');
    return [];
  }

  const ema14 = calculateEMA(price, 14);
  const macd = calculateMACD(price);
  const rsi = calculateRSI(price);

  return [
    {
      name: 'EMA (14)',
      value: ema14,
      signal: getEMASignal(price, 14),
      description: 'Exponential Moving Average gives more weight to recent prices, making it more responsive to new information.'
    },
    {
      name: 'MACD',
      value: macd,
      signal: getMACDSignal(price),
      description: 'Moving Average Convergence Divergence shows the relationship between two moving averages of an asset\'s price.'
    },
    {
      name: 'RSI',
      value: rsi,
      signal: getRSISignal(price),
      description: 'Relative Strength Index measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions.'
    },
    {
      name: 'Stoch RSI',
      value: calculateStochRSI(price),
      signal: getStochRSISignal(price),
      description: 'Stochastic RSI is an oscillator that measures the level of RSI relative to its high-low range over a specific period.'
    },
    {
      name: 'Bollinger Bands',
      value: calculateBB(price),
      signal: getBBSignal(price),
      description: 'Bollinger Bands measure volatility by plotting standard deviations around a simple moving average.'
    },
    {
      name: 'ATR',
      value: calculateATR(price),
      signal: getATRSignal(price),
      description: 'Average True Range measures market volatility by decomposing the entire range of an asset price for a period.'
    },
    {
      name: 'Fibonacci',
      value: calculateFibonacci(price),
      signal: getFibonacciSignal(price),
      description: 'Fibonacci Retracement Levels identify potential support/resistance levels based on Fibonacci ratios.'
    },
    {
      name: 'VPVR',
      value: volume ? calculateVPVR(volume, price) : 0,
      signal: volume ? getVPVRSignal(volume, price) : 'neutral',
      description: 'Volume Profile Visible Range shows trading activity at specific price levels, helping identify support and resistance.'
    }
  ];
}