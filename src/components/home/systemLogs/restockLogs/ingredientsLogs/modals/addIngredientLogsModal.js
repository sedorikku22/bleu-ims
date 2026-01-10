import React, { useState, useEffect } from "react";
import "./addIngredientLogsModal.css";
import { toast } from 'react-toastify';
import ConfirmationIngredientLogsModal from "./confirmationIngredientLogsModal";

const API_BASE_URL = "http://127.0.0.1:8003";

function AddIngredientLogsModal({ onClose, onSubmit, selectedIngredient }) {
    const emptyFormData = {
        quantity: "",
        unit: "",
        batchDate: "",
        restockDate: "",
        expirationDate: "",
        loggedBy: "",
        notes: ""
    };

    const [formData, setFormData] = useState(emptyFormData);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [allowedUnits, setAllowedUnits] = useState([]);

    useEffect(() => {
        if (selectedIngredient) {
            // use main table's allowed unit
            const unit =
                selectedIngredient.Measurement ||
                selectedIngredient.measurement ||
                selectedIngredient.Unit ||
                selectedIngredient.unit;
            if (unit) {
                setAllowedUnits([unit]);
                setFormData(prev => ({ ...prev, unit: unit }));
            } else {
                // fallback to default units
                setAllowedUnits(["ml", "l", "kg", "g"]);
                setFormData(prev => ({ ...prev, unit: "" }));
            }
        }
    }, [selectedIngredient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFocus = (field) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    // only allow selecting from allowed units
    const validate = () => {
        const newErrors = {};
        if (!formData.quantity) newErrors.quantity = "Quantity is required";
        if (!formData.unit) newErrors.unit = "Unit is required";
        if (
            formData.unit &&
            allowedUnits.length > 0 &&
            !allowedUnits.includes(formData.unit)
        ) newErrors.unit = `Unit must be '${allowedUnits[0]}' for this ingredient`;
        if (!formData.batchDate) newErrors.batchDate = "Batch Date is required";
        if (!formData.expirationDate) newErrors.expirationDate = "Expiration Date is required";
        if (!formData.loggedBy) newErrors.loggedBy = "Logged By is required";
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const payload = {
            ingredient_id: selectedIngredient?.IngredientID,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            batch_date: formData.batchDate,
            expiration_date: formData.expirationDate,
            logged_by: formData.loggedBy,
            notes: formData.notes
        };

        try {
            const response = await fetch(`${API_BASE_URL}/ingredient-batches/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Failed to restock item.");
            }

            toast.success("Item restocked successfully!");
            setShowConfirmation(false);
            setFormData(emptyFormData);
            onSubmit(); // refresh
        } catch (error) {
            console.error("POST error:", error);
            toast.error("Failed to restock item.");
        }
        setIsSubmitting(false);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
        setIsSubmitting(false);
    };

    return (
        <>
            {!showConfirmation && (
                <div className="addIngredientLogs-modal-overlay">
                    <div className="addIngredientLogs-modal-content">
                        <div className="addIngredientLogs-modal-header">
                            <h3>Restock Item</h3>
                            <span className="addIngredientLogs-modal-close-button" onClick={() => { onClose(); setFormData(emptyFormData); }}>×</span>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Amount: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("quantity")}
                                        className={errors.quantity ? "error" : ""}
                                    />
                                    {errors.quantity && <p className="addIngredientLogs-error-message">{errors.quantity}</p>}
                                </div>
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Unit: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("unit")}
                                        className={errors.unit ? "error" : ""}
                                    >
                                        <option value="">Select Unit</option>
                                        {allowedUnits.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                    {errors.unit && <p className="addIngredientLogs-error-message">{errors.unit}</p>}
                                </div>
                            </div>

                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Batch Date: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="batchDate"
                                        value={formData.batchDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("batchDate")}
                                        className={errors.batchDate ? "error" : ""}
                                    />
                                    {errors.batchDate && <p className="addIngredientLogs-error-message">{errors.batchDate}</p>}
                                </div>
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Expiration Date: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="expirationDate"
                                        value={formData.expirationDate}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("expirationDate")}
                                        className={errors.expirationDate ? "error" : ""}
                                    />
                                    {errors.expirationDate && <p className="addIngredientLogs-error-message">{errors.expirationDate}</p>}
                                </div>
                            </div>

                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group">
                                    <label>
                                        Logged By: <span className="addIngredientLogs-required-asterisk">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="loggedBy"
                                        value={formData.loggedBy}
                                        onChange={handleChange}
                                        onFocus={() => handleFocus("loggedBy")}
                                        className={errors.loggedBy ? "error" : ""}
                                    />
                                    {errors.loggedBy && <p className="addIngredientLogs-error-message">{errors.loggedBy}</p>}
                                </div>
                            </div>

                            <div className="addIngredientLogs-form-row">
                                <div className="addIngredientLogs-form-group" style={{ flex: 1 }}>
                                    <label>Notes:</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="addIngredientLogs-modal-buttons">
                                <button type="submit">Restock Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationIngredientLogsModal
                visible={showConfirmation}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                formData={formData}
            />
        </>
    );
}

export default AddIngredientLogsModal;