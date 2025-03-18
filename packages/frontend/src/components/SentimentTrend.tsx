import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { companyService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/SentimentTrend.module.css';

interface SentimentHistoryData {
  date: string;
  sentiment: number;
  volume: number;
}

interface SentimentHistoryResponse {
  companyId: string;
  period: string;
  data: SentimentHistoryData[];
}

/**
 * Component for displaying sentiment trend over time
 */
const SentimentTrend: React.FC = () => {
  const { selectedCompany } = useAppContext();
  const [period, setPeriod] = useState<string>('daily');
  const [historyData, setHistoryData] = useState<SentimentHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sentiment history when company or period changes
  useEffect(() => {
    const fetchSentimentHistory = async () => {
      if (!selectedCompany) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await companyService.getCompanySentimentHistory(
          selectedCompany,
          period
        );
        
        if (response.status === 'success' && response.data) {
          const historyResponse = response.data as SentimentHistoryResponse;
          setHistoryData(historyResponse.data);
        } else {
          setError(response.message || 'Failed to fetch sentiment history');
        }
      } catch (err) {
        setError('An error occurred while fetching sentiment history');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSentimentHistory();
  }, [selectedCompany, period]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{label}</p>
          <p className={styles.tooltipSentiment}>
            Sentiment: {(payload[0].value * 100).toFixed(0)}
          </p>
          <p className={styles.tooltipVolume}>
            Volume: {payload[1].value}
          </p>
        </div>
      );
    }
    
    return null;
  };

  // Helper function to determine sentiment color
  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return '#34c759';
    if (score >= 0.4) return '#ffcc00';
    return '#ff3b30';
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading sentiment history...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!historyData || historyData.length === 0) {
    return <div className={styles.noData}>No sentiment history available</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sentiment Trend</h2>
        <div className={styles.periodSelector}>
          <button
            className={`${styles.periodButton} ${period === 'daily' ? styles.active : ''}`}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </button>
          <button
            className={`${styles.periodButton} ${period === 'weekly' ? styles.active : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </button>
          <button
            className={`${styles.periodButton} ${period === 'monthly' ? styles.active : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={historyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="sentiment"
              domain={[0, 1]} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}`}
              tickMargin={10}
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
              domain={[0, 'dataMax + 2']}
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="sentiment"
              type="monotone"
              dataKey="sentiment"
              name="Sentiment Score"
              stroke="#0066cc"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="volume"
              name="Article Volume"
              stroke="#999"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#0066cc' }}></div>
          <div className={styles.legendLabel}>Sentiment Score (0-100)</div>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#999' }}></div>
          <div className={styles.legendLabel}>Article Volume</div>
        </div>
      </div>
    </div>
  );
};

export default SentimentTrend;