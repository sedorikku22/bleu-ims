import React, { useState } from 'react';
import './lowStockModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const LowStockModal = ({ isOpen, onClose, lowStockItems }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const sections = ['Ingredients', 'Materials', 'Merchandise'];

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical': return '#ff6b6b';
      case 'low': return '#ffa726';
      case 'good': return '#66bb6a';
      default: return '#78909c';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'low': return 'Low Stock';
      default: return status;
    }
  };

  const getCurrentData = () => {
    const section = sections[currentSection];
    const typeMap = {
      'Ingredients': 'Ingredient',
      'Materials': 'Material',
      'Merchandise': 'Merchandise'
    };
    const targetType = typeMap[section];
    return lowStockItems.filter(item => item.type === targetType);
  };

  const handleNavigation = (direction) => {
    if (direction === 'next' && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (direction === 'prev' && currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="low-stock-modal-overlay" onClick={onClose}>
      <div className="low-stock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="low-stock-modal-header">
          <h2>Low Stock Items</h2>
          <button className="low-stock-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="low-stock-modal-content">
          <div className="low-stock-section-navigation">
            <button
              className="low-stock-nav-btn"
              onClick={() => handleNavigation('prev')}
              disabled={currentSection === 0}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span className="low-stock-section-title">
              {sections[currentSection]}
            </span>
            <button
              className="low-stock-nav-btn"
              onClick={() => handleNavigation('next')}
              disabled={currentSection === sections.length - 1}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>Items</th>
                <th>In Stock</th>
                <th>Last Restocked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentData().map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.inStock}</td>
                  <td>{item.lastRestocked}</td>
                  <td>
                    <span
                      className="low-stock-status-badge"
                      style={{
                        backgroundColor: getStatusColor(item.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    >
                      {getStatusDisplay(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LowStockModal;
