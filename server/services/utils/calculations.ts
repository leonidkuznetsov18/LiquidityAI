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

// Signal generation functions
export function getEMASignal(price: number, period: number): 'buy' | 'sell' | 'neutral' {
  return price > period * 100 ? 'buy' : price < period * 50 ? 'sell' : 'neutral';
}

export function getMACDSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2000 ? 'buy' : price < 1500 ? 'sell' : 'neutral';
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
  return price > 2200 ? 'sell' : price < 1800 ? 'buy' : 'neutral';
}

export function getATRSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2100 ? 'sell' : price < 1900 ? 'buy' : 'neutral';
}

export function getFibonacciSignal(price: number): 'buy' | 'sell' | 'neutral' {
  return price > 2300 ? 'sell' : price < 1700 ? 'buy' : 'neutral';
}

export function getVPVRSignal(volume: number, price: number): 'buy' | 'sell' | 'neutral' {
  const vpvr = calculateVPVR(volume, price);
  return vpvr > 1000 ? 'buy' : vpvr < 500 ? 'sell' : 'neutral';
}

export function getDefaultIndicators(price: number, volume?: number) {
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
      value: volume ? calculateVPVR(volume, price) : 0,
      signal: volume ? getVPVRSignal(volume, price) : 'neutral',
      description: 'Volume Profile Visible Range shows trading activity at specific price levels, helping identify support and resistance.',
      learnMoreUrl: 'https://www.investopedia.com/terms/v/volume-profile.asp'
    }
  ];
}
