import React, { useState, useEffect } from 'react';
import { companyService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/RecentArticles.module.css';

interface Article {
  id: string;
  title: string;
  source: string;
  publicationDate: string;
  sentiment: number;
  url?: string;
  keyInsights: string[];
}

interface ArticlesResponse {
  companyId: string;
  total: number;
  articles: Article[];
}

/**
 * Component for displaying recent articles with sentiment analysis
 */
const RecentArticles: React.FC = () => {
  const { selectedCompany } = useAppContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const limit = 5;

  // Fetch articles when company changes or page changes
  useEffect(() => {
    const fetchArticles = async () => {
      if (!selectedCompany) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const offset = (page - 1) * limit;
        const response = await companyService.getCompanyArticles(
          selectedCompany,
          limit,
          offset
        );
        
        if (response.status === 'success' && response.data) {
          const articlesResponse = response.data as ArticlesResponse;
          setArticles(articlesResponse.articles);
          setTotal(articlesResponse.total);
        } else {
          setError(response.message || 'Failed to fetch articles');
        }
      } catch (err) {
        setError('An error occurred while fetching articles');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, [selectedCompany, page]);

  // Helper function to determine sentiment class
  const getSentimentClass = (score: number) => {
    if (score >= 0.6) return styles.positive;
    if (score >= 0.4) return styles.neutral;
    return styles.negative;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  if (isLoading && articles.length === 0) {
    return <div className={styles.loading}>Loading articles...</div>;
  }

  if (error && articles.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!articles || articles.length === 0) {
    return <div className={styles.noData}>No articles available</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Articles</h2>
        <div className={styles.totalCount}>{total} articles</div>
      </div>
      
      <div className={styles.articlesList}>
        {articles.map((article) => (
          <div key={article.id} className={styles.articleItem}>
            <div className={styles.articleHeader}>
              <h3 className={styles.articleTitle}>
                {article.url ? (
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.articleLink}
                  >
                    {article.title}
                  </a>
                ) : (
                  article.title
                )}
              </h3>
              <div 
                className={`${styles.sentimentBadge} ${getSentimentClass(article.sentiment)}`}
              >
                {(article.sentiment * 100).toFixed(0)}
              </div>
            </div>
            
            <div className={styles.articleMeta}>
              <div className={styles.articleSource}>{article.source}</div>
              <div className={styles.articleDate}>{formatDate(article.publicationDate)}</div>
            </div>
            
            {article.keyInsights && article.keyInsights.length > 0 && (
              <div className={styles.insightsContainer}>
                <h4 className={styles.insightsTitle}>Key Insights:</h4>
                <ul className={styles.insightsList}>
                  {article.keyInsights.map((insight, index) => (
                    <li key={index} className={styles.insightItem}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          
          <div className={styles.pageInfo}>
            Page {page} of {totalPages}
          </div>
          
          <button
            className={styles.pageButton}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentArticles;