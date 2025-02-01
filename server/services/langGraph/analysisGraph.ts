import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate 
} from "@langchain/core/prompts";

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

const newsSystemPrompt = [
  "You are a crypto market expert specializing in news analysis. Analyze the provided headlines for market impact.",
  "",
  "Sentiment Classification Rules:",
  "POSITIVE indicators:",
  "- Adoption/Integration: 'partnership', 'integration', 'launch', 'adoption'",
  "- Development: 'upgrade', 'improvement', 'milestone', 'achievement'",
  "- Market Growth: 'surge', 'rally', 'breakthrough', 'record'",
  "- Institutional Interest: 'investment', 'institutional', 'fund', 'acquisition'",
  "",
  "NEGATIVE indicators:",
  "- Security Issues: 'hack', 'breach', 'vulnerability', 'exploit'",
  "- Regulatory: 'ban', 'restriction', 'crackdown', 'regulation'",
  "- Market Decline: 'crash', 'decline', 'dump', 'selloff'",
  "- Technical Problems: 'bug', 'issue', 'delay', 'failure'",
  "",
  "NEUTRAL indicators:",
  "- Updates: 'maintenance', 'update', 'announcement'",
  "- Research: 'study', 'analysis', 'review'",
  "- Market Movement: 'volatility', 'fluctuation'",
  "",
  'Return JSON in format:',
  '{',
  '  "sentiment": "positive" | "negative" | "neutral",',
  '  "score": number between 0-1,',
  '  "confidence": number between 0-1,',
  '  "impact": {',
  '    "shortTerm": number between 0-1,',
  '    "longTerm": number between 0-1',
  '  },',
  '  "reasoning": "string explaining analysis"',
  '}'
].join("\n");

const technicalSystemPrompt = [
  "You are an expert crypto technical analyst. Analyze the market data using standard technical indicators.",
  "",
  "Current Price: {price}",
  "24h Volume: {volume}",
  "24h Price Change: {priceChange}",
  "",
  'Return JSON in format:',
  '{',
  '  "indicators": [{',
  '    "name": "string",',
  '    "value": number,',
  '    "signal": "buy" | "sell" | "neutral",',
  '    "confidence": number between 0-1,',
  '    "description": "string"',
  '  }],',
  '  "overallSentiment": number between -1 and 1,',
  '  "priceRange": {',
  '    "low": number > 0,',
  '    "high": number > low,',
  '    "confidence": number between 0-1',
  '  }',
  '}'
].join("\n");

// Create prompt templates
const newsAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(newsSystemPrompt),
  HumanMessagePromptTemplate.fromTemplate("Headlines to analyze: {headlines}")
]);

const technicalAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(technicalSystemPrompt),
  HumanMessagePromptTemplate.fromTemplate("Analyze these market conditions")
]);

// Create chains
export const createNewsAnalysisChain = () => {
  const outputParser = StructuredOutputParser.fromZodSchema(newsAnalysisSchema);

  const chain = RunnableSequence.from([
    newsAnalysisPrompt,
    model,
    outputParser
  ]);

  return chain;
};

export const createTechnicalAnalysisChain = () => {
  const outputParser = StructuredOutputParser.fromZodSchema(technicalAnalysisSchema);

  const chain = RunnableSequence.from([
    technicalAnalysisPrompt,
    model,
    outputParser
  ]);

  return chain;
};

// Export functions
export async function runNewsAnalysis(headlines: string) {
  try {
    const chain = createNewsAnalysisChain();
    const result = await chain.invoke({ headlines });
    return result;
  } catch (error) {
    console.error('News analysis chain failed:', error);
    throw error;
  }
}

export async function runTechnicalAnalysis(price: number, volume: number, priceChange: number) {
  try {
    const chain = createTechnicalAnalysisChain();
    const result = await chain.invoke({ price, volume, priceChange });
    return result;
  } catch (error) {
    console.error('Technical analysis chain failed:', error);
    throw error;
  }
}