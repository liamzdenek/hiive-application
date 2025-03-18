import React from 'react';
import {
  CompanySelector,
  SentimentOverview,
  TopicBreakdown,
  SentimentTrend,
  InsightsFeed,
  RecentArticles,
  ArticleUpload
} from './';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/Dashboard.module.css';

/**
 * Dashboard component that organizes all the sentiment analysis components
 */
const Dashboard: React.FC = () => {
  const { isLoading, error } = useAppContext();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <CompanySelector />
      </div>
      
      <div className={styles.mainGrid}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Loading sentiment data...</p>
          </div>
        )}
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div className={styles.leftColumn}>
          <SentimentOverview />
          <RecentArticles />
          <ArticleUpload />
        </div>
        
        <div className={styles.rightColumn}>
          <InsightsFeed />
          <TopicBreakdown />
          <SentimentTrend />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;