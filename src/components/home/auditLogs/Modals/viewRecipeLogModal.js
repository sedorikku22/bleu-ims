import React, { useEffect, useState } from 'react';
import './viewRecipeLogModal.css';

const ViewRecipeLogModal = ({ log, onClose }) => {
    const [ingredientDetails, setIngredientDetails] = useState({});
    const [supplyDetails, setSupplyDetails] = useState({});
    const [addOnDetails, setAddOnDetails] = useState({});

    useEffect(() => {
        // Fetch reference data for Ingredients, Supplies, and Add-Ons
        const fetchReferenceData = async () => {
            try {
                // Extract IDs from log data
                const ingredientIDs = (log.Ingredients || []).map(item => item.IngredientID);
                const supplyIDs = (log.SuppliesMaterials || []).map(item => item.SupplyID);
                const addOnIDs = (log.AddOns || []).map(item => item.AddOnID);

                // Fetch data for Ingredients, Supplies, Add-Ons
                const [ingredientResponse, supplyResponse, addOnResponse] = await Promise.all([
                    fetch(`/api/ingredients?ids=${ingredientIDs.join(',')}`),
                    fetch(`/api/supplies?ids=${supplyIDs.join(',')}`),
                    fetch(`/api/addons?ids=${addOnIDs.join(',')}`),
                ]);

                // Parse JSON responses
                const ingredients = await ingredientResponse.json();
                const supplies = await supplyResponse.json();
                const addOns = await addOnResponse.json();

                // Update state with fetched data
                setIngredientDetails(ingredients);
                setSupplyDetails(supplies);
                setAddOnDetails(addOns);
            } catch (error) {
                console.error("Error fetching reference data:", error);
            }
        };

        fetchReferenceData();
    }, [log]);

    const formatData = (items, reference) => {
    if (!items || items.length === 0) return 'N/A';
    return items.map(item => {
        const refKey = item.IngredientID || item.MaterialID || item.AddOnID;
        const refItem = reference[refKey]; // Lookup the reference data by ID
        if (!refItem) {
            console.warn(`Missing reference for ID: ${refKey}`);
            return `(ID: ${refKey}) ${item.Amount || ''} ${item.Measurement || ''}`.trim();
        }
        const refName = refItem.name || '';
        const amount = item.Amount ? `${item.Amount}${item.Measurement || ''}` : '';
        return `${refName} ${amount}`.trim();
    }).join(', ');
};

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
        doc.text('RECIPE LOG REPORT', 105, 15, { align: 'center' });

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
        doc.text('RECIPE INFORMATION', 14, yPos);
        yPos += 2;
        doc.line(14, yPos, 196, yPos);
        yPos += 8;

        const recipeBody = [
            ['Recipe ID', log.RecipeID],
            ['Recipe Name', log.RecipeName],
            ['Category', log.Category],
            ['Product ID', log.ProductID],
            ['Ingredients', log.Ingredients || 'N/A'],
            ['Supplies & Materials', log.SuppliesMaterials || 'N/A'],
            ['Add Ons', log.AddOns || 'N/A']
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Field', 'Value']],
            body: recipeBody,
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

        doc.save(`Recipe_Log_${log.RecipeID}_${Date.now()}.pdf`);
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

    const formatValue = (value, reference) => {
        if (!value || value.length === 0) return 'N/A';
        if (Array.isArray(value)) {
            return value
                .map(item => {
                    const refItem = reference[item.IngredientID || item.SupplyID || item.AddOnID];
                    if (refItem) {
                        return `${refItem.name} ${item.Amount || ''} ${item.Measurement || ''}`.trim();
                    }
                    return JSON.stringify(item);
                })
                .join(', ');
        }
        return String(value);
    };

    const renderChanges = () => {
        const changes = getChanges(log.old_values, log.new_values);

        if (changes.length === 0) {
            return <p className="recipe-modal-no-changes">No changes detected</p>;
        }

        return (
            <div className="recipe-modal-changes-grid">
                {changes.map(([field, oldVal, newVal], index) => (
                    <div key={index} className="recipe-modal-change-item">
                        <div className="recipe-modal-change-field">{field}</div>
                        <div className="recipe-modal-change-values">
                            <div className="recipe-modal-change-value-box recipe-modal-old-value">
                                <span className="recipe-modal-change-label">Old:</span>
                                <span className="recipe-modal-change-text">{oldVal}</span>
                            </div>
                            <div className="recipe-modal-change-arrow">→</div>
                            <div className="recipe-modal-change-value-box recipe-modal-new-value">
                                <span className="recipe-modal-change-label">New:</span>
                                <span className="recipe-modal-change-text">{newVal}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="recipe-modal-overlay" onClick={onClose}>
            <div className="recipe-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="recipe-modal-header">
                    <h2>Recipe Log Details</h2>
                    <button className="recipe-modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="recipe-modal-body">
                    <div className="recipe-modal-section">
                        <h3>Log Information</h3>
                        <div className="recipe-modal-details-grid">
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Block ID:</span>
                                <span className="recipe-modal-value">{log.block_id}</span>
                            </div>
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Timestamp:</span>
                                <span className="recipe-modal-value">{formatTimestamp(log.timestamp)}</span>
                            </div>
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Action:</span>
                                <span className={`recipe-modal-value recipe-modal-action-badge ${log.action.toLowerCase()}`}>
                                    {log.action}
                                </span>
                            </div>
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">User ID:</span>
                                <span className="recipe-modal-value">{log.user_id || 'N/A'}</span>
                            </div>
                            <div className="recipe-log-detail-item">
                                <span className="recipe-log-label">Hash:</span>
                                <a className="recipe-log-value" href="https://sepolia.etherscan.io/address/0xee04ec86745cdad35e286d95cee333f81dae72e4" target="_blank" rel="noopener noreferrer">{log.tx_hash || 'N/A'}</a>
                            </div>
                        </div>
                    </div>

                    <div className="recipe-modal-section">
                        <h3>Recipe Information</h3>
                        <div className="recipe-modal-details-grid">
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Recipe ID:</span>
                                <span className="recipe-modal-value">{log.RecipeID}</span>
                            </div>
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Recipe Name:</span>
                                <span className="recipe-modal-value">{log.RecipeName}</span>
                            </div>
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Category:</span>
                                <span className="recipe-modal-value">{log.Category}</span>
                            </div>
                            <div className="recipe-modal-detail-item">
                                <span className="recipe-modal-label">Product ID:</span>
                                <span className="recipe-modal-value">{log.ProductID}</span>
                            </div>
                            <div className="recipe-modal-detail-item full-width">
                                <span className="recipe-modal-label">Ingredients:</span>
                                <span className="recipe-modal-value">{formatData(log.Ingredients, ingredientDetails)}</span>
                            </div>
                            <div className="recipe-modal-detail-item full-width">
                                <span className="recipe-modal-label">Supplies & Materials:</span>
                                <span className="recipe-modal-value">{formatData(log.SuppliesMaterials, supplyDetails)}</span>
                            </div>
                            <div className="recipe-modal-detail-item full-width">
                                <span className="recipe-modal-label">Add Ons:</span>
                                <span className="recipe-modal-value">{formatData(log.AddOns, addOnDetails)}</span>
                            </div>
                        </div>
                    </div>

                    {log.action === 'UPDATE' && (log.old_values || log.new_values) && (
                        <div className="recipe-modal-section">
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

                <div className="recipe-modal-footer">
                    <button className="recipe-modal-btn-export" onClick={generatePDF}>
                        <svg className="recipe-modal-export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

export default ViewRecipeLogModal;