import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { runNewsAnalysis, runTechnicalAnalysis } from './langGraph/analysisGraph';

interface NewsItem {
  title: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface AINewsAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  impact: {
    shortTerm: number;
    longTerm: number;
  };
}

interface AITechnicalAnalysis {
  indicators: Array<{
    name: string;
    value: number;
    signal: string;
    confidence: number;
    description: string;
  }>;
  overallSentiment: number;
  priceRange: {
    low: number;
    high: number;
    confidence: number;
  };
}

// Initialize OpenAI chat model
const openai = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

// Verify OpenAI API key validity
async function verifyApiKey(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return false;
  }
  try {
    // Use a simple test message to verify the API key
    const messages: BaseMessage[] = [
      new SystemMessage("API key verification test"),
      new HumanMessage("Test")
    ];

    await openai.invoke(messages);
    return true;
  } catch (error) {
    console.error('OpenAI API key verification failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

export async function analyzeNewsWithAI(headlines: NewsItem[]): Promise<AINewsAnalysis> {
  try {
    if (!await verifyApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    console.log('Analyzing headlines:', headlines);
    const result = await runNewsAnalysis(JSON.stringify(headlines));
    console.log('News analysis result:', result);

    // Ensure we have a valid response structure
    return {
      sentiment: result.sentiment || 'neutral',
      score: Math.max(0.01, result.score || 0.5),
      confidence: Math.max(0.01, result.confidence || 0.5),
      impact: {
        shortTerm: Math.max(0.01, result.impact?.shortTerm || 0.5),
        longTerm: Math.max(0.01, result.impact?.longTerm || 0.5)
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

    console.log('Analyzing technical data:', { currentPrice, volume24h, priceChange24h });
    const result = await runTechnicalAnalysis(currentPrice, volume24h, priceChange24h);
    console.log('Technical analysis result:', result);

    // Ensure we have valid indicators and non-zero sentiment
    return {
      indicators: result.indicators.map(indicator => ({
        ...indicator,
        value: Number(indicator.value || 0),
        confidence: Math.max(0.01, Math.min(1, indicator.confidence || 0.5)),
        signal: indicator.signal?.toLowerCase() || 'neutral'
      })),
      overallSentiment: result.overallSentiment === 0 ? 0.01 : (result.overallSentiment || 0.01),
      priceRange: {
        low: Math.max(0, result.priceRange?.low || currentPrice * 0.95),
        high: Math.max(result.priceRange?.low || currentPrice, result.priceRange?.high || currentPrice * 1.05),
        confidence: Math.max(0.01, Math.min(1, result.priceRange?.confidence || 0.5))
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

    const messages: BaseMessage[] = [
      new SystemMessage(
        `You are a crypto price prediction expert. Using the provided technical and news analysis, generate a price range prediction that considers both technical factors and market sentiment. Focus on realistic ranges based on current volatility and market conditions.

Return strict JSON in this format:
{
  "rangeLow": number,
  "rangeHigh": number,
  "confidence": number between 0-100,
  "reasoning": string
}`
      ),
      new HumanMessage(JSON.stringify(analysisData))
    ];

    const response = await openai.invoke(messages);
    const result = JSON.parse(response.content);
    console.log('Prediction result:', result);

    return {
      rangeLow: Math.max(0, result.rangeLow || price * 0.95),
      rangeHigh: Math.max(result.rangeLow || price, result.rangeHigh || price * 1.05),
      confidence: Math.max(1, Math.min(100, result.confidence || 50)),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}