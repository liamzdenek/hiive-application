import React from 'react';
import { APP_VERSION } from '../config';
import styles from '../styles/Footer.module.css';

/**
 * Footer component for the application
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.copyright}>
          &copy; {currentYear} Hiive AI Market Sentiment Analyzer
        </div>
        <div className={styles.version}>
          Version {APP_VERSION}
        </div>
        <div className={styles.disclaimer}>
          This is a demo application. Data shown may not reflect actual market sentiment.
        </div>
      </div>
    </footer>
  );
};

export default Footer;