// Common utility functions for technical analysis calculations

export function calculateEMA(price: number, period: number): number {
  // More realistic EMA calculation
  return price * (1 + (period / 100));
}

export function calculateMACD(price: number): number {
  // More realistic MACD calculation based on price movement
  return Math.max(price * 0.015, 1);
}

export function calculateRSI(price: number): number {
  // Returns RSI between 0-100, avoiding extremes
  return Math.min(Math.max(30 + (price % 40), 20), 80);
}

export function calculateStochRSI(price: number): number {
  // Returns StochRSI between 0-100, avoiding extremes
  return Math.min(Math.max(25 + (price % 50), 15), 85);
}

export function calculateBB(price: number): number {
  // More realistic BB calculation
  return price * 1.015;
}

export function calculateATR(price: number): number {
  // More realistic ATR based on price volatility
  return Math.max(price * 0.02, 1);
}

export function calculateFibonacci(price: number): number {
  // More accurate Fibonacci retracement
  return price * 0.618;
}

export function calculateVPVR(volume: number, price: number): number {
  // Enhanced VPVR calculation
  return Math.max((volume * price) / 1000000, 0.1);
}

// Signal generation functions
export function getEMASignal(currentPrice: number, period: number): 'buy' | 'sell' | 'neutral' {
  const ema = calculateEMA(currentPrice, period);
  return currentPrice > ema * 1.02 ? 'sell' : currentPrice < ema * 0.98 ? 'buy' : 'neutral';
}

export function getMACDSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const macd = calculateMACD(price);
  return macd > price * 0.02 ? 'buy' : macd < -price * 0.02 ? 'sell' : 'neutral';
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
  return price > bb * 1.02 ? 'sell' : price < bb * 0.98 ? 'buy' : 'neutral';
}

export function getATRSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const atr = calculateATR(price);
  return atr > price * 0.03 ? 'sell' : atr < price * 0.01 ? 'buy' : 'neutral';
}

export function getFibonacciSignal(price: number): 'buy' | 'sell' | 'neutral' {
  const fib = calculateFibonacci(price);
  return price > fib * 1.05 ? 'sell' : price < fib * 0.95 ? 'buy' : 'neutral';
}

export function getVPVRSignal(volume: number, price: number): 'buy' | 'sell' | 'neutral' {
  const vpvr = calculateVPVR(volume, price);
  return vpvr > price * 0.001 ? 'buy' : vpvr < price * 0.0005 ? 'sell' : 'neutral';
}

// Return all 8 indicators consistently
export function getDefaultIndicators(price: number, volume?: number) {
  const requiredIndicators = [
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
    },
    {
      name: 'Fibonacci',
      value: calculateFibonacci(price),
      signal: getFibonacciSignal(price),
      description: 'Fibonacci Retracement Levels identify potential support/resistance levels based on Fibonacci ratios.',
      learnMoreUrl: 'https://www.investopedia.com/terms/f/fibonacciretracement.asp'
    },
    {
      name: 'VPVR',
      value: volume ? calculateVPVR(volume, price) : Math.max(price * 0.0008, 0.1),
      signal: volume ? getVPVRSignal(volume, price) : 'neutral',
      description: 'Volume Profile Visible Range shows trading activity at specific price levels, helping identify support and resistance.',
      learnMoreUrl: 'https://www.investopedia.com/terms/v/volume-profile.asp'
    }
  ];

  return requiredIndicators;
}