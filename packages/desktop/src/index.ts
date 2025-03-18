#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { S3 } from 'aws-sdk';
import { generateId, formatArticleKey } from '@hiive/shared';

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
  .action(async (options) => {
    try {
      // Read the file
      const filePath = path.resolve(options.file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse the content (assuming it's JSON or convert text to JSON)
      const article = {
        companyId: options.company,
        title: path.basename(filePath, path.extname(filePath)),
        content: fileContent,
        source: options.source,
        tags: options.tags ? options.tags.split(',').map((tag: string) => tag.trim()) : [],
        submittedAt: new Date().toISOString()
      };
      
      // In a real implementation, this would upload to S3
      console.log('Article prepared for submission:');
      console.log(JSON.stringify(article, null, 2));
      
      console.log('\nThis is a demo implementation. In a real environment, this would upload to S3.');
      
      // Example S3 upload code (commented out)
      /*
      const s3 = new S3();
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const uuid = generateId();
      const key = formatArticleKey(options.company, timestamp, uuid);
      
      await s3.upload({
        Bucket: 'hiive-articles',
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
      
      console.log(`Article uploaded to S3: ${key}`);
      */
    } catch (error) {
      console.error('Error submitting article:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();