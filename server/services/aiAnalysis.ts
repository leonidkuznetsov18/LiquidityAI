import OpenAI from "openai";
import { 
  NewsItem, 
  AINewsAnalysis, 
  AITechnicalAnalysis,
  REQUIRED_INDICATORS,
  TECHNICAL_ANALYSIS
} from './utils/utils';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-3.5-turbo";

// Verify OpenAI API key validity
async function verifyApiKey(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return false;
  }
  try {
    await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: "API key verification test" }],
      max_tokens: 5
    });
    return true;
  } catch (error) {
    console.error('OpenAI API key verification failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function refineNewsAnalysis(
  analysis: AINewsAnalysis,
  headlines: NewsItem[]
): Promise<AINewsAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a crypto news analysis expert. Review and refine the previous sentiment analysis for these headlines.
          Consider:
          1. Market Impact:
             - Major partnerships/adoption: Very Positive
             - Technical achievements: Positive
             - Minor issues: Slightly Negative
             - Security breaches: Very Negative
          2. Source Credibility
          3. Time Relevance
          4. Market Context
          
          Current analysis:
          - Sentiment: ${analysis.sentiment}
          - Score: ${analysis.score}
          - Confidence: ${analysis.confidence}
          
          Return refined JSON analysis with detailed reasoning.`
        },
        {
          role: "user",
          content: JSON.stringify(headlines)
        }
      ],
      response_format: { type: "json_object" },
    });

    const refinedAnalysis = JSON.parse(response.choices[0].message.content);
    return {
      sentiment: refinedAnalysis.sentiment || analysis.sentiment,
      score: Math.max(0, Math.min(1, refinedAnalysis.score || analysis.score)),
      confidence: Math.max(0, Math.min(1, refinedAnalysis.confidence || analysis.confidence)),
      impact: {
        shortTerm: Math.max(0, Math.min(1, refinedAnalysis.impact?.shortTerm || analysis.impact.shortTerm)),
        longTerm: Math.max(0, Math.min(1, refinedAnalysis.impact?.longTerm || analysis.impact.longTerm))
      }
    };
  } catch (error) {
    console.error('News analysis refinement failed:', error);
    return analysis;
  }
}

export async function analyzeNewsWithAI(headlines: NewsItem[]): Promise<AINewsAnalysis> {
  try {
    if (!await verifyApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a crypto market expert specializing in news analysis. Analyze the provided headlines for market impact.
          
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
          
For each headline:
1. Identify key terms from the classification rules
2. Consider context and magnitude
3. Assess market impact probability
4. Calculate confidence based on source reliability and clarity
          
Return a JSON object with:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": number (0-1),
  "confidence": number (0-1),
  "impact": {
    "shortTerm": number (0-1),
    "longTerm": number (0-1)
  },
  "reasoning": string
}`
        },
        {
          role: "user",
          content: JSON.stringify(headlines)
        }
      ],
      response_format: { type: "json_object" },
    });

    let analysis = JSON.parse(response.choices[0].message.content);

    // Normalize and validate initial analysis
    let initialAnalysis: AINewsAnalysis = {
      sentiment: analysis.sentiment || 'neutral',
      score: Math.max(0, Math.min(1, analysis.score || 0.5)),
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      impact: {
        shortTerm: Math.max(0, Math.min(1, analysis.impact?.shortTerm || 0.5)),
        longTerm: Math.max(0, Math.min(1, analysis.impact?.longTerm || 0.5))
      }
    };

    // Refine the analysis
    return await refineNewsAnalysis(initialAnalysis, headlines);
  } catch (error) {
    console.error('AI News Analysis failed:', error);
    throw error;
  }
}

async function refineTechnicalAnalysis(
  analysis: AITechnicalAnalysis,
  currentPrice: number,
  volume24h: number,
  priceChange24h: number
): Promise<AITechnicalAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a crypto technical analysis expert. Review and refine the previous technical analysis:
          
Current Market Data:
- Price: $${currentPrice}
- 24h Volume: $${volume24h}
- 24h Price Change: $${priceChange24h}
          
Previous Analysis:
${JSON.stringify(analysis, null, 2)}
          
Refine the analysis considering:
1. Signal Confirmation:
   - Multiple timeframe alignment
   - Volume confirmation
   - Pattern completion
2. Relative Strength:
   - Compare signals across indicators
   - Weight based on reliability
3. Market Context:
   - Current market phase
   - Support/resistance levels
   - Volume profile
          
Return refined JSON analysis with improved confidence scores and detailed reasoning.`
        },
        {
          role: "user",
          content: "Please refine the technical analysis with more precise signals and confidence levels."
        }
      ],
      response_format: { type: "json_object" },
    });

    const refinedAnalysis = JSON.parse(response.choices[0].message.content);
    return {
      indicators: refinedAnalysis.indicators.map((indicator: any) => ({
        ...indicator,
        value: Number(indicator.value) || 0,
        confidence: Math.max(0, Math.min(1, indicator.confidence || 0.5)),
        signal: indicator.signal?.toLowerCase() || 'neutral'
      })),
      overallSentiment: Math.max(-1, Math.min(1, refinedAnalysis.overallSentiment || 0)),
      priceRange: {
        low: Math.max(0, refinedAnalysis.priceRange?.low || 0),
        high: Math.max(refinedAnalysis.priceRange?.low || 0 + 1, refinedAnalysis.priceRange?.high || 0),
        confidence: Math.max(0, Math.min(1, refinedAnalysis.priceRange?.confidence || 0.5))
      }
    };
  } catch (error) {
    console.error('Technical analysis refinement failed:', error);
    return analysis;
  }
}

async function analyzeTechnicalIndicatorsWithAI(
  currentPrice: number,
  volume24h: number,
  priceChange24h: number,
  existingIndicators: any[]
): Promise<AITechnicalAnalysis> {
  try {
    if (!await verifyApiKey()) {
      throw new Error('Invalid or missing OpenAI API key');
    }

    const technicalData = {
      currentPrice,
      volume24h,
      priceChange24h,
      indicators: existingIndicators,
      technicalLevels: {
        rsi: {
          overbought: TECHNICAL_ANALYSIS.RSI.OVERBOUGHT,
          oversold: TECHNICAL_ANALYSIS.RSI.OVERSOLD
        },
        fibonacci: TECHNICAL_ANALYSIS.FIBONACCI_LEVELS,
        volumeZones: TECHNICAL_ANALYSIS.VOLUME_PROFILE_ZONES
      }
    };

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert crypto technical analyst. Analyze the following 8 technical indicators:

${REQUIRED_INDICATORS.map(indicator => 
  `${indicator.fullName}: ${indicator.description}`
).join('\n')}

Trading Signal Rules:
BUY Signals:
- RSI < 30: Strong oversold
- StochRSI < 20: Extreme oversold
- Price below lower BB with high volume
- MACD bullish crossover
- Multiple support level convergence
- Rising volume with price increase

SELL Signals:
- RSI > 70: Strong overbought
- StochRSI > 80: Extreme overbought
- Price above upper BB with declining volume
- MACD bearish crossover
- Multiple resistance level convergence
- Falling volume with price increase

NEUTRAL Signals:
- RSI between 40-60
- Price within BB middle band
- Low volume or conflicting indicators

Signal Confidence Rules:
- Multiple confirming indicators: High confidence (0.8-1.0)
- Single strong signal: Medium confidence (0.5-0.7)
- Mixed signals: Low confidence (0.2-0.4)
- Conflicting signals: Very low confidence (0-0.1)

Return a JSON response with:
{
  "indicators": [{
    "name": string,
    "value": number,
    "signal": "buy" | "sell" | "neutral",
    "confidence": number,
    "description": string,
    "learnMoreUrl": string
  }],
  "overallSentiment": number (-1 to 1),
  "priceRange": {
    "low": number,
    "high": number,
    "confidence": number
  }
}`
        },
        {
          role: "user",
          content: JSON.stringify(technicalData)
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Map the AI analysis back to our required indicator structure
    const normalizedIndicators = REQUIRED_INDICATORS.map(requiredIndicator => {
      const aiIndicator = analysis.indicators.find(
        (i: any) => i.name.toLowerCase().includes(requiredIndicator.name.toLowerCase())
      ) || {
        value: 0,
        signal: 'neutral',
        confidence: 0.5
      };

      return {
        name: requiredIndicator.fullName,
        value: Number(aiIndicator.value) || 0,
        signal: aiIndicator.signal?.toLowerCase() || 'neutral',
        confidence: Math.max(0, Math.min(1, aiIndicator.confidence || 0.5)),
        description: requiredIndicator.description,
        learnMoreUrl: requiredIndicator.learnMoreUrl
      };
    });

    return {
      indicators: normalizedIndicators,
      overallSentiment: Math.max(-1, Math.min(1, analysis.overallSentiment || 0)),
      priceRange: {
        low: Math.max(currentPrice * 0.85, Math.min(analysis.priceRange?.low || currentPrice * 0.95, currentPrice * 0.95)),
        high: Math.max(currentPrice * 1.05, Math.min(analysis.priceRange?.high || currentPrice * 1.15, currentPrice * 1.15)),
        confidence: Math.max(0, Math.min(1, analysis.priceRange?.confidence || 0.5))
      }
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
  explanation: string;
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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a crypto price prediction expert. 
          
Price Range Prediction Rules:
1. Technical Analysis Weight (70%):
   - Current Price is the anchor point
   - Maximum range deviation: ±5% from current price for high confidence
   - Maximum range deviation: ±8% from current price for medium confidence
   - Maximum range deviation: ±12% from current price for low confidence
          
2. Signal Strength Impact:
   - Strong buy signals: Push range up by 2-3%
   - Strong sell signals: Push range down by 2-3%
   - Mixed signals: Keep range tight (±3%)
          
3. Volume Confirmation:
   - High volume confirms trend: Expand range by 1%
   - Low volume suggests uncertainty: Contract range by 1%
          
4. News Impact (30%):
   - Major positive news: +1-2% to range
   - Major negative news: -1-2% to range
   - News confidence below 0.5: Reduce impact by 50%
          
5. Confidence Calculation:
   - Technical signal agreement: 0-40%
   - Volume confirmation: 0-20%
   - News impact clarity: 0-20%
   - Market volatility adjustment: 0-20%
          
6. Validation Rules:
   - rangeLow must be > currentPrice * 0.88
   - rangeHigh must be < currentPrice * 1.12
   - rangeLow must be < rangeHigh
   - Confidence must be between 0-100
          
Return a JSON response with:
{
  "rangeLow": number,
  "rangeHigh": number,
  "confidence": number (0-100),
  "explanation": string (detailed explanation of the prediction factors and reasoning)
}`
        },
        {
          role: "user",
          content: JSON.stringify(analysisData)
        }
      ],
      response_format: { type: "json_object" },
    });

    const prediction = JSON.parse(response.choices[0].message.content);

    // Validate and normalize the prediction
    const normalizedPrediction = {
      rangeLow: Math.max(price * 0.88, Math.min(prediction.rangeLow, price * 0.95)),
      rangeHigh: Math.max(price * 1.05, Math.min(prediction.rangeHigh, price * 1.12)),
      confidence: Math.max(0, Math.min(100, prediction.confidence)),
      timestamp: Date.now(),
      explanation: prediction.explanation || "No explanation available"
    };

    // Ensure rangeLow is less than rangeHigh
    if (normalizedPrediction.rangeLow >= normalizedPrediction.rangeHigh) {
      normalizedPrediction.rangeLow = price * 0.97;
      normalizedPrediction.rangeHigh = price * 1.03;
    }

    return normalizedPrediction;

  } catch (error) {
    console.error('AI Prediction Generation failed:', error);
    throw error;
  }
}

export { analyzeTechnicalIndicatorsWithAI };