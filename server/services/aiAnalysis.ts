import { type NewsItem, type AINewsAnalysis, type AITechnicalAnalysis } from './utils/utils';
import { runNewsAnalysis, runTechnicalAnalysis } from './langGraph/analysisGraph';
import { ChatOpenAI } from "@langchain/openai";

// Initialize OpenAI chat model for fallback
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
    await openai.invoke([{ role: "system", content: "API key verification test" }]);
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

    return {
      sentiment: result.sentiment,
      score: result.score,
      confidence: result.confidence,
      impact: result.impact
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

    return {
      indicators: result.indicators.map(indicator => ({
        ...indicator,
        value: Number(indicator.value),
        confidence: Math.max(0, Math.min(1, indicator.confidence)),
        signal: indicator.signal.toLowerCase()
      })),
      overallSentiment: result.overallSentiment,
      priceRange: result.priceRange
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

    console.log('Generating predictions with data:', analysisData);
    const response = await openai.invoke([
      {
        role: "system",
        content: `You are a crypto price prediction expert. Using the provided technical and news analysis, generate a price range prediction that considers both technical factors and market sentiment. Focus on realistic ranges based on current volatility and market conditions.

Return strict JSON in this format:
{
  "rangeLow": number,
  "rangeHigh": number,
  "confidence": number between 0-100,
  "reasoning": string
}`
      },
      {
        role: "user",
        content: JSON.stringify(analysisData)
      }
    ]);

    const result = JSON.parse(response.content);
    console.log('Prediction result:', result);

    return {
      rangeLow: Math.max(0, result.rangeLow || 0),
      rangeHigh: Math.max(result.rangeLow || 0 + 1, result.rangeHigh || 0),
      confidence: Math.max(0, Math.min(100, result.confidence || 50)),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}