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

// Create prompt templates with escaped format
const newsPrompt = `You are a crypto market expert specializing in news analysis.
Analyze the following headlines and return a JSON object with exactly this structure:
sentiment: "positive" OR "negative" OR "neutral"
score: number between 0 and 1
confidence: number between 0 and 1
impact: object with shortTerm and longTerm numbers between 0 and 1
reasoning: explanation string

Headlines: {headlines}`;

const technicalPrompt = `You are an expert crypto technical analyst.
Analyze the market data and return a JSON object with exactly this structure:
indicators: array of objects with
  name: string
  value: number
  signal: "buy" OR "sell" OR "neutral"
  confidence: number between 0 and 1
  description: string
overallSentiment: number between -1 and 1
priceRange: object with
  low: number greater than 0
  high: number greater than low
  confidence: number between 0 and 1

Market data:
Price: {price}
Volume: {volume}
Change: {change}`;

// Create typed chains
const createNewsAnalysisChain = () => {
  const prompt = PromptTemplate.fromTemplate(newsPrompt);
  return RunnableSequence.from([prompt, model, new JsonOutputParser()]);
};

const createTechnicalAnalysisChain = () => {
  const prompt = PromptTemplate.fromTemplate(technicalPrompt);
  return RunnableSequence.from([prompt, model, new JsonOutputParser()]);
};

// Export functions with proper typing and error handling
export async function runNewsAnalysis(headlines: string): Promise<z.infer<typeof newsAnalysisSchema>> {
  try {
    const chain = createNewsAnalysisChain();
    const result = await chain.invoke({
      headlines: headlines.replace(/[{}]/g, '')
    });

    return newsAnalysisSchema.parse(result);
  } catch (error) {
    console.error('News analysis chain failed:', error);
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

      return {
        indicators: indicators.map(i => ({
          name: i.name,
          value: i.value,
          signal: parsedResult.indicators.find(ai => ai.name === i.name)?.signal || 'neutral',
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