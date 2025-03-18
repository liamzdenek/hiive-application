# Demo Script: Hiive AI Market Sentiment Analyzer

1. Introduction (1 minute)
2. Technical Architecture & Implementation (1.5 minutes)
3. User Experience & Business Impact (1 minute)
4. AI-Powered Sentiment Analysis Demo (1.5 minutes)
5. Conclusion & Why Hiive (1 minute)

## 1. Introduction (1 minute)
1. Hello Stuart, Prab, and the team at Hiive, I'm Liam. I'm a hands-on SWE with 14 years of experience. I have a track record of delivering technical impact.
2. I'm interested in applying to the open Principal Engineer role at Hiive.
3. Instead of a traditional application, I've built a functional demo that showcases both my technical skills and my understanding of Hiive's business by leveraging Agentic AI.
4. I've created an AI Market Sentiment Analyzer that addresses a critical challenge in private markets: information asymmetry.
5. Unlike public markets with standardized disclosures, private market participants often lack comprehensive data to make informed decisions.
6. This tool demonstrates how AI can bridge this gap by analyzing sentiment across various sources to provide deeper insights into pre-IPO companies.
7. I completed this end-to-end implementation in just a few hours, demonstrating my readiness to rapidly ship valuable features that could enhance Hiive's marketplace.

## 2. Technical Architecture & Implementation (1.5 minutes)
1. Let me walk you through the technical implementation that showcases my versatility across the full stack:
   1. Command Line batch creation of news articles - scraping is out of scope
   2. Uploaded articles are processed individually to extract sentiment
   3. Extracted sentiments are aggregated per-company to produce a live company summary
   4. Serverless HTTP server serves the sentiment data to the front end
   5. The front end displays sentiment data
   6. Finally, everything is deployed with AWS CDK

2. Technical Implementation Details
   1. Modern React frontend with TypeScript and CSS modules
   2. Serverless backend using AWS Lambda and Express
   3. AI-powered sentiment analysis using OpenRouter
   4. Event-driven architecture with S3 event notifications
   5. Infrastructure as code using AWS CDK
   6. Nx monorepo for efficient project organization

3. The system follows a serverless architecture with these key components:
   1. Frontend hosted on S3 with CloudFront distribution
   2. API Gateway connected to Lambda functions
   3. Article storage in S3 with lifecycle management
   4. Event-driven processing triggered by S3 uploads
   5. LLM integration using meta-llama/llama-3.1-70b-instruct model

4. I focused on building a production-ready solution that demonstrates both technical excellence and practical business value, which I believe is what Hiive is looking for in this role.

## 3. User Experience & Business Impact (1 minute)
1. Let me show you the application from a user's perspective:
   1. Clean, intuitive dashboard
   2. Company selector for viewing sentiment across different pre-IPO companies
   3. Sentiment overview with trend analysis
   4. Topic breakdown showing sentiment across different business aspects
   5. Recent insights feed highlighting key takeaways from analyzed content
   6. Article submission interface for adding new content to analyze

2. This tool delivers significant value to Hiive's marketplace:
   1. For investors: Reduces information asymmetry, increases context
   2. For sellers: Optimize timing
   3. For issuers: Enables monitoring of market perception and competitive intelligence
   4. For Hiive: Enhances platform value proposition

## 4. AI-Powered Sentiment Analysis Demo (1.5 minutes)
1. Now, I'll invite you to submit an article yourself. This site is live, and I've sent you the link.
2. The pipeline will automatically generate sentiment, extract important features, and update the summary, within about one minute of article submission
3. Note that only *recent* articles are shown, so if you select a date too far the past, it may not appear.

4. This AI-powered approach enables:
   1. Processing of unstructured data from diverse sources
   2. Extraction of nuanced insights beyond simple positive/negative classification
   3. Identification of emerging trends and potential risk factors
   4. Continuous improvement as more data is processed

## 5. Conclusion & Why I'm a fit for Hiive (1 minute)
1. This project demonstrates my ability to deliver value in several ways relevant to Hiive:
   1. My ability to focus on solving your real business problems, and building real business value prop
   2. I demonstrated skills that overlap with your needs: React, TypeScript, cloud architecture, DevOps, etc.
   3. I was rapidly able to deliver within a tight timeframe
   4. I believe I demonstrated that I don't just meet the bar, that I raise it.

2. I'm particularly excited about Hiive for several reasons:
   1. The emphasis on a small, dynamic team with direct founder interaction matches my preference for high-impact environments
   2. I want to work at a place where I can be bold, where I can drive real business value, where I can build real products, and where I can be a key part of a company's growth, and I believe that might be possible at Hiive.
   3. I believe I can accomplish my major learning goal at Hiive while delivering real impact. (improving my product oriented thinking)

3. I believe this project demonstrates that I'm ready to ship important features that will directly contribute to Hiive's growth in my first few weeks.
4. Thank you for your consideration, and I look forward to discussing further.