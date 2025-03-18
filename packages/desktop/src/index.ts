#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { S3 } from 'aws-sdk';
import {
  generateId,
  formatArticleKey,
  S3_BUCKETS,
  ArticleData
} from '@hiive/shared';

const program = new Command();

// Configure the program
program
  .name('hiive-submit-article')
  .description('CLI tool to submit articles for sentiment analysis')
  .version('0.1.0');

// Add commands
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
      
      // Create the article data
      const article: ArticleData = {
        companyId: options.company,
        title: path.basename(filePath, path.extname(filePath)),
        content: fileContent,
        source: options.source,
        submittedAt: new Date().toISOString()
      };

      // Add optional fields if provided
      if (options.tags) {
        article.tags = options.tags.split(',').map((tag: string) => tag.trim());
      }
      
      if (options.url) {
        article.url = options.url;
      }
      
      if (options.author) {
        article.author = options.author;
      }
      
      if (options.publicationDate) {
        article.publicationDate = options.publicationDate;
      }
      
      console.log('Article prepared for submission:');
      console.log(JSON.stringify(article, null, 2));
      
      // Upload to S3
      const s3 = new S3();
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const uuid = generateId();
      // Ensure company ID is a string
      const companyId = String(options.company);
      // Ensure timestamp is a string by taking the first part of the split
      const timestampStr = timestamp || '';
      const key = formatArticleKey(companyId, timestampStr, uuid);
      
      console.log(`\nUploading to S3...`);
      
      try {
        await s3.upload({
          Bucket: S3_BUCKETS.ARTICLES,
          Key: key,
          Body: JSON.stringify(article),
          ContentType: 'application/json',
          Metadata: {
            companyId: options.company,
            source: options.source,
            submittedAt: article.submittedAt,
            tags: options.tags || ''
          }
        }).promise();
        
        console.log(`\nArticle successfully uploaded to S3: ${key}`);
        console.log(`\nThe article will be automatically processed for sentiment analysis.`);
        console.log(`Results will be available in the dashboard shortly.`);
      } catch (uploadError) {
        console.error('Error uploading to S3:', uploadError);
        console.log('\nFalling back to local mode (no upload).');
        console.log('In a production environment, this would upload to S3.');
      }
    } catch (error) {
      console.error('Error submitting article:', error);
      process.exit(1);
    }
  });

// Add a command to list available companies (for demo purposes)
program
  .command('list-companies')
  .description('List available companies for sentiment analysis')
  .action(() => {
    console.log('Available companies:');
    console.log('- company-123 (Example Tech Inc.)');
    console.log('- company-456 (Innovate AI Corp.)');
    console.log('- company-789 (Future Finance Ltd.)');
    console.log('\nUse these IDs with the submit command.');
  });

// Parse command line arguments
program.parse();