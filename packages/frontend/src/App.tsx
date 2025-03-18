import React from 'react';
import { AppProvider } from './context/AppContext';
import { Header, Dashboard, Footer } from './components';
import styles from './styles/App.module.css';

function App() {
  return (
    <AppProvider>
      <div className={styles.app}>
        <Header />
        <main className={styles.main}>
          <Dashboard />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}

export default App;