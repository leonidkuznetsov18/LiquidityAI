import OpenAI from "openai";
import type { NewsItem } from './crypto';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface AINewsAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  impact: {
    shortTerm: number;  // 0-1 scale
    longTerm: number;   // 0-1 scale
  };
}

interface AITechnicalAnalysis {
  indicators: {
    name: string;
    value: number;
    signal: 'buy' | 'sell' | 'neutral';
    confidence: number;
    reasoning: string;
  }[];
  overallSentiment: number;  // -1 to 1 scale
  priceRange: {
    low: number;
    high: number;
    confidence: number;
  };
}

// Verify OpenAI API key validity
async function verifyApiKey(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return false;
  }
  try {
    await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: "API key verification test" }],
      max_tokens: 5
    });
    return true;
  } catch (error) {
    console.error('OpenAI API key verification failed:', error.message);
    return false;
  }
}

export async function analyzeNewsWithAI(headlines: NewsItem[]): Promise<AINewsAnalysis> {
  try {
    if (!await verifyApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a crypto market expert specializing in news analysis. Analyze the provided headlines and return a structured analysis with sentiment, confidence, and impact scores."
        },
        {
          role: "user",
          content: JSON.stringify(headlines)
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return {
      sentiment: analysis.sentiment || 'neutral',
      score: analysis.score || 0.5,
      confidence: analysis.confidence || 0.5,
      impact: {
        shortTerm: analysis.impact?.shortTerm || 0.5,
        longTerm: analysis.impact?.longTerm || 0.5
      }
    };
  } catch (error) {
    console.error('AI News Analysis failed:', error);
    throw error;
  }
}

export async function analyzeTechnicalIndicatorsWithAI(
  currentPrice: number,
  volume24h: number,
  priceChange24h: number,
  existingIndicators: any[]
): Promise<AITechnicalAnalysis> {
  try {
    if (!await verifyApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    const marketData = {
      currentPrice,
      volume24h,
      priceChange24h,
      existingIndicators
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a crypto trading expert. Analyze the provided market data and technical indicators. 
                   Return a detailed analysis with indicator interpretations, signals, and price range predictions. 
                   Consider market conditions, volume profiles, and trend strength.`
        },
        {
          role: "user",
          content: JSON.stringify(marketData)
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    // Post-process and validate the AI output
    const normalizedIndicators = analysis.indicators?.map((indicator: any) => ({
      ...indicator,
      value: Number(indicator.value) || 0,
      confidence: Math.max(0, Math.min(1, indicator.confidence || 0.5)),
      signal: indicator.signal?.toLowerCase() || 'neutral'
    })) || [];

    return {
      indicators: normalizedIndicators,
      overallSentiment: Math.max(-1, Math.min(1, analysis.overallSentiment || 0)),
      priceRange: {
        low: Math.max(0, analysis.priceRange?.low || 0),
        high: Math.max(analysis.priceRange?.low || 0 + 1, analysis.priceRange?.high || 0),
        confidence: Math.max(0, Math.min(1, analysis.priceRange?.confidence || 0.5))
      }
    };
  } catch (error) {
    console.error('AI Technical Analysis failed:', error);
    throw error;
  }
}

export async function generatePredictionsWithAI(
  price: number,
  technicalAnalysis: AITechnicalAnalysis,
  newsAnalysis: AINewsAnalysis
): Promise<{
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
  timestamp: number;
}> {
  try {
    if (!await verifyApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    const analysisData = {
      currentPrice: price,
      technicalAnalysis,
      newsAnalysis,
      timestamp: Date.now()
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a crypto price prediction expert. Analyze the provided technical and news data 
                   to generate an optimal price range prediction. Consider both technical and sentiment factors 
                   to determine the range and confidence level.`
        },
        {
          role: "user",
          content: JSON.stringify(analysisData)
        }
      ],
      response_format: { type: "json_object" },
    });

    const prediction = JSON.parse(response.choices[0].message.content || '{}');

    return {
      rangeLow: Math.max(0, prediction.rangeLow || 0),
      rangeHigh: Math.max(prediction.rangeLow || 0 + 1, prediction.rangeHigh || 0),
      confidence: Math.max(0, Math.min(1, prediction.confidence || 0.5)) * 100,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}