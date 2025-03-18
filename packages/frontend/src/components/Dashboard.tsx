import React from 'react';
import {
  CompanySelector,
  SentimentOverview,
  TopicBreakdown,
  SentimentTrend,
  InsightsFeed,
  RecentArticles
} from './';
import styles from '../styles/Dashboard.module.css';

/**
 * Dashboard component that organizes all the sentiment analysis components
 */
const Dashboard: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <CompanySelector />
      </div>
      
      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <SentimentOverview />
          <TopicBreakdown />
          <SentimentTrend />
        </div>
        
        <div className={styles.rightColumn}>
          <InsightsFeed />
          <RecentArticles />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;