import React from 'react';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/TopicBreakdown.module.css';

/**
 * Component for displaying sentiment breakdown by topic
 */
const TopicBreakdown: React.FC = () => {
  const { sentimentData, isLoading, error } = useAppContext();

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
    return <div className={styles.loading}>Loading topic data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!sentimentData || !sentimentData.topicSentiments || sentimentData.topicSentiments.length === 0) {
    return <div className={styles.noData}>No topic data available</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Topic Sentiment Breakdown</h2>
      
      <div className={styles.topics}>
        {sentimentData.topicSentiments.map((topic, index) => (
          <div key={index} className={styles.topicItem}>
            <div className={styles.topicHeader}>
              <h3 className={styles.topicName}>{topic.topic}</h3>
              <div className={styles.topicVolume}>
                {topic.volume} {topic.volume === 1 ? 'mention' : 'mentions'}
              </div>
            </div>
            
            <div className={styles.topicDetails}>
              <div className={styles.sentimentBar}>
                <div 
                  className={`${styles.sentimentFill} ${getSentimentClass(topic.sentiment)}`}
                  style={{ width: `${topic.sentiment * 100}%` }}
                ></div>
              </div>
              
              <div className={styles.sentimentInfo}>
                <div className={styles.sentimentScore}>
                  {(topic.sentiment * 100).toFixed(0)}
                </div>
                <div className={`${styles.sentimentTrend} ${getTrendClass(topic.trend)}`}>
                  {formatTrend(topic.trend)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicBreakdown;