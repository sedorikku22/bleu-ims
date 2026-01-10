import React from "react";
import "./viewMerchandiseLogsModal.css";
import { FaTimes } from "react-icons/fa";

const ViewMerchandiseLogsModal = ({ merchandise, onClose }) => {
    if (!merchandise) return null;

    return (
        <div className="view-merchandise-logs-modal-overlay">
            <div className="view-merchandise-logs-modal">
                <button className="view-merchandise-logs-close-button" onClick={onClose}>
                    <FaTimes />
                </button>

                <h2 className="view-merchandise-logs-product-name">{merchandise.Merchandise}</h2>
                <hr className="view-merchandise-logs-divider" />

                <div className="view-merchandise-logs-modal-content">
                    <div className="view-merchandise-logs-restock-date-label">Restock Date</div>
                    <div className="view-merchandise-logs-restock-date">{merchandise.RestockDate}</div>

                    <div className="view-merchandise-logs-quantity-label">Quantity</div>
                    <div className="view-merchandise-logs-quantity">
                        {merchandise.Quantity} {merchandise.Unit}
                    </div>

                    <div className="view-merchandise-logs-batch-date-label">Batch Date</div>
                    <div className="view-merchandise-logs-batch-date">{merchandise.BatchDate}</div>

                    <div className="view-merchandise-logs-status-label">Status</div>
                    <div className="view-merchandise-logs-status">{merchandise.Status}</div>

                    <div className="view-merchandise-logs-logged-by-label">Logged By</div>
                    <div className="view-merchandise-logs-logged-by">{merchandise.LoggedBy}</div>

                    {merchandise.Notes && (
                        <>
                            <div className="view-merchandise-logs-notes-label">Notes</div>
                            <div className="view-merchandise-logs-notes">{merchandise.Notes}</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewMerchandiseLogsModal;