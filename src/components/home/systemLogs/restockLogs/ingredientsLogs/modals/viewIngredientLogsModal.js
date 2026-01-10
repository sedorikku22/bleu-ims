import React from "react";
import "./viewIngredientLogsModal.css";
import { FaTimes } from "react-icons/fa";

const ViewIngredientLogsModal = ({ ingredient, onClose }) => {
    if (!ingredient) return null;

    return (
        <div className="view-ingredient-logs-modal-overlay">
            <div className="view-ingredient-logs-modal">
                <button className="view-ingredient-logs-close-button" onClick={onClose}>
                    <FaTimes />
                </button>

                <h2 className="view-ingredient-logs-product-name">{ingredient.Ingredient}</h2>
                <hr className="view-ingredient-logs-divider" />

                <div className="view-ingredient-logs-modal-content">
                    <div className="view-ingredient-logs-restock-date-label">Restock Date</div>
                    <div className="view-ingredient-logs-restock-date">{ingredient.RestockDate}</div>

                    <div className="view-ingredient-logs-amount-label">Amount</div>
                    <div className="view-ingredient-logs-amount">
                        {ingredient.Quantity} {ingredient.Unit}
                    </div>

                    <div className="view-ingredient-logs-batch-date-label">Batch Date</div>
                    <div className="view-ingredient-logs-batch-date">{ingredient.BatchDate}</div>

                    <div className="view-ingredient-logs-expiration-label">Expiration Date</div>
                    <div className="view-ingredient-logs-expiration">{ingredient.ExpirationDate}</div>

                    <div className="view-ingredient-logs-status-label">Status</div>
                    <div className="view-ingredient-logs-status">{ingredient.Status}</div>

                    <div className="view-ingredient-logs-logged-by-label">Logged By</div>
                    <div className="view-ingredient-logs-logged-by">{ingredient.LoggedBy}</div>
                </div>
            </div>
        </div>
    );
};

export default ViewIngredientLogsModal;