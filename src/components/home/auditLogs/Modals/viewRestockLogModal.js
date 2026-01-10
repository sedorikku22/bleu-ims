import React from 'react';
import './viewRestockLogModal.css';

const ViewRestockLogModal = ({ log, onClose }) => {
    const formatTimestamp = (timestamp) => {
        const formattedDate = new Date(timestamp).toLocaleString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
        return formattedDate.replace(",", "");
    };

    const generatePDF = async () => {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        document.head.appendChild(script2);

        await new Promise(resolve => {
            script2.onload = resolve;
        });

        const { jsPDF } = window.jspdf;

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
        doc.text('RESTOCK LOG REPORT', 105, 15, { align: 'center' });

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
        doc.text('BASIC INFORMATION', 14, yPos);
        yPos += 2;
        doc.setDrawColor(75, 146, 157);
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        yPos += 8;

        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Value']],
            body: [
                ['Block ID', log.block_id],
                ['Timestamp', formatTimestamp(log.timestamp)],
                ['Action', log.action],
                ['User ID', log.user_id || 'N/A']
            ],
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

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(75, 146, 157);
        doc.text('RESTOCK INFORMATION', 14, yPos);
        yPos += 2;
        doc.line(14, yPos, 196, yPos);
        yPos += 8;

        const restockBody = [
            ['Restock ID', log.RestockID],
            ['Item Type', log.ItemType],
            ['Item ID', log.ItemID],
            ['Batch ID', log.BatchID || 'N/A'],
            ['Quantity', log.Quantity !== null ? parseFloat(log.Quantity).toFixed(2) : 'N/A'],
            ['Unit', log.Unit || 'N/A'],
            ['Batch Date', log.BatchDate || 'N/A'],
            ['Restock Date', log.RestockDate || 'N/A'],
            ['Logged By', log.LoggedBy || 'N/A'],
            ['Notes', log.Notes || 'N/A'],
            ['Status', log.Status || 'N/A']
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Value']],
            body: restockBody,
            theme: 'grid',
            headStyles: { fillColor: [75, 146, 157], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 254, 255], cellWidth: 50 },
                1: { cellWidth: 132 }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 12;

        if (log.old_values || log.new_values) {
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(75, 146, 157);
            doc.text('CHANGE HISTORY', 14, yPos);
            yPos += 2;
            doc.line(14, yPos, 196, yPos);
            yPos += 8;

            const changes = getChanges(log.old_values, log.new_values);
            if (changes.length > 0) {
                doc.autoTable({
                    startY: yPos,
                    head: [['Field', 'Old Value', 'New Value']],
                    body: changes,
                    theme: 'grid',
                    headStyles: { fillColor: [75, 146, 157], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: {
                        0: { fontStyle: 'bold', fillColor: [248, 254, 255], cellWidth: 45 },
                        1: { cellWidth: 65 },
                        2: { cellWidth: 65 }
                    },
                    margin: { left: 14, right: 14 }
                });
                yPos = doc.lastAutoTable.finalY + 12;
            }
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        }

        doc.save(`Restock_Log_${log.RestockID}_${Date.now()}.pdf`);
    };

    const getChanges = (oldValues, newValues) => {
        const changes = [];
        if (!oldValues || !newValues) return changes;

        const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

        allKeys.forEach(key => {
            const oldVal = oldValues[key];
            const newVal = newValues[key];

            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes.push([
                    formatFieldName(key),
                    formatValue(oldVal),
                    formatValue(newVal)
                ]);
            }
        });

        return changes;
    };

    const formatFieldName = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const renderChanges = () => {
        const changes = getChanges(log.old_values, log.new_values);

        if (changes.length === 0) {
            return <p className="restock-log-modal-no-changes">No changes detected</p>;
        }

        return (
            <div className="restock-log-modal-changes-grid">
                {changes.map(([field, oldVal, newVal], index) => (
                    <div key={index} className="restock-log-modal-change-item">
                        <div className="restock-log-modal-change-field">{field}</div>
                        <div className="restock-log-modal-change-values">
                            <div className="restock-log-modal-change-value-box restock-log-modal-old-value">
                                <span className="restock-log-modal-change-label">Old:</span>
                                <span className="restock-log-modal-change-text">{oldVal}</span>
                            </div>
                            <div className="restock-log-modal-change-arrow">→</div>
                            <div className="restock-log-modal-change-value-box restock-log-modal-new-value">
                                <span className="restock-log-modal-change-label">New:</span>
                                <span className="restock-log-modal-change-text">{newVal}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="restock-log-modal-overlay" onClick={onClose}>
            <div className="restock-log-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="restock-log-modal-header">
                    <h2>Restock Log Details</h2>
                    <button className="restock-log-modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="restock-log-modal-body">
                    <div className="restock-log-modal-section">
                        <h3>Log Information</h3>
                        <div className="restock-log-modal-details-grid">
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Block ID:</span>
                                <span className="restock-log-modal-value">{log.block_id}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Timestamp:</span>
                                <span className="restock-log-modal-value">{formatTimestamp(log.timestamp)}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Action:</span>
                                <span className="restock-log-modal-action-badge">
                                    {log.action}
                                </span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">User ID:</span>
                                <span className="restock-log-modal-value">{log.user_id || 'N/A'}</span>
                            </div>
                            <div className="restock-log-detail-item">
                                <span className="restock-log-label">Hash:</span>
                                <a className="restock-log-value" href="https://sepolia.etherscan.io/address/0xee04ec86745cdad35e286d95cee333f81dae72e4" target="_blank" rel="noopener noreferrer">{log.tx_hash || 'N/A'}</a>
                            </div>
                        </div>
                    </div>

                    <div className="restock-log-modal-section">
                        <h3>Restock Information</h3>
                        <div className="restock-log-modal-details-grid">
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Restock ID:</span>
                                <span className="restock-log-modal-value">{log.RestockID}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Item Type:</span>
                                <span className="restock-log-modal-value">{log.ItemType}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Item ID:</span>
                                <span className="restock-log-modal-value">{log.ItemID}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Batch ID:</span>
                                <span className="restock-log-modal-value">{log.BatchID || 'N/A'}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Quantity:</span>
                                <span className="restock-log-modal-value">
                                    {log.Quantity !== null ? parseFloat(log.Quantity).toFixed(2) : 'N/A'}
                                </span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Unit:</span>
                                <span className="restock-log-modal-value">{log.Unit || 'N/A'}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Batch Date:</span>
                                <span className="restock-log-modal-value">{log.BatchDate || 'N/A'}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Restock Date:</span>
                                <span className="restock-log-modal-value">{log.RestockDate || 'N/A'}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Logged By:</span>
                                <span className="restock-log-modal-value">{log.LoggedBy || 'N/A'}</span>
                            </div>
                            <div className="restock-log-modal-detail-item">
                                <span className="restock-log-modal-label">Status:</span>
                                <span className="restock-log-modal-value">{log.Status || 'N/A'}</span>
                            </div>
                            <div className="restock-log-modal-detail-item restock-log-modal-full-width">
                                <span className="restock-log-modal-label">Notes:</span>
                                <span className="restock-log-modal-value">{log.Notes || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {(log.old_values || log.new_values) && (
                        <div className="restock-log-modal-section">
                            <h3>Change History</h3>
                            {renderChanges()}
                        </div>
                    )}

                    <div className="addon-verification-badge">
                        <svg className="addon-verification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                        Verified
                    </div>
                </div>

                <div className="restock-log-modal-footer">
                    <button className="restock-log-modal-btn-export" onClick={generatePDF}>
                        <svg className="restock-log-modal-export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        Export PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewRestockLogModal;
