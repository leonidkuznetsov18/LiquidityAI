import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate 
} from "@langchain/core/prompts";

// Initialize OpenAI chat model
const model = new ChatOpenAI({
  modelName: "gpt-4o", // Latest model as of May 13, 2024
  temperature: 0.7,
});

// Define output schemas
const newsAnalysisSchema = {
  type: "object",
  properties: {
    sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
    score: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    impact: {
      type: "object",
      properties: {
        shortTerm: { type: "number", minimum: 0, maximum: 1 },
        longTerm: { type: "number", minimum: 0, maximum: 1 }
      }
    },
    reasoning: { type: "string" }
  }
};

const technicalAnalysisSchema = {
  type: "object",
  properties: {
    indicators: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
          signal: { type: "string", enum: ["buy", "sell", "neutral"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          description: { type: "string" }
        }
      }
    },
    overallSentiment: { type: "number", minimum: -1, maximum: 1 },
    priceRange: {
      type: "object",
      properties: {
        low: { type: "number", minimum: 0 },
        high: { type: "number", minimum: 0 },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      }
    }
  }
};

// Create prompt templates
const newsAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
You are a crypto market expert specializing in news analysis. Analyze the provided headlines for market impact.

Sentiment Classification Rules:
POSITIVE indicators:
- Adoption/Integration: 'partnership', 'integration', 'launch', 'adoption'
- Development: 'upgrade', 'improvement', 'milestone', 'achievement'
- Market Growth: 'surge', 'rally', 'breakthrough', 'record'
- Institutional Interest: 'investment', 'institutional', 'fund', 'acquisition'

NEGATIVE indicators:
- Security Issues: 'hack', 'breach', 'vulnerability', 'exploit'
- Regulatory: 'ban', 'restriction', 'crackdown', 'regulation'
- Market Decline: 'crash', 'decline', 'dump', 'selloff'
- Technical Problems: 'bug', 'issue', 'delay', 'failure'

NEUTRAL indicators:
- Updates: 'maintenance', 'update', 'announcement'
- Research: 'study', 'analysis', 'review'
- Market Movement: 'volatility', 'fluctuation'

Return analysis following the specified format.
  `),
  HumanMessagePromptTemplate.fromTemplate("{headlines}")
]);

const technicalAnalysisPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
You are an expert crypto technical analyst. Analyze the market data using standard technical indicators.

Trading Signal Rules:
BUY Signals:
- RSI < 30: Strong oversold
- StochRSI < 20: Extreme oversold
- Price below lower BB with high volume
- MACD bullish crossover

SELL Signals:
- RSI > 70: Strong overbought
- StochRSI > 80: Extreme overbought
- Price above upper BB with declining volume
- MACD bearish crossover

Signal Confidence Rules:
- Multiple confirming indicators: High confidence (0.8-1.0)
- Single strong signal: Medium confidence (0.5-0.7)
- Mixed signals: Low confidence (0.2-0.4)

Current Price: {price}
24h Volume: {volume}
24h Price Change: {priceChange}
  `),
  HumanMessagePromptTemplate.fromTemplate("Analyze the current market conditions.")
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

// Refinement chains
const createRefinementChain = (initialAnalysis: string) => {
  const refinementPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`
Review and refine the following analysis:

${initialAnalysis}

Consider:
1. Signal Confirmation
2. Market Context
3. Volume Profile
4. Multiple Timeframes

Provide a more precise analysis with the same structure.
    `),
    HumanMessagePromptTemplate.fromTemplate("Refine the analysis with more precision.")
  ]);

  return RunnableSequence.from([
    refinementPrompt,
    model,
    new StringOutputParser()
  ]);
};

export const runAnalysisWithRefinement = async (
  chain: RunnableSequence,
  input: Record<string, any>,
  iterations: number = 2
) => {
  let result = await chain.invoke(input);
  
  for (let i = 0; i < iterations - 1; i++) {
    const refinementChain = createRefinementChain(JSON.stringify(result, null, 2));
    const refinement = await refinementChain.invoke({});
    result = { ...result, ...JSON.parse(refinement) };
  }
  
  return result;
};
