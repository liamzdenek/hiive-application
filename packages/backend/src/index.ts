import express from 'express';
import { createSuccessResponse } from '@hiive/shared';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json(createSuccessResponse({ status: 'ok' }));
});

app.get('/api/companies/:companyId/sentiment', (req, res) => {
  // This would be implemented with actual data in the future
  res.json(createSuccessResponse({
    companyId: req.params.companyId,
    companyName: 'Example Tech Inc.',
    lastUpdated: new Date().toISOString(),
    overallSentiment: {
      score: 0.65,
      trend: 0.05,
      confidence: 0.82
    },
    topicSentiments: [],
    recentInsights: [],
    sources: {},
    timeDistribution: {
      last24h: 0,
      last7d: 0,
      last30d: 0
    }
  }));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;