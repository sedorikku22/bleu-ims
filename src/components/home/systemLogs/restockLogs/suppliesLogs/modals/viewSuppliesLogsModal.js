import React from "react";
import "./viewSuppliesLogsModal.css";
import { FaTimes } from "react-icons/fa";

const ViewSuppliesLogsModal = ({ supplies, onClose }) => {
    if (!supplies) return null;

    return (
        <div className="view-supplies-logs-modal-overlay">
            <div className="view-supplies-logs-modal">
                <button className="view-supplies-logs-close-button" onClick={onClose}>
                    <FaTimes />
                </button>

                <h2 className="view-supplies-logs-material-name">{supplies.Material}</h2>
                <hr className="view-supplies-logs-divider" />

                <div className="view-supplies-logs-modal-content">
                    <div className="view-supplies-logs-restock-date-label">Restock Date</div>
                    <div className="view-supplies-logs-restock-date">{supplies.RestockDate}</div>

                    <div className="view-supplies-logs-quantity-label">Quantity</div>
                    <div className="view-supplies-logs-quantity">
                        {supplies.Quantity} {supplies.Unit}
                    </div>

                    <div className="view-supplies-logs-batch-date-label">Batch Date</div>
                    <div className="view-supplies-logs-batch-date">{supplies.BatchDate}</div>

                    <div className="view-supplies-logs-status-label">Status</div>
                    <div className="view-supplies-logs-status">{supplies.Status}</div>

                    <div className="view-supplies-logs-logged-by-label">Logged By</div>
                    <div className="view-supplies-logs-logged-by">{supplies.LoggedBy}</div>
                </div>
            </div>
        </div>
    );
};

export default ViewSuppliesLogsModal;