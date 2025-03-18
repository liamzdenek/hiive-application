import React from 'react';
import styles from './styles/App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1>Hiive AI Market Sentiment Analyzer</h1>
      </header>
      <main className={styles.main}>
        <p>Welcome to the Hiive AI Market Sentiment Analyzer</p>
      </main>
    </div>
  );
}

export default App;