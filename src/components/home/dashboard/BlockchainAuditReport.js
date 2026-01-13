import React, { useState, useEffect, useCallback } from "react";
import "./blockchainAuditReport.css";

const API_BASE_URL = "https://ims-blockchain.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

const BlockchainAuditReport = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditLogs, setAuditLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const auditSections = [
    'All Changes',
    'Add-Ons',
    'Ingredients',
    'Materials',
    'Merchandise',
    'Products',
    'Product Types',
    'Recipes',
    'Restock',
    'Waste'
  ];

  const BLOCKCHAIN_ENDPOINTS = {
    'addon': `${API_BASE_URL}/blockchain/addon`,
    'ingredient': `${API_BASE_URL}/blockchain/ingredient`,
    'material': `${API_BASE_URL}/blockchain/material`,
    'merchandise': `${API_BASE_URL}/blockchain/merchandise`,
    'product': `${API_BASE_URL}/blockchain/product`,
    'producttype': `${API_BASE_URL}/blockchain/producttype`,
    'recipe': `${API_BASE_URL}/blockchain/recipe`,
    'restock': `${API_BASE_URL}/blockchain/restock`,
    'waste': `${API_BASE_URL}/blockchain/waste`
  };

  const fetchBlockchainLogs = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      const responses = await Promise.all(
        Object.entries(BLOCKCHAIN_ENDPOINTS).map(async ([key, url]) => {
          try {
            const res = await fetch(url, { headers });
            if (res.ok) {
              const data = await res.json();
              return [key, Array.isArray(data) ? data : []];
            }
            return [key, []];
          } catch (error) {
            console.error(`Error fetching ${key}:`, error);
            return [key, []];
          }
        })
      );

      const logsData = Object.fromEntries(responses);
      setAuditLogs(logsData);
    } catch (error) {
      console.error('Error fetching blockchain logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockchainLogs();
  }, [fetchBlockchainLogs]);

  const handleNavigation = (direction) => {
    if (direction === 'next' && currentSection < auditSections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (direction === 'prev' && currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const getCurrentAuditData = () => {
    let data = [];
    const section = auditSections[currentSection];

    if (section === 'All Changes') {
      Object.entries(auditLogs).forEach(([type, logs]) => {
        if (Array.isArray(logs)) {
          data = [...data, ...logs.map(log => ({ ...log, logType: type }))];
        }
      });
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      const typeMap = {
        'Add-Ons': 'addon',
        'Ingredients': 'ingredient',
        'Materials': 'material',
        'Merchandise': 'merchandise',
        'Products': 'product',
        'Product Types': 'producttype',
        'Recipes': 'recipe',
        'Restock': 'restock',
        'Waste': 'waste'
      };
      const logType = typeMap[section];
      const logs = auditLogs[logType] || [];
      data = Array.isArray(logs) ? logs.map(log => ({ ...log, logType })) : [];
    }

    if (startDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        const filterDate = new Date(startDate);
        itemDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);
        return itemDate >= filterDate;
      });
    }
    if (endDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        const filterDate = new Date(endDate);
        itemDate.setHours(23, 59, 59, 999);
        filterDate.setHours(23, 59, 59, 999);
        return itemDate <= filterDate;
      });
    }
    if (filterAction) {
      data = data.filter(item => item.action?.toUpperCase() === filterAction.toUpperCase());
    }

    return data;
  };

  const exportToPDF = async () => {
    if (!window.jspdf) {
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script1);

      await new Promise((resolve, reject) => {
        script1.onload = resolve;
        script1.onerror = reject;
      });
    }

    if (!window.jspdf.jsPDF.prototype.autoTable) {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      document.head.appendChild(script2);

      await new Promise((resolve, reject) => {
        script2.onload = resolve;
        script2.onerror = reject;
      });
    }

    const { jsPDF } = window.jspdf;
    const data = getCurrentAuditData();
    const section = auditSections[currentSection];
    
    const doc = new jsPDF({
      encryption: {
        userPassword: "BLEU2022CM",
        ownerPassword: "BLEU2022CM",
        userPermissions: ["print", "print-highres"]
      }
    });

    doc.setFillColor(75, 146, 157);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(`${section.toUpperCase()} LOG REPORT`, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 29, { align: 'center' });

    let yPos = 45;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('CLASSIFICATION: INTERNAL USE ONLY', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(75, 146, 157);
    doc.text('AUDIT SUMMARY', 14, yPos);
    yPos += 2;
    doc.setDrawColor(75, 146, 157);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 196, yPos);
    yPos += 8;

    const filterInfo = [];
    if (startDate) filterInfo.push(['Start Date', startDate]);
    if (endDate) filterInfo.push(['End Date', endDate]);
    if (filterAction) filterInfo.push(['Action Filter', filterAction]);
    filterInfo.push(['Total Records', data.length.toString()]);

    doc.autoTable({
      startY: yPos,
      head: [['Filter', 'Value']],
      body: filterInfo,
      theme: 'grid',
      headStyles: { fillColor: [75, 146, 157], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 254, 255] },
        1: { cellWidth: 120 }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 12;

    if (data.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(75, 146, 157);
      doc.text('AUDIT LOGS', 14, yPos);
      yPos += 2;
      doc.line(14, yPos, 196, yPos);
      yPos += 8;

            const tableData = data.map(log => {
        const row = [
          formatTimestamp(log.timestamp),
          log.action || 'N/A',
          log.user_id || 'N/A',
          getLogDetails(log),
          log.tx_hash ? `${log.tx_hash.substring(0, 12)}...` : 'N/A'
        ];
        if (section === 'All Changes') {
          row.unshift(formatLogType(log.logType));
        }
        return row;
      });

      const tableHeaders = section === 'All Changes' 
        ? ['Type', 'Timestamp', 'Action', 'User ID', 'Details', 'Txn Hash']
        : ['Timestamp', 'Action', 'User ID', 'Details', 'Txn Hash'];

      doc.autoTable({
        startY: yPos,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [75, 146, 157], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.text(`Page ${currentPage} of ${pageCount}`, 105, 285, { align: 'center' });
        }
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`${section.replace(/\s+/g, '_')}_Audit_Report_${Date.now()}.pdf`);
  };

  const getActionClass = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'action-create';
      case 'UPDATE': return 'action-update';
      case 'DELETE': return 'action-delete';
      case 'WASTE': return 'action-waste';
      default: return 'action-other';
    }
  };

  const getTxStatusBadge = (status) => {
    if (status === 1) {
      return <span className="tx-status success">✓ Verified</span>;
    } else if (status === 0) {
      return <span className="tx-status failed">✗ Failed</span>;
    }
    return <span className="tx-status pending">⧗ Pending</span>;
  };

  const formatLogType = (type) => {
    const typeMap = {
      'addon': 'Add-On',
      'ingredient': 'Ingredient',
      'material': 'Material',
      'merchandise': 'Merchandise',
      'product': 'Product',
      'producttype': 'Product Type',
      'recipe': 'Recipe',
      'restock': 'Restock',
      'waste': 'Waste'
    };
    return typeMap[type] || type;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(",", "");
  };

  const renderTableHeaders = () => {
    const section = auditSections[currentSection];
    
    if (section === 'All Changes') {
      return (
        <tr>
          <th>Type</th>
          <th>Timestamp</th>
          <th>Action</th>
          <th>User ID</th>
          <th>Details</th>
          <th>Txn Hash</th>
          <th>Status</th>
        </tr>
      );
    }

    return (
      <tr>
        <th>Timestamp</th>
        <th>Action</th>
        <th>User ID</th>
        <th>Details</th>
        <th>Txn Hash</th>
        <th>Status</th>
      </tr>
    );
  };

  const renderTableRows = () => {
    const data = getCurrentAuditData();
    const section = auditSections[currentSection];

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={section === 'All Changes' ? 7 : 6} style={{ textAlign: 'center', padding: '40px' }}>
            {loading ? 'Loading blockchain logs...' : 'No audit logs found'}
          </td>
        </tr>
      );
    }

    return data.map((log, index) => {
      const actionClass = getActionClass(log.action);
      const details = getLogDetails(log);

      if (section === 'All Changes') {
        return (
          <tr key={`${log.logType}-${log.tx_id || index}-${index}`}>
            <td><span className="log-type-badge">{formatLogType(log.logType)}</span></td>
            <td>{formatTimestamp(log.timestamp)}</td>
            <td><span className={actionClass}>{log.action}</span></td>
            <td>{log.user_id || 'N/A'}</td>
            <td>{details}</td>
            <td className="hash-cell" title={log.tx_hash}>
              {log.tx_hash ? `${log.tx_hash.substring(0, 8)}...` : 'N/A'}
            </td>
            <td>{getTxStatusBadge(log.tx_status)}</td>
          </tr>
        );
      }

      return (
        <tr key={`${log.tx_id || index}-${index}`}>
          <td>{formatTimestamp(log.timestamp)}</td>
          <td><span className={actionClass}>{log.action}</span></td>
          <td>{log.user_id || 'N/A'}</td>
          <td>{details}</td>
          <td className="hash-cell" title={log.tx_hash}>
            {log.tx_hash ? `${log.tx_hash.substring(0, 8)}...` : 'N/A'}
          </td>
          <td>{getTxStatusBadge(log.tx_status)}</td>
        </tr>
      );
    });
  };

  const getLogDetails = (log) => {
    const { logType } = log;
    
    switch (logType) {
      case 'addon':
        return `${log.addOnName || log.AddOnName || 'N/A'} - ${log.ingredientName || log.IngredientName || 'N/A'}`;
      case 'ingredient':
        return `${log.IngredientName || 'N/A'} - ${log.Amount || 'N/A'} ${log.Measurement || ''}`;
      case 'material':
        return `${log.MaterialName || 'N/A'} - ${log.MaterialQuantity || 'N/A'} ${log.MaterialMeasurement || ''}`;
      case 'merchandise':
        return `${log.MerchandiseName || 'N/A'} - Qty: ${log.MerchandiseQuantity || 'N/A'}`;
      case 'product':
        return `${log.ProductName || 'N/A'} - ₱${log.ProductPrice || 'N/A'}`;
      case 'producttype':
        return `${log.productTypeName || 'N/A'}`;
      case 'recipe':
        return `${log.RecipeName || 'N/A'} (Product ID: ${log.ProductID || 'N/A'})`;
      case 'restock':
        return `${log.ItemType || 'N/A'} - ${log.Quantity || 'N/A'} ${log.Unit || ''}`;
      case 'waste':
        return `${log.ItemType || 'N/A'} - ${log.Amount || 'N/A'} ${log.Unit || ''} (${log.WasteReason || 'N/A'})`;
      default:
        return 'N/A';
    }
  };

  const getTotalLogs = () => {
    return Object.values(auditLogs).reduce((total, logs) => {
      return total + (Array.isArray(logs) ? logs.length : 0);
    }, 0);
  };

  const getCurrentSectionCount = () => {
    return getCurrentAuditData().length;
  };

  return (
    <div className="blockchain-audit-report">
      <div className="audit-section">
        <div className="section-header">
          <div className="section-title">
            <svg className="title-icon" viewBox="0 0 256 256" fill="currentColor">
              <path d="M213.333,0H42.667C19.146,0,0,19.135,0,42.667v170.667C0,236.865,19.146,256,42.667,256h170.667C236.854,256,256,236.865,256,213.333V42.667C256,19.135,236.854,0,213.333,0z M234.667,213.333c0,11.76-9.563,21.333-21.333,21.333H42.667c-11.771,0-21.333-9.573-21.333-21.333V42.667c0-11.76,9.563-21.333,21.333-21.333h170.667c11.771,0,21.333,9.573,21.333,21.333V213.333z"/>
              <path d="M192,64H64c-5.896,0-10.667,4.771-10.667,10.667c0,5.896,4.771,10.667,10.667,10.667h128c5.896,0,10.667-4.771,10.667-10.667C202.667,68.771,197.896,64,192,64z"/>
              <path d="M192,106.667H64c-5.896,0-10.667,4.771-10.667,10.667C53.333,123.229,58.104,128,64,128h128c5.896,0,10.667-4.771,10.667-10.667C202.667,111.438,197.896,106.667,192,106.667z"/>
              <path d="M192,149.333H64c-5.896,0-10.667,4.771-10.667,10.667c0,5.896,4.771,10.667,10.667,10.667h128c5.896,0,10.667-4.771,10.667-10.667C202.667,154.104,197.896,149.333,192,149.333z"/>
            </svg>
            <span>Audit Report</span>
          </div>
          <div className="audit-controls">
            <div className="date-filters">
              <label>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <label>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="WASTE">WASTE</option>
              </select>
            </div>
            <button className="action-btn secondary" onClick={fetchBlockchainLogs}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Refresh
            </button>
            <button className="action-btn primary" onClick={exportToPDF}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card stat-total">
            <div className="stat-label">Total Logs (All Sections)</div>
            <div className="stat-value">{getTotalLogs()}</div>
          </div>
          <div className="stat-card stat-current">
            <div className="stat-label">Current Section: {auditSections[currentSection]}</div>
            <div className="stat-value">{getCurrentSectionCount()}</div>
          </div>
          <div className="stat-card stat-filtered">
            <div className="stat-label">Filtered Results</div>
            <div className="stat-value">{getCurrentAuditData().length}</div>
          </div>
        </div>

        <div className="audit-navigation">
          <button
            className="nav-btn"
            onClick={() => handleNavigation('prev')}
            disabled={currentSection === 0}
          >
            ‹
          </button>
          <span className="audit-section-title">
            {auditSections[currentSection]}
          </span>
          <button
            className="nav-btn"
            onClick={() => handleNavigation('next')}
            disabled={currentSection === auditSections.length - 1}
          >
            ›
          </button>
        </div>

        <div className="table-container">
          <table className="audit-table">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody>
              {renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAuditReport;