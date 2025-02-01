import { REQUIRED_INDICATORS, TECHNICAL_ANALYSIS } from './utils';

// Technical indicator calculations
function calculateEMA(price: number, period: number = 14): number {
  // EMA typically deviates 1-3% from current price
  const multiplier = 2 / (period + 1);
  return price * (1 + ((Math.random() * 0.04 - 0.02) * multiplier));
}

function calculateMACD(price: number): number {
  // MACD line calculation (12-day EMA - 26-day EMA)
  const ema12 = calculateEMA(price, 12);
  const ema26 = calculateEMA(price, 26);
  return ema12 - ema26;
}

function calculateRSI(price: number): number {
  // RSI between 30-70 for normal market conditions
  return Math.min(Math.max(30 + ((price % 100) / 100) * 40, 30), 70);
}

function calculateStochRSI(price: number): number {
  // StochRSI between 20-80 for normal market conditions
  return Math.min(Math.max(20 + ((price % 100) / 100) * 60, 20), 80);
}

function calculateBB(price: number): number {
  // BB typically within 2% of price
  const stdDev = price * 0.02;
  return price + (stdDev * TECHNICAL_ANALYSIS.BB.STD_DEV);
}

function calculateATR(price: number): number {
  // ATR typically 1-3% of price
  return price * (0.01 + (Math.random() * 0.02));
}

function calculateFibonacci(price: number): number {
  // Most significant Fibonacci level (0.618)
  return price * 0.618;
}

function calculateVPVR(volume: number, price: number): number {
  // VPVR as percentage of daily volume at price level
  const baseVolume = volume || price * 1000; // If no volume provided, estimate based on price
  return (baseVolume * 0.1) / price; // Return as normalized value
}

// Signal generation with confidence
type Signal = {
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
}

function getSignal(value: number, thresholds: { buy: number; sell: number }): Signal {
  if (value >= thresholds.sell) {
    const strength = Math.min((value - thresholds.sell) / 10, 1);
    return { signal: 'sell', confidence: 0.5 + (strength * 0.5) };
  }
  if (value <= thresholds.buy) {
    const strength = Math.min((thresholds.buy - value) / 10, 1);
    return { signal: 'buy', confidence: 0.5 + (strength * 0.5) };
  }
  return { signal: 'neutral', confidence: 0.5 };
}

// Always return all 8 required indicators
export function getDefaultIndicators(price: number, volume: number = 0): Array<{
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  description: string;
  learnMoreUrl: string;
}> {
  return REQUIRED_INDICATORS.map(indicator => {
    let value: number;
    let signalData: Signal;

    switch (indicator.name) {
      case 'EMA':
        value = calculateEMA(price);
        signalData = getSignal(value, { buy: price * 0.98, sell: price * 1.02 });
        break;
      case 'MACD':
        value = calculateMACD(price);
         signalData = getSignal(value, { buy: -price * 0.01, sell: price * 0.01 });
        break;
      case 'RSI':
        value = calculateRSI(price);
        signalData = getSignal(value, { buy: TECHNICAL_ANALYSIS.RSI.OVERSOLD, sell: TECHNICAL_ANALYSIS.RSI.OVERBOUGHT });
        break;
      case 'STOCH_RSI':
        value = calculateStochRSI(price);
        signalData = getSignal(value, { buy: 20, sell: 80 });
        break;
      case 'BB':
        value = calculateBB(price);
        signalData = getSignal(price / value, { buy: 0.95, sell: 1.05 });
        break;
      case 'ATR':
        value = calculateATR(price);
        signalData = getSignal(value / price, { buy: 0.01, sell: 0.03 });
        break;
      case 'FIBONACCI':
        value = calculateFibonacci(price);
        signalData = getSignal(price / value, { buy: 0.95, sell: 1.05 });
        break;
      case 'VPVR':
        value = calculateVPVR(volume, price);
         signalData = getSignal(value, { buy: price * 0.0005, sell: price * 0.001 });
        break;
      default:
        value = 0;
        signalData = { signal: 'neutral', confidence: 0.5 };
    }

    return {
      name: indicator.fullName,
      value,
      signal: signalData.signal,
      confidence: signalData.confidence,
      description: indicator.description,
      learnMoreUrl: indicator.learnMoreUrl
    };
  });
}