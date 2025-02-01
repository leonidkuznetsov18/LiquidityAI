import { type NewsItem, type AINewsAnalysis, type AITechnicalAnalysis } from './utils/utils';
import { 
  createNewsAnalysisChain, 
  createTechnicalAnalysisChain, 
  runAnalysisWithRefinement 
} from './langGraph/analysisGraph';
import { ChatOpenAI } from "@langchain/openai";
import { TECHNICAL_INDICATORS } from './utils/utils';

// Initialize OpenAI chat model, still needed for fallback and verification
const openai = new ChatOpenAI({
  modelName: "gpt-4o", // Latest model as of May 13, 2024
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

    const chain = createNewsAnalysisChain();
    const result = await runAnalysisWithRefinement(chain, { headlines: JSON.stringify(headlines) });

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

    const chain = createTechnicalAnalysisChain();
    const result = await runAnalysisWithRefinement(chain, {
      price: currentPrice,
      volume: volume24h,
      priceChange: priceChange24h,
      indicators: TECHNICAL_INDICATORS
    });

    return {
      indicators: result.indicators.map((indicator: any) => ({
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

    // For predictions, we'll use a simpler prompt as it's already based on analyzed data
    const response = await openai.invoke([
      {
        role: "system",
        content: `You are a crypto price prediction expert. Using the provided technical and news analysis, generate a price range prediction that considers both technical factors and market sentiment. Focus on realistic ranges based on current volatility and market conditions.`
      },
      {
        role: "user",
        content: JSON.stringify(analysisData)
      }
    ]);

    const prediction = JSON.parse(response.content);

    return {
      rangeLow: Math.max(0, prediction.rangeLow || 0),
      rangeHigh: Math.max(prediction.rangeLow || 0 + 1, prediction.rangeHigh || 0),
      confidence: Math.max(0, Math.min(100, prediction.confidence || 50)),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}