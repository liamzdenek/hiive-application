#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { ArticleData, generateId } from '@hiive/shared';

// List of companies (15 real big tech companies that are NOT publicly traded, with Hiive first)
const COMPANIES = [
  { id: 'hiive', name: 'Hiive' },
  { id: 'bytedance', name: 'ByteDance' },
  { id: 'epic-games', name: 'Epic Games' },
  { id: 'stripe', name: 'Stripe' },
  { id: 'spacex', name: 'SpaceX' },
  { id: 'instacart', name: 'Instacart' },
  { id: 'databricks', name: 'Databricks' },
  { id: 'chime', name: 'Chime' },
  { id: 'plaid', name: 'Plaid' },
  { id: 'fanatics', name: 'Fanatics' },
  { id: 'klarna', name: 'Klarna' },
  { id: 'nubank', name: 'Nubank' },
  { id: 'revolut', name: 'Revolut' },
  { id: 'canva', name: 'Canva' },
  { id: 'automation-anywhere', name: 'Automation Anywhere' }
];

// API endpoint for article submission
const API_ENDPOINT = 'https://tg0eiv79ib.execute-api.us-west-2.amazonaws.com/prod/api/articles';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = 'meta-llama/llama-3.1-70b-instruct';

// Check if API key is set
if (!OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY environment variable is not set. Article generation will fail.');
}

const program = new Command();

// Configure the program
program
  .name('hiive-submit-article')
  .description('CLI tool to submit articles for sentiment analysis')
  .version('0.1.0');

/**
 * Submit an article to the API
 * @param article The article data to submit
 * @returns Promise that resolves when the article is submitted
 */
async function submitArticle(article: ArticleData): Promise<void> {
  console.log('Article prepared for submission:');
  console.log(JSON.stringify(article, null, 2));
  
  console.log(`\nSubmitting article via HTTP POST...`);
  
  try {
    const response = await axios.post(API_ENDPOINT, article, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\nArticle successfully submitted. Response status: ${response.status}`);
    console.log(`\nThe article will be automatically processed for sentiment analysis.`);
    console.log(`Results will be available in the dashboard shortly.`);
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error submitting article:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error('Error submitting article:', error);
    }
    throw error;
  }
}

/**
 * Generate an article about a company using OpenRouter LLM
 * @param company The company to generate an article about
 * @returns Promise that resolves to the generated article content
 */
async function generateArticle(company: { id: string, name: string }): Promise<{ title: string, content: string }> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  console.log(`Generating article about ${company.name}...`);

  // Create system prompt for article generation
  const systemPrompt = `You are a financial news writer specializing in private tech companies.
Write a realistic, informative article about ${company.name}, a private tech company.`;

  // Create user prompt with specific instructions
  const userPrompt = `Write a detailed, factual-sounding article about ${company.name}.
The article should:
1. Have a compelling title
2. Be 400-600 words long
3. Include realistic details about the company's business model, market position, and recent developments
4. Mention potential growth areas and challenges
5. Include quotes from fictional executives or analysts
6. Have a balanced tone that discusses both positives and challenges

Format your response as a JSON object with the following structure:
{
  "title": "Your Article Title Here",
  "content": "The full article content here..."
}`;

  // Prepare request for OpenRouter API
  const request = {
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7, // Higher temperature for more creative results
    max_tokens: 1500 // Limit response size
  };

  try {
    // Call OpenRouter API
    console.log(`Calling OpenRouter API with model: ${MODEL_NAME}`);
    const response = await axios.post(
      OPENROUTER_API_URL,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://hiive.ai', // Replace with your actual domain
          'X-Title': 'Hiive Article Generator'
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

    // Clean the JSON string to handle potential control characters
    const cleanedJson = jsonMatch[0]
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\[^"\\\/bfnrtu]/g, '\\\\'); // Escape backslashes properly

    // Parse the JSON response
    let articleResult;
    try {
      articleResult = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Response content:', responseContent);
      
      // Attempt to extract title and content directly using regex as fallback
      const titleMatch = responseContent.match(/"title"\s*:\s*"([^"]+)"/);
      const contentMatch = responseContent.match(/"content"\s*:\s*"([^"]+)"/);
      
      if (titleMatch && contentMatch) {
        articleResult = {
          title: titleMatch[1],
          content: contentMatch[1]
        };
      } else {
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    }

    // Validate the response structure
    if (
      typeof articleResult.title !== 'string' ||
      typeof articleResult.content !== 'string'
    ) {
      throw new Error('Invalid response structure from OpenRouter API');
    }

    // Log token usage for monitoring
    console.log('OpenRouter API token usage:', response.data.usage);

    return {
      title: articleResult.title,
      content: articleResult.content
    };
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a random company from the list
 * @returns A randomly selected company
 */
function getRandomCompany(): { id: string, name: string } {
  if (COMPANIES.length === 0) {
    // This should never happen as we have hardcoded companies
    throw new Error('No companies available');
  }
  const randomIndex = Math.floor(Math.random() * COMPANIES.length);
  // Use non-null assertion since we've checked the array length
  return COMPANIES[randomIndex]!;
}

// Add command to submit an existing article file
program
  .command('submit')
  .description('Submit an article for sentiment analysis')
  .requiredOption('-f, --file <path>', 'Path to the article file')
  .requiredOption('-c, --company <id>', 'Company ID')
  .requiredOption('-s, --source <name>', 'Source name')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-u, --url <url>', 'Original URL of the article')
  .option('-a, --author <author>', 'Author of the article')
  .option('-p, --publication-date <date>', 'Publication date (ISO format)')
  .action(async (options) => {
    try {
      // Validate inputs
      if (!fs.existsSync(options.file)) {
        console.error(`Error: File not found: ${options.file}`);
        process.exit(1);
      }

      // Read the file
      const filePath = path.resolve(options.file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      let article: ArticleData;
      
      // Check if the file is JSON
      if (path.extname(filePath).toLowerCase() === '.json') {
        try {
          // Try to parse as JSON
          const jsonContent = JSON.parse(fileContent);
          
          // Check if it has the required fields for an article
          if (typeof jsonContent === 'object' && jsonContent !== null &&
              'title' in jsonContent && 'content' in jsonContent) {
            // Use the JSON content as the article data
            article = {
              ...jsonContent,
              companyId: options.company, // Override with command line option
              source: options.source,     // Override with command line option
              submittedAt: new Date().toISOString()
            };
          } else {
            throw new Error('JSON file does not contain required article fields (title, content)');
          }
        } catch (parseError) {
          console.error(`Error parsing JSON file: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          console.error('Falling back to treating file content as plain text');
          
          // Create the article data from plain text
          article = {
            companyId: options.company,
            title: path.basename(filePath, path.extname(filePath)),
            content: fileContent,
            source: options.source,
            submittedAt: new Date().toISOString()
          };
        }
      } else {
        // Create the article data from plain text
        article = {
          companyId: options.company,
          title: path.basename(filePath, path.extname(filePath)),
          content: fileContent,
          source: options.source,
          submittedAt: new Date().toISOString()
        };
      }
      
      // Add optional fields if provided (only if not already in JSON)
      if (options.tags && !article.tags) {
        article.tags = options.tags.split(',').map((tag: string) => tag.trim());
      }
      
      if (options.url && !article.url) {
        article.url = options.url;
      }
      
      if (options.author && !article.author) {
        article.author = options.author;
      }
      
      if (options.publicationDate && !article.publicationDate) {
        article.publicationDate = options.publicationDate;
      }
      
      await submitArticle(article);
    } catch (error) {
      console.error('Error submitting article:', error);
      process.exit(1);
    }
  });

// Add command to generate and submit a single article
program
  .command('generate')
  .description('Generate and submit an article about a company')
  .option('-c, --company <id>', 'Company ID (randomly selected if not provided)')
  .option('-s, --source <name>', 'Source name', 'ai-generated')
  .option('-t, --tags <tags>', 'Comma-separated tags', 'ai-generated,financial-news')
  .option('-a, --author <author>', 'Author of the article', 'AI Financial Reporter')
  .action(async (options) => {
    try {
      // Check if OpenRouter API key is set
      if (!OPENROUTER_API_KEY) {
        console.error('Error: OPENROUTER_API_KEY environment variable is not set');
        console.error('Please set it with: export OPENROUTER_API_KEY=your_api_key');
        process.exit(1);
      }

      // Select company (either specified or random)
      let company: { id: string, name: string };
      if (options.company) {
        const foundCompany = COMPANIES.find(c => c.id === options.company);
        if (!foundCompany) {
          console.error(`Error: Company with ID ${options.company} not found`);
          process.exit(1);
        }
        company = foundCompany;
      } else {
        company = getRandomCompany();
        console.log(`Randomly selected company: ${company.name} (${company.id})`);
      }

      // Generate article
      const generatedArticle = await generateArticle(company);

      // Create the article data
      const article: ArticleData = {
        companyId: company.id,
        title: generatedArticle.title,
        content: generatedArticle.content,
        source: options.source,
        author: options.author,
        submittedAt: new Date().toISOString(),
        tags: options.tags.split(',').map((tag: string) => tag.trim())
      };

      // Submit the article
      await submitArticle(article);
    } catch (error) {
      console.error('Error generating and submitting article:', error);
      process.exit(1);
    }
  });

// Add command to generate and submit multiple articles
program
  .command('generate-batch')
  .description('Generate and submit multiple articles about random companies')
  .requiredOption('-n, --count <number>', 'Number of articles to generate', parseInt)
  .option('-s, --source <name>', 'Source name', 'ai-generated')
  .option('-t, --tags <tags>', 'Comma-separated tags', 'ai-generated,financial-news')
  .option('-a, --author <author>', 'Author of the article', 'AI Financial Reporter')
  .action(async (options) => {
    try {
      // Check if OpenRouter API key is set
      if (!OPENROUTER_API_KEY) {
        console.error('Error: OPENROUTER_API_KEY environment variable is not set');
        console.error('Please set it with: export OPENROUTER_API_KEY=your_api_key');
        process.exit(1);
      }

      // Validate count
      const count = parseInt(options.count);
      if (isNaN(count) || count <= 0) {
        console.error('Error: Count must be a positive number');
        process.exit(1);
      }

      console.log(`Generating and submitting ${count} articles...`);

      // Generate and submit articles sequentially
      for (let i = 0; i < count; i++) {
        console.log(`\n--- Article ${i + 1}/${count} ---`);
        
        // Select random company
        const company = getRandomCompany();
        console.log(`Selected company: ${company.name} (${company.id})`);

        // Generate article
        const generatedArticle = await generateArticle(company);

        // Create the article data
        const article: ArticleData = {
          companyId: company.id,
          title: generatedArticle.title,
          content: generatedArticle.content,
          source: options.source,
          author: options.author,
          submittedAt: new Date().toISOString(),
          tags: options.tags.split(',').map((tag: string) => tag.trim())
        };

        // Submit the article
        await submitArticle(article);
      }

      console.log(`\nSuccessfully generated and submitted ${count} articles.`);
    } catch (error) {
      console.error('Error generating and submitting batch articles:', error);
      process.exit(1);
    }
  });

// Add a command to list available companies
program
  .command('list-companies')
  .description('List available companies for sentiment analysis')
  .action(() => {
    console.log('Available companies:');
    COMPANIES.forEach(company => {
      console.log(`- ${company.id} (${company.name})`);
    });
    console.log('\nUse these IDs with the submit or generate commands.');
  });

// Parse command line arguments
program.parse();