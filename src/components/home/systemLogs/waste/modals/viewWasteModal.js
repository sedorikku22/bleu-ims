import React from "react";
import "./viewWasteModal.css";
import { FaTimes, FaEdit, FaTrash } from "react-icons/fa";

const ViewWasteModal = ({ waste, onClose }) => {
    if (!waste) return null;

    return (
        <div className="view-waste-modal-overlay">
            <div className="view-waste-modal">
                <button className="view-waste-close-button" onClick={onClose}>
                    <FaTimes />
                </button>

                <h2 className="view-waste-item-name">{waste.ItemName}</h2>
                <hr className="view-waste-divider" />

                <div className="view-waste-modal-content">
                    <div className="view-waste-item-type-label">Item Type</div>
                    <div className="view-waste-item-type">{waste.ItemType}</div>

                    <div className="view-waste-amount-label">Amount</div>
                    <div className="view-waste-amount">
                        {waste.Amount} {waste.Unit}
                    </div>

                    <div className="view-waste-batch-date-label">Batch Date</div>
                    <div className="view-waste-batch-date">{waste.BatchDate}</div>

                    <div className="view-waste-waste-date-label">Waste Date</div>
                    <div className="view-waste-waste-date">{waste.Date}</div>

                    <div className="view-waste-reason-label">Reason</div>
                    <div className="view-waste-reason">{waste.Reason}</div>

                    <div className="view-waste-logged-by-label">Logged By</div>
                    <div className="view-waste-logged-by">{waste.LoggedBy}</div>

                </div>


            </div>
        </div>
    );
};

export default ViewWasteModal;