import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

import { getDefaultIndicators, calculateOverallSentiment, getMarketTrend } from '../utils/calculations';

// Initialize OpenAI chat model
const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

// Define output schemas using Zod
const newsAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  impact: z.object({
    shortTerm: z.number().min(0).max(1),
    longTerm: z.number().min(0).max(1)
  }),
  reasoning: z.string()
});

const technicalAnalysisSchema = z.object({
  indicators: z.array(z.object({
    name: z.string(),
    value: z.number(),
    signal: z.enum(["buy", "sell", "neutral"]),
    confidence: z.number().min(0).max(1),
    description: z.string()
  })),
  overallSentiment: z.number().min(-1).max(1),
  priceRange: z.object({
    low: z.number().min(0),
    high: z.number().min(0),
    confidence: z.number().min(0).max(1)
  })
});

// Create prompt templates
const newsAnalysisTemplate = `
You are a crypto market expert specializing in news analysis.
Return ONLY valid JSON without any additional text.

{
  "sentiment": "positive" | "negative" | "neutral",
  "score": number from 0 to 1,
  "confidence": number from 0 to 1,
  "impact": {
    "shortTerm": number from 0 to 1,
    "longTerm": number from 0 to 1
  },
  "reasoning": "string"
}

Headlines to analyze: {headlines}`;

const technicalAnalysisTemplate = `
You are an expert crypto technical analyst.
Return ONLY valid JSON without any additional text.

{
  "indicators": [
    {
      "name": "string",
      "value": number,
      "signal": "buy" | "sell" | "neutral",
      "confidence": number from 0 to 1,
      "description": "string"
    }
  ],
  "overallSentiment": number from -1 to 1,
  "priceRange": {
    "low": number greater than 0,
    "high": number greater than low,
    "confidence": number from 0 to 1
  }
}

Market data: Price={price}, Volume={volume}, Change={change}`;

// Create typed chains
const createNewsAnalysisChain = () => {
  const prompt = PromptTemplate.fromTemplate(newsAnalysisTemplate);
  return RunnableSequence.from([
    {
      prompt: prompt,
      model: model,
      outputParser: new JsonOutputParser(),
    }
  ]).pipe(newsAnalysisSchema);
};

const createTechnicalAnalysisChain = () => {
  const prompt = PromptTemplate.fromTemplate(technicalAnalysisTemplate);
  return RunnableSequence.from([
    {
      prompt: prompt,
      model: model,
      outputParser: new JsonOutputParser(),
    }
  ]).pipe(technicalAnalysisSchema);
};

// Export functions with proper typing and error handling
export async function runNewsAnalysis(headlines: string): Promise<z.infer<typeof newsAnalysisSchema>> {
  try {
    const chain = createNewsAnalysisChain();
    const result = await chain.invoke({
      headlines: headlines.replace(/[\[\]{}]/g, '')
    });

    return newsAnalysisSchema.parse(result);
  } catch (error) {
    console.error('News analysis chain failed:', error);
    // Return fallback values that match the schema
    return {
      sentiment: "neutral",
      score: 0.5,
      confidence: 0.5,
      impact: {
        shortTerm: 0.5,
        longTerm: 0.5
      },
      reasoning: "Analysis failed, using fallback values"
    };
  }
}

export async function runTechnicalAnalysis(
  price: number,
  volume: number,
  priceChange: number
): Promise<z.infer<typeof technicalAnalysisSchema>> {
  try {
    // Get technical indicators from calculations
    const indicators = getDefaultIndicators(price, volume);
    const sentiment = calculateOverallSentiment(price, volume);
    const trend = getMarketTrend(
      price,
      indicators.find(i => i.name === 'EMA (14)')?.value || 0,
      indicators.find(i => i.name === 'RSI')?.value || 0,
      indicators.find(i => i.name === 'MACD')?.value || 0
    );

    try {
      const chain = createTechnicalAnalysisChain();
      const result = await chain.invoke({
        price: price.toString(),
        volume: volume.toString(),
        change: priceChange.toString()
      });

      const parsedResult = technicalAnalysisSchema.parse(result);

      // Merge AI results with calculated values
      return {
        indicators: indicators.map(i => ({
          name: i.name,
          value: i.value,
          signal: i.signal || 'neutral',
          confidence: Math.max(0.01, parsedResult.indicators.find(ai => ai.name === i.name)?.confidence || 0.5),
          description: parsedResult.indicators.find(ai => ai.name === i.name)?.description || ''
        })),
        overallSentiment: Math.max(0.01, parsedResult.overallSentiment),
        priceRange: {
          low: Math.max(price * 0.95, parsedResult.priceRange.low),
          high: Math.max(price * 1.05, parsedResult.priceRange.high),
          confidence: Math.max(0.5, parsedResult.priceRange.confidence)
        }
      };
    } catch (error) {
      console.error('AI analysis failed, using fallback values:', error);
      return {
        indicators: indicators.map(i => ({
          name: i.name,
          value: i.value,
          signal: 'neutral',
          confidence: 0.5,
          description: ''
        })),
        overallSentiment: sentiment,
        priceRange: {
          low: price * 0.95,
          high: price * 1.05,
          confidence: 0.5
        }
      };
    }
  } catch (error) {
    console.error('Technical analysis chain failed:', error);
    throw error;
  }
}