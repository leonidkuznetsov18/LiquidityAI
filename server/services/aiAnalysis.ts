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

    const prompt = `You must respond with ONLY a valid JSON object in this exact format, no additional text or explanations:
{
  "rangeLow": [number],
  "rangeHigh": [number],
  "confidence": [number between 0-100],
  "reasoning": [string]
}

Analyze this crypto market data to generate price prediction:
- Current price: ${price}
- Technical indicators: ${JSON.stringify(technicalAnalysis.indicators.map(i => ({ name: i.name, signal: i.signal })))}
- Market sentiment: ${technicalAnalysis.overallSentiment}
- News sentiment: ${newsAnalysis.sentiment}
- Short-term impact: ${newsAnalysis.impact.shortTerm}
- Long-term impact: ${newsAnalysis.impact.longTerm}`;

    console.log('Generating prediction with prompt:', prompt);
    const response = await openai.invoke([prompt]);
    console.log('Raw AI response:', response);

    if (!response.content || typeof response.content !== 'string') {
      throw new Error('Invalid response format from OpenAI');
    }

    let jsonResponse: any;
    try {
      // Extract JSON from the response if it's wrapped in text
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response.content;
      jsonResponse = JSON.parse(jsonStr);
    } catch (error) {
      console.error('JSON parsing error:', error);
      // Fallback to conservative prediction
      return {
        rangeLow: price * 0.95,
        rangeHigh: price * 1.05,
        confidence: 50,
        timestamp: Date.now()
      };
    }

    const prediction = predictionSchema.parse(jsonResponse);
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