import React from 'react';
import './viewAddOnLogModal.css';

const ViewAddOnLogModal = ({ log, onClose }) => {
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
        doc.text('ADD ON LOG REPORT', 105, 15, { align: 'center' });

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
        doc.text('ADD ON INFORMATION', 14, yPos);
        yPos += 2;
        doc.line(14, yPos, 196, yPos);
        yPos += 8;

        const addOnBody = [
            ['AddOn ID', log.addOnID],
            ['AddOn Name', log.addOnName],
            ['Ingredient ID', log.ingredientID],
            ['Ingredient Name', log.ingredientName],
            ['Price', `$${log.price}`],
            ['Amount', log.amount],
            ['Measurement', log.measurement]
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Value']],
            body: addOnBody,
            theme: 'grid',
            headStyles: { fillColor: [75, 146, 157], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 254, 255], cellWidth: 70 },
                1: { cellWidth: 112 }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 12;

        if (log.action === 'UPDATE' && (log.old_values || log.new_values)) {
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
            }
        }

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        }

        doc.save(`AddOn_Log_${log.addOnName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
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
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value === 1 || value === 0) {
            const strKey = Object.keys(log.old_values || log.new_values || {}).find(k =>
                (log.old_values?.[k] === value || log.new_values?.[k] === value) && k.includes('Required')
            );
            if (strKey) return value === 1 ? 'Yes' : 'No';
        }
        return String(value);
    };

    const renderChanges = () => {
        const changes = getChanges(log.old_values, log.new_values);

        if (changes.length === 0) {
            return <p className="addon-no-changes">No changes detected</p>;
        }

        return (
            <div className="addon-changes-grid">
                {changes.map(([field, oldVal, newVal], index) => (
                    <div key={index} className="addon-change-item">
                        <div className="addon-change-field">{field}</div>
                        <div className="addon-change-values">
                            <div className="addon-change-value-box addon-old-value">
                                <span className="addon-change-label">Old:</span>
                                <span className="addon-change-text">{oldVal}</span>
                            </div>
                            <div className="addon-change-arrow">→</div>
                            <div className="addon-change-value-box addon-new-value">
                                <span className="addon-change-label">New:</span>
                                <span className="addon-change-text">{newVal}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="addon-modal-overlay" onClick={onClose}>
            <div className="addon-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="addon-modal-header">
                    <h2>Add On Log Details</h2>
                    <button className="addon-modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="addon-modal-body">
                    <div className="addon-log-section">
                        <h3>Log Information</h3>
                        <div className="addon-log-details-grid">
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Block ID:</span>
                                <span className="addon-log-value">{log.block_id}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Timestamp:</span>
                                <span className="addon-log-value">{formatTimestamp(log.timestamp)}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Action:</span>
                                <span className={`c ${log.action.toLowerCase()}`}>
                                    {log.action}
                                </span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">User ID:</span>
                                <span className="addon-log-value">{log.user_id || 'N/A'}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Hash:</span>
                                <a className="addon-log-value" href="https://sepolia.etherscan.io/address/0xee04ec86745cdad35e286d95cee333f81dae72e4" target="_blank" rel="noopener noreferrer">{log.tx_hash || 'N/A'}</a>
                            </div>
                        </div>
                    </div>

                    <div className="addon-log-section">
                        <h3>Add On Information</h3>
                        <div className="addon-log-details-grid">
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">AddOn ID:</span>
                                <span className="addon-log-value">{log.addOnID}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">AddOn Name:</span>
                                <span className="addon-log-value">{log.addOnName}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Ingredient ID:</span>
                                <span className="addon-log-value">{log.ingredientID}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Ingredient Name:</span>
                                <span className="addon-log-value">{log.ingredientName}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Price:</span>
                                <span className="addon-log-value">${log.price}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Amount:</span>
                                <span className="addon-log-value">{log.amount}</span>
                            </div>
                            <div className="addon-log-detail-item">
                                <span className="addon-log-label">Measurement:</span>
                                <span className="addon-log-value">{log.measurement}</span>
                            </div>
                        </div>
                    </div>

                    {log.action === 'UPDATE' && (log.old_values || log.new_values) && (
                        <div className="addon-log-section">
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

                <div className="addon-modal-footer">
                    <button className="addon-modal-btn-export" onClick={generatePDF}>
                        <svg className="addon-export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

export default ViewAddOnLogModal;
