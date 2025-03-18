import React from 'react';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/SentimentOverview.module.css';

/**
 * Component for displaying the overall sentiment score and trend
 */
const SentimentOverview: React.FC = () => {
  const { sentimentData, isLoading, error, refreshSentiment } = useAppContext();

  // Helper function to determine sentiment class
  const getSentimentClass = (score: number) => {
    if (score >= 0.6) return styles.positive;
    if (score >= 0.4) return styles.neutral;
    return styles.negative;
  };

  // Helper function to format trend
  const formatTrend = (trend: number) => {
    if (trend > 0) return `+${(trend * 100).toFixed(1)}%`;
    if (trend < 0) return `${(trend * 100).toFixed(1)}%`;
    return '0%';
  };

  // Helper function to determine trend class
  const getTrendClass = (trend: number) => {
    if (trend > 0) return styles.trendUp;
    if (trend < 0) return styles.trendDown;
    return styles.trendNeutral;
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading sentiment data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!sentimentData) {
    return <div className={styles.noData}>No sentiment data available</div>;
  }

  const { overallSentiment } = sentimentData;
  const sentimentClass = getSentimentClass(overallSentiment.score);
  const trendClass = getTrendClass(overallSentiment.trend);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Overall Sentiment</h2>
        
        <button 
          className={styles.refreshButton}
          onClick={() => refreshSentiment()}
          aria-label="Refresh sentiment data"
        >
          Refresh
        </button>
      </div>
      
      <div className={styles.scoreContainer}>
        <div className={`${styles.score} ${sentimentClass}`}>
          {(overallSentiment.score * 100).toFixed(0)}
        </div>
        <div className={styles.details}>
          <div className={styles.confidence}>
            Confidence: {(overallSentiment.confidence * 100).toFixed(0)}%
          </div>
          <div className={`${styles.trend} ${trendClass}`}>
            Trend: {formatTrend(overallSentiment.trend)}
          </div>
        </div>
      </div>
      
      <div className={styles.lastUpdated}>
        Last updated: {new Date(sentimentData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default SentimentOverview;