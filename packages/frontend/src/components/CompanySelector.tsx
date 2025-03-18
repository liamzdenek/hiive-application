import React from 'react';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/CompanySelector.module.css';

/**
 * Component for selecting a company to view sentiment data for
 */
const CompanySelector: React.FC = () => {
  const { companies, selectedCompany, setSelectedCompany } = useAppContext();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
  };

  return (
    <div className={styles.container}>
      <label htmlFor="company-select" className={styles.label}>
        Select Company:
      </label>
      <select
        id="company-select"
        className={styles.select}
        value={selectedCompany}
        onChange={handleChange}
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CompanySelector;