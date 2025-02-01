import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
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

const predictionSchema = z.object({
  rangeLow: z.number().min(0),
  rangeHigh: z.number().min(0),
  confidence: z.number().min(0).max(100),
  reasoning: z.string()
});

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
    const prompt = PromptTemplate.fromTemplate('Test message');
    await prompt.format({});
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
      score: Math.max(0.01, result.score),
      confidence: Math.max(0.01, result.confidence),
      impact: {
        shortTerm: Math.max(0.01, result.impact.shortTerm),
        longTerm: Math.max(0.01, result.impact.longTerm)
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

    return {
      indicators: result.indicators,
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

    const template = `
You are a crypto price prediction expert. Analyze the provided technical and news data to generate a price range prediction.
Return ONLY valid JSON in this format:
{
  "rangeLow": number,
  "rangeHigh": number,
  "confidence": number between 0-100,
  "reasoning": string
}

Analysis data: {analysisData}`;

    const prompt = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await prompt.format({
      analysisData: JSON.stringify({
        currentPrice: price,
        technicalAnalysis,
        newsAnalysis,
        timestamp: Date.now()
      })
    });

    const completion = await openai.invoke([formattedPrompt]);
    const responseText = completion.content;

    if (typeof responseText !== 'string') {
      throw new Error('Invalid response format from OpenAI');
    }

    const result = predictionSchema.parse(JSON.parse(responseText));

    return {
      rangeLow: Math.max(0, result.rangeLow),
      rangeHigh: Math.max(result.rangeLow, result.rangeHigh),
      confidence: Math.max(1, Math.min(100, result.confidence)),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}