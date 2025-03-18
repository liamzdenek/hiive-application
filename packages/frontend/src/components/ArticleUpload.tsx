import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { articleService } from '../services/api';
import { ArticleData } from '@hiive/shared';
import styles from '../styles/ArticleUpload.module.css';

/**
 * Interface for the article upload form data
 */
interface ArticleFormData {
  title: string;
  content: string;
  source: string;
  publicationDate: string;
  url: string;
  author: string;
  tags: string;
}

/**
 * ArticleUpload component for submitting new articles for sentiment analysis
 */
const ArticleUpload: React.FC = () => {
  const { selectedCompany, companies, refreshSentiment } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    source: '',
    publicationDate: '',
    url: '',
    author: '',
    tags: '',
  });

  // Format today's date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today: string = formatDate(new Date());

  // Sample article data that matches ArticleFormData interface
  const sampleArticle: ArticleFormData = {
    title: 'Hiive Secures $50M in Series B Funding',
    content: `Hiive, the leading marketplace for private stock, announced today that it has secured $50 million in Series B funding led by Acme Ventures with participation from existing investors. The funding will be used to expand the company's platform and accelerate growth in new markets.

"This investment validates our mission to democratize access to private market investments," said Jane Smith, CEO of Hiive. "With this funding, we'll be able to enhance our technology platform and provide even more value to our users."

The company plans to use the funds to expand its engineering team, enhance its AI-powered market analysis tools, and explore new market opportunities. Hiive has seen tremendous growth over the past year, with transaction volume increasing by 300% and user base growing by 250%.

Industry analysts view this funding as a sign of the growing importance of private market access for retail investors. "Hiive is at the forefront of a major shift in how people invest in private companies," said John Doe, analyst at Market Research Firm.

The company expects to launch several new features in the coming months, including enhanced sentiment analysis tools and expanded company coverage.`,
    source: 'TechCrunch',
    publicationDate: today, // Today's date in YYYY-MM-DD format
    url: 'https://example.com/hiive-funding',
    author: 'Sarah Johnson',
    tags: 'funding, series-b, private-markets, investment',
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load sample article data
  const loadSampleArticle = () => {
    setFormData({
      title: sampleArticle.title,
      content: sampleArticle.content,
      source: sampleArticle.source,
      publicationDate: sampleArticle.publicationDate,
      url: sampleArticle.url,
      author: sampleArticle.author,
      tags: sampleArticle.tags,
    });
    setSubmitError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      setSubmitError('Please select a company first');
      return;
    }

    if (!formData.title || !formData.content || !formData.source) {
      setSubmitError('Title, content, and source are required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Prepare article data
      const articleData: ArticleData = {
        companyId: selectedCompany,
        title: formData.title,
        content: formData.content,
        source: formData.source,
        submittedAt: new Date().toISOString(),
      };

      // Add optional fields only if they have values
      if (formData.publicationDate) articleData.publicationDate = formData.publicationDate;
      if (formData.url) articleData.url = formData.url;
      if (formData.author) articleData.author = formData.author;
      if (formData.tags) articleData.tags = formData.tags.split(',').map(tag => tag.trim());

      // Submit article
      const response = await articleService.submitArticle(articleData);
      
      if (response.status === 'success') {
        setSubmitSuccess(true);
        setFormData({
          title: '',
          content: '',
          source: '',
          publicationDate: '',
          url: '',
          author: '',
          tags: '',
        });
        
        // Refresh sentiment data after a short delay to allow processing
        setTimeout(() => {
          refreshSentiment();
        }, 2000);
      } else {
        setSubmitError(response.message || 'Failed to submit article');
      }
    } catch (error) {
      setSubmitError('An error occurred while submitting the article');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Upload Article for Sentiment Analysis</h2>
      
      {submitSuccess && (
        <div className={styles.successMessage}>
          Article submitted successfully! It will be processed for sentiment analysis.
        </div>
      )}
      
      {submitError && (
        <div className={styles.errorMessage}>
          {submitError}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="company">Company</label>
          <select 
            id="company"
            value={selectedCompany}
            disabled
            className={styles.select}
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <p className={styles.helpText}>
            Company is pre-selected from the dashboard. To change, use the company selector.
          </p>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Article title"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            className={styles.textarea}
            placeholder="Full article content"
            rows={10}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="source">Source *</label>
          <input
            type="text"
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="e.g., news, blog, financial-report"
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="publicationDate">Publication Date</label>
            <input
              type="date"
              id="publicationDate"
              name="publicationDate"
              value={formData.publicationDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="author">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className={styles.input}
              placeholder="Article author"
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="url">URL</label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://example.com/article"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={styles.input}
            placeholder="earnings, financial-results, tech-sector (comma-separated)"
          />
          <p className={styles.helpText}>
            Enter tags separated by commas
          </p>
        </div>
        
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.loadSampleButton}
            onClick={loadSampleArticle}
          >
            Load Sample Article
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Article'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleUpload;