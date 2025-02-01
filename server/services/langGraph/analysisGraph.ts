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
Analyze the provided headlines for market impact.

Sentiment Classification Rules:
POSITIVE: partnerships, launches, upgrades, growth
NEGATIVE: hacks, bans, crashes, technical issues
NEUTRAL: updates, research, regular market movement

Return a JSON response with:
- sentiment: "positive", "negative", or "neutral"
- score: number from 0 to 1
- confidence: number from 0 to 1
- impact: object with shortTerm and longTerm (0-1)
- reasoning: explanation string`;

const systemPromptTechnical = `You are an expert crypto technical analyst.
Analyze the market data and technical indicators provided.

Key Indicators Analyzed:
- EMA (Exponential Moving Average)
- MACD (Moving Average Convergence Divergence)
- RSI (Relative Strength Index)
- Stochastic RSI
- Bollinger Bands (BB)
- ATR (Average True Range)
- Fibonacci Retracement
- VPVR (Volume Profile Visible Range)

Return a JSON response with:
- indicators: array of the above indicators with values
- marketTrend: current market trend analysis
- overallSentiment: weighted sentiment score
- volumeAnalysis: volume-based analysis
- priceRange: predicted range with confidence`;

// Create prompt templates
const newsAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(systemPromptNews),
  HumanMessagePromptTemplate.fromTemplate("Headlines for analysis: {headlines}")
]);

const technicalAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(systemPromptTechnical),
  HumanMessagePromptTemplate.fromTemplate("Analysis data - Price: {price}, Volume: {volume}, Change: {change}")
]);

// Create chains
export const createNewsAnalysisChain = () => {
  const outputParser = new JsonOutputParser();
  const chain = RunnableSequence.from([
    newsAnalysisPrompt,
    model,
    outputParser
  ]);
  return chain;
};

export const createTechnicalAnalysisChain = () => {
  const outputParser = new JsonOutputParser();
  const chain = RunnableSequence.from([
    technicalAnalysisPrompt,
    model,
    outputParser
  ]);
  return chain;
};

// Export functions
export async function runNewsAnalysis(headlines: string): Promise<any> {
  try {
    const chain = createNewsAnalysisChain();
    const result = await chain.invoke({
      headlines: headlines.replace(/[\[\]{}]/g, '') // Remove brackets and braces
    });
    return result;
  } catch (error) {
    console.error('News analysis chain failed:', error);
    throw error;
  }
}

export async function runTechnicalAnalysis(price: number, volume: number, priceChange: number): Promise<any> {
  try {
    // Get technical indicators
    const indicators = getDefaultIndicators(price, volume);

    // Calculate overall sentiment ensuring it's never 0
    const sentiment = calculateOverallSentiment(price, volume);

    // Get market trend
    const ema = indicators.find(i => i.name === 'EMA (14)')?.value || 0;
    const rsi = indicators.find(i => i.name === 'RSI')?.value || 0;
    const macd = indicators.find(i => i.name === 'MACD')?.value || 0;
    const trend = getMarketTrend(price, ema, rsi, macd);

    // Prepare enhanced analysis data
    const analysisData = {
      price: price.toString(),
      volume: volume.toString(),
      change: priceChange.toString(),
      indicators: indicators,
      marketTrend: trend,
      overallSentiment: sentiment
    };

    const chain = createTechnicalAnalysisChain();
    const result = await chain.invoke(analysisData);

    // Ensure the sentiment is never 0 in the final result
    if (result.overallSentiment === 0) {
      result.overallSentiment = sentiment;
    }

    return {
      ...result,
      marketTrend: trend,
      indicators: indicators
    };
  } catch (error) {
    console.error('Technical analysis chain failed:', error);
    throw error;
  }
}