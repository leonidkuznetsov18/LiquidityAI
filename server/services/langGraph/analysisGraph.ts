import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate 
} from "@langchain/core/prompts";
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

const systemPromptNews = `You are a crypto market expert specializing in news analysis. 
Return ONLY valid JSON without any additional text or apologies. Follow this exact format:
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

Classification Rules:
- POSITIVE: partnerships, launches, upgrades, growth
- NEGATIVE: hacks, bans, crashes, technical issues
- NEUTRAL: updates, research, regular market movement`;

const systemPromptTechnical = `You are an expert crypto technical analyst.
Return ONLY valid JSON without any additional text or apologies. Follow this exact format:
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
  "overallSentiment": number from -1 to 1 (never return 0),
  "priceRange": {
    "low": number greater than 0,
    "high": number greater than low,
    "confidence": number from 0 to 1
  }
}`;

// Create prompt templates
const newsAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(systemPromptNews),
  HumanMessagePromptTemplate.fromTemplate("Headlines to analyze: {headlines}")
]);

const technicalAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(systemPromptTechnical),
  HumanMessagePromptTemplate.fromTemplate("Market data: Price={price}, Volume={volume}, Change={change}")
]);

// Create chains with proper response format
const createNewsAnalysisChain = () => {
  return RunnableSequence.from([
    newsAnalysisPrompt,
    model.bind({ response_format: { type: "json_object" } }),
    new JsonOutputParser()
  ]);
};

const createTechnicalAnalysisChain = () => {
  return RunnableSequence.from([
    technicalAnalysisPrompt,
    model.bind({ response_format: { type: "json_object" } }),
    new JsonOutputParser()
  ]);
};

// Export functions with fallback handling
export async function runNewsAnalysis(headlines: string): Promise<any> {
  try {
    const chain = createNewsAnalysisChain();
    const result = await chain.invoke({
      headlines: headlines.replace(/[\[\]{}]/g, '') // Remove brackets and braces
    });
    return result;
  } catch (error) {
    console.error('News analysis chain failed:', error);
    // Return fallback values on error
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

export async function runTechnicalAnalysis(price: number, volume: number, priceChange: number): Promise<any> {
  try {
    // Get technical indicators from our calculations
    const indicators = getDefaultIndicators(price, volume);
    const sentiment = calculateOverallSentiment(price, volume);

    // Get market trend
    const ema = indicators.find(i => i.name === 'EMA (14)')?.value || 0;
    const rsi = indicators.find(i => i.name === 'RSI')?.value || 0;
    const macd = indicators.find(i => i.name === 'MACD')?.value || 0;
    const trend = getMarketTrend(price, ema, rsi, macd);

    try {
      const chain = createTechnicalAnalysisChain();
      const result = await chain.invoke({
        price: price.toString(),
        volume: volume.toString(),
        change: priceChange.toString()
      });

      // Merge AI results with our calculated values
      return {
        indicators: indicators,
        overallSentiment: Math.max(0.01, result.overallSentiment || sentiment),
        marketTrend: trend,
        priceRange: {
          low: Math.max(price * 0.95, result.priceRange?.low || 0),
          high: Math.max(price * 1.05, result.priceRange?.high || 0),
          confidence: Math.max(0.5, result.priceRange?.confidence || 0)
        }
      };
    } catch (error) {
      console.error('AI analysis failed, using fallback values:', error);
      // Return fallback values using our calculations
      return {
        indicators: indicators,
        overallSentiment: sentiment,
        marketTrend: trend,
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