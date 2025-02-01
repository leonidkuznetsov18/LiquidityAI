import OpenAI from "openai";
import { 
  NewsItem, 
  AINewsAnalysis, 
  AITechnicalAnalysis,
  TECHNICAL_INDICATORS,
  TECHNICAL_ANALYSIS
} from './utils';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

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
          content: `You are a crypto market expert specializing in news analysis. Analyze the provided headlines and return a structured analysis with sentiment, confidence, and impact scores.
          Return the result as a JSON object with this structure:
          {
            "sentiment": "positive" | "negative" | "neutral",
            "score": number (0-1),
            "confidence": number (0-1),
            "impact": {
              "shortTerm": number (0-1),
              "longTerm": number (0-1)
            }
          }`
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

    const technicalData = {
      currentPrice,
      volume24h,
      priceChange24h,
      indicators: existingIndicators,
      technicalLevels: {
        rsi: {
          overbought: TECHNICAL_ANALYSIS.RSI.OVERBOUGHT,
          oversold: TECHNICAL_ANALYSIS.RSI.OVERSOLD
        },
        fibonacci: TECHNICAL_ANALYSIS.FIBONACCI_LEVELS,
        volumeZones: TECHNICAL_ANALYSIS.VOLUME_PROFILE_ZONES
      }
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert crypto technical analyst. Analyze the market data using advanced indicators including:
          ${Object.values(TECHNICAL_INDICATORS).map(indicator => 
            `- ${indicator.name}: ${indicator.description}`
          ).join('\n')}

          Return a detailed JSON analysis with:
          {
            "indicators": [{
              "name": string,
              "value": number,
              "signal": "buy" | "sell" | "neutral",
              "confidence": number (0-1),
              "description": string
            }],
            "overallSentiment": number (-1 to 1),
            "priceRange": {
              "low": number,
              "high": number,
              "confidence": number (0-1)
            }
          }`
        },
        {
          role: "user",
          content: JSON.stringify(technicalData)
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

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
          content: `You are a crypto price prediction expert. 
          Analyze the provided technical indicators, market data, and news sentiment to generate an optimal price range prediction.
          Consider both technical factors (RSI, BB, Fibonacci levels, volume profile) and sentiment analysis.

          Return a JSON response with:
          {
            "rangeLow": number,
            "rangeHigh": number,
            "confidence": number (0-1),
            "reasoning": string
          }`
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