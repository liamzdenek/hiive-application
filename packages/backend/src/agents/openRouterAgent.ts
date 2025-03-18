import axios from 'axios';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = 'meta-llama/llama-3.1-70b-instruct';

// Check if API key is set
if (!OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY environment variable is not set. LLM operations will fail.');
}

/**
 * Interface for OpenRouter API request
 */
interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Interface for OpenRouter API response
 */
interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Analyzes the sentiment of an article using OpenRouter LLM
 * @param title Article title
 * @param content Article content
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(title: string, content: string): Promise<{
  overallSentiment: number;
  confidence: number;
  topics: Array<{
    name: string;
    sentiment: number;
    relevance: number;
  }>;
  keyInsights: string[];
  riskFactors: string[];
}> {
  // Create system prompt for sentiment analysis
  const systemPrompt = `You are a financial sentiment analysis expert. Analyze the following article about a company and provide a detailed sentiment analysis.
Focus on extracting financial sentiment, key insights, risk factors, and relevant topics.`;

  // Create user prompt with the article
  const userPrompt = `Title: ${title}\n\nContent: ${content}\n\nProvide a detailed sentiment analysis with the following information:
1. Overall sentiment score (0 to 1 where 0 is extremely negative, 0.5 is neutral, and 1 is extremely positive)
2. Confidence level (0 to 1)
3. Key topics mentioned in the article with their sentiment scores and relevance
4. Key insights extracted from the article
5. Risk factors or concerns mentioned

Format your response as a JSON object with the following structure:
{
  "overallSentiment": number, // 0 to 1
  "confidence": number, // 0 to 1
  "topics": [
    {
      "name": string,
      "sentiment": number, // 0 to 1
      "relevance": number // 0 to 1
    }
  ],
  "keyInsights": string[],
  "riskFactors": string[]
}`;

  // Prepare request for OpenRouter API
  const request: OpenRouterRequest = {
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2, // Lower temperature for more consistent results
    max_tokens: 1000 // Limit response size
  };

  try {
    // Call OpenRouter API
    console.log(`Calling OpenRouter API with model: ${MODEL_NAME}`);
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://hiive.ai', // Replace with your actual domain
          'X-Title': 'Hiive Sentiment Analyzer'
        }
      }
    );

    // Extract and parse the response
    const responseContent = response.data.choices[0]?.message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenRouter API');
    }

    // Extract JSON from the response (handle potential text before/after JSON)
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from OpenRouter response');
    }

    // Parse the JSON response
    const analysisResult = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (
      typeof analysisResult.overallSentiment !== 'number' ||
      typeof analysisResult.confidence !== 'number' ||
      !Array.isArray(analysisResult.topics) ||
      !Array.isArray(analysisResult.keyInsights) ||
      !Array.isArray(analysisResult.riskFactors)
    ) {
      throw new Error('Invalid response structure from OpenRouter API');
    }

    // Log token usage for monitoring
    console.log('OpenRouter API token usage:', response.data.usage);

    return {
      overallSentiment: analysisResult.overallSentiment,
      confidence: analysisResult.confidence,
      topics: analysisResult.topics,
      keyInsights: analysisResult.keyInsights,
      riskFactors: analysisResult.riskFactors
    };
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    // Rethrow the error to fail the Lambda execution
    throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}