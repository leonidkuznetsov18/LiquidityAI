import { REQUIRED_INDICATORS, TECHNICAL_ANALYSIS } from "./utils";

// Signal generation with confidence
type Signal = {
  signal: "buy" | "sell" | "neutral";
  confidence: number;
};

export function calculateEMA(price: number): number {
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
export function getEMASignal(
  price: number,
  period: number,
): "buy" | "sell" | "neutral" {
  return price > period * 100
    ? "buy"
    : price < period * 50
      ? "sell"
      : "neutral";
}

export function getMACDSignal(price: number): "buy" | "sell" | "neutral" {
  return price > 2000 ? "buy" : price < 1500 ? "sell" : "neutral";
}

export function getRSISignal(price: number): "buy" | "sell" | "neutral" {
  const rsi = calculateRSI(price);
  return rsi > 70 ? "sell" : rsi < 30 ? "buy" : "neutral";
}

export function getStochRSISignal(price: number): "buy" | "sell" | "neutral" {
  const stochRSI = calculateStochRSI(price);
  return stochRSI > 80 ? "sell" : stochRSI < 20 ? "buy" : "neutral";
}

export function getBBSignal(price: number): "buy" | "sell" | "neutral" {
  return price > 2200 ? "sell" : price < 1800 ? "buy" : "neutral";
}

export function getATRSignal(price: number): "buy" | "sell" | "neutral" {
  return price > 2100 ? "sell" : price < 1900 ? "buy" : "neutral";
}

export function getFibonacciSignal(price: number): "buy" | "sell" | "neutral" {
  return price > 2300 ? "sell" : price < 1700 ? "buy" : "neutral";
}

export function getVPVRSignal(
  volume: number,
  price: number,
): "buy" | "sell" | "neutral" {
  const vpvr = calculateVPVR(volume, price);
  return vpvr > 1000 ? "buy" : vpvr < 500 ? "sell" : "neutral";
}

function getSignal(
  value: number,
  thresholds: { buy: number; sell: number },
): Signal {
  if (value >= thresholds.sell) {
    const strength = Math.min((value - thresholds.sell) / thresholds.sell, 1);
    return { signal: "sell", confidence: 0.5 + strength * 0.5 };
  }
  if (value <= thresholds.buy) {
    const strength = Math.min((thresholds.buy - value) / thresholds.buy, 1);
    return { signal: "buy", confidence: 0.5 + strength * 0.5 };
  }
  return { signal: "neutral", confidence: 0.6 }; // Higher base confidence for neutral signals
}

// Always return all 8 required indicators
export function getDefaultIndicators(
  price: number,
  volume: number = 0,
): Array<{
  name: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  confidence: number;
  description: string;
  learnMoreUrl: string;
}> {
  return REQUIRED_INDICATORS.map((indicator) => {
    let value: number;
    let signalData: Signal;

    switch (indicator.name) {
      case "EMA":
        value = calculateEMA(price);
        signalData = getSignal(value, {
          buy: price * 0.98,
          sell: price * 1.02,
        });
        break;
      case "MACD":
        value = calculateMACD(price);
        signalData = getSignal(value, {
          buy: price * 0.01,
          sell: price * 0.02,
        });
        break;
      case "RSI":
        value = calculateRSI(price);
        signalData = getSignal(value, {
          buy: TECHNICAL_ANALYSIS.RSI.OVERSOLD,
          sell: TECHNICAL_ANALYSIS.RSI.OVERBOUGHT,
        });
        break;
      case "STOCH_RSI":
        value = calculateStochRSI(price);
        signalData = getSignal(value, { buy: 20, sell: 80 });
        break;
      case "BB":
        value = calculateBB(price);
        signalData = getSignal(price / value, { buy: 0.95, sell: 1.05 });
        break;
      case "ATR":
        value = calculateATR(price);
        signalData = getSignal(value / price, { buy: 0.01, sell: 0.03 });
        break;
      case "FIBONACCI":
        value = calculateFibonacci(price);
        signalData = getSignal(price / value, { buy: 0.95, sell: 1.05 });
        break;
      case "VPVR":
        value = calculateVPVR(volume, price);
        signalData = getSignal(value, {
          buy: Math.max(price * 0.0005, 1),
          sell: Math.max(price * 0.001, 2),
        });
        break;
      default:
        value = 0;
        signalData = { signal: "neutral", confidence: 0.5 };
    }

    return {
      name: indicator.fullName,
      value,
      signal: signalData.signal,
      confidence: signalData.confidence,
      description: indicator.description,
      learnMoreUrl: indicator.learnMoreUrl,
    };
  });
}
