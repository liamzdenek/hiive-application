import React from 'react';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/InsightsFeed.module.css';

/**
 * Component for displaying recent insights from sentiment analysis
 */
const InsightsFeed: React.FC = () => {
  const { sentimentData, isLoading, error } = useAppContext();

  if (isLoading) {
    return <div className={styles.loading}>Loading insights...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!sentimentData || !sentimentData.recentInsights || sentimentData.recentInsights.length === 0) {
    return <div className={styles.noData}>No insights available</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Key Insights</h2>
      
      <ul className={styles.insightsList}>
        {sentimentData.recentInsights.map((insight, index) => (
          <li key={index} className={styles.insightItem}>
            <div className={styles.insightBullet}></div>
            <div className={styles.insightText}>{insight}</div>
          </li>
        ))}
      </ul>
      
      <div className={styles.sourceInfo}>
        <h3 className={styles.sourcesTitle}>Data Sources</h3>
        <div className={styles.sourcesGrid}>
          {Object.entries(sentimentData.sources).map(([source, count]) => (
            <div key={source} className={styles.sourceItem}>
              <div className={styles.sourceLabel}>{source}</div>
              <div className={styles.sourceCount}>{count}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.timeInfo}>
        <div className={styles.timeItem}>
          <span className={styles.timeLabel}>Last 24h:</span>
          <span className={styles.timeValue}>{sentimentData.timeDistribution.last24h}</span>
        </div>
        <div className={styles.timeItem}>
          <span className={styles.timeLabel}>Last 7d:</span>
          <span className={styles.timeValue}>{sentimentData.timeDistribution.last7d}</span>
        </div>
        <div className={styles.timeItem}>
          <span className={styles.timeLabel}>Last 30d:</span>
          <span className={styles.timeValue}>{sentimentData.timeDistribution.last30d}</span>
        </div>
      </div>
    </div>
  );
};

export default InsightsFeed;