import React from 'react';
import { ENVIRONMENT } from '../config';
import styles from '../styles/Header.module.css';

/**
 * Header component for the application
 */
const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1 className={styles.title}>Hiive AI Market Sentiment Analyzer</h1>
          {ENVIRONMENT !== 'production' && (
            <div className={styles.environmentBadge}>
              {ENVIRONMENT}
            </div>
          )}
        </div>
        <div className={styles.subtitle}>
          Leveraging AI to analyze market sentiment for pre-IPO companies
        </div>
      </div>
    </header>
  );
};

export default Header;