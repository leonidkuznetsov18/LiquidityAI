import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
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

// Initialize OpenAI chat model with forced JSON response
const openai = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  modelKwargs: {
    response_format: { type: "json_object" }
  }
});

// Verify OpenAI API key validity
async function verifyApiKey(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return false;
  }
  try {
    const prompt = PromptTemplate.fromTemplate("Test prompt");
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

    const predictionPrompt = PromptTemplate.fromTemplate(`
System: You are a crypto price prediction expert. You must return only valid JSON without any explanation text.
Human: Based on the following data, generate a price prediction:
Current Price: {price}
Technical Analysis: {technical}
News Analysis: {news}

Return a JSON object with exactly these fields and nothing else:
{
  "rangeLow": number (minimum predicted price),
  "rangeHigh": number (maximum predicted price),
  "confidence": number (between 0-100),
  "reasoning": string (brief explanation)
}`);

    const chain = RunnableSequence.from([
      predictionPrompt,
      openai,
      new JsonOutputParser()
    ]);

    console.log('Generating prediction with data:', {
      price,
      technical: JSON.stringify(technicalAnalysis),
      news: JSON.stringify(newsAnalysis)
    });

    const result = await chain.invoke({
      price: price.toString(),
      technical: JSON.stringify(technicalAnalysis),
      news: JSON.stringify(newsAnalysis)
    });

    console.log('Raw prediction result:', result);
    const prediction = predictionSchema.parse(result);
    console.log('Parsed prediction:', prediction);

    return {
      rangeLow: Math.max(0, prediction.rangeLow),
      rangeHigh: Math.max(prediction.rangeLow, prediction.rangeHigh),
      confidence: Math.max(1, Math.min(100, prediction.confidence)),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}