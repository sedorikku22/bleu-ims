import React, { useState, useEffect } from "react";
import "./editIngredientModal.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://127.0.0.1:8002";
const getAuthToken = () => localStorage.getItem("authToken");

function EditIngredientModal({ ingredient, onClose, onUpdate }) {
    const [IngredientName, setIngredientName] = useState("");
    const [Amount, setAmount] = useState("");
    const [Measurement, setMeasurement] = useState("");
    const [BestBeforeDate, setBestBeforeDate] = useState("");
    const [ExpirationDate, setExpirationDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        IngredientName: "",
        Amount: "",
        Measurement: "",
        BestBeforeDate: "",
        ExpirationDate: ""
    });

    useEffect(() => {
        console.log("ingredient:", ingredient);
        if (ingredient) {
            setIngredientName(ingredient.IngredientName || "");
            setAmount(ingredient.Amount || "");
            setMeasurement(ingredient.Measurement || "");
            setBestBeforeDate(ingredient.BestBeforeDate || "");
            setExpirationDate(ingredient.ExpirationDate || "");     
        }
    }, [ingredient]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        const payload = {
            IngredientName: IngredientName,
            Amount: parseFloat(Amount),
            Measurement: Measurement,
            BestBeforeDate: BestBeforeDate,
            ExpirationDate: ExpirationDate
        };

        setIsLoading(true);

        // update ingredient
        try {
            const response = await fetch(`${API_BASE_URL}/ingredients/${ingredient.IngredientID}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to update item.");
            }

            const updatedData = await response.json();
            onUpdate(updatedData);
            toast.success("Item updated successfully!");
            onClose();
        } catch (error) {
            console.error("Error updating item:", error);
            toast.error("Error updating item.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="editIngredient-modal-overlay">
            <div className="editIngredient-modal">
                <h2>Edit Item</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Item Name: <span className="editIngredient-required-asterisk">*</span>
                        <input
                            type="text"
                            name="IngredientName"
                            value={IngredientName}
                            onChange={(e) => {
                                setIngredientName(e.target.value);
                                if (form.IngredientName) setForm(prev => ({ ...prev, IngredientName: "" }));
                            }}
                            className={form.IngredientName ? "editIngredient-error" : ""}
                            required
                        />
                    </label>

                    <div className="ingredient-group">
                        <div className="ingredient-amount">
                            <label>
                                Amount: <span className="editIngredient-required-asterisk">*</span>
                                <input
                                    type="number"
                                    name="Amount"
                                    value={Amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        if (form.Amount) setForm(prev => ({ ...prev, Amount: "" }));
                                    }}
                                    className={form.Amount ? "editIngredient-error" : ""}
                                    required
                                />
                            </label>
                        </div>
                        <div className="ingredient-measurement">
                            <label>
                                Unit: <span className="editIngredient-required-asterisk">*</span>
                                <select
                                    name="Measurement"
                                    value={Measurement}
                                    onChange={(e) => {
                                        setMeasurement(e.target.value);
                                        if (form.Measurement) setForm(prev => ({ ...prev, Measurement: "" }));
                                    }}
                                    className={form.Measurement ? "editIngredient-error" : ""}
                                    required
                                >
                                    <option value="">Select unit</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="pcs">pcs</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="ingredient-group">
                        <div className="ingredient-bestBefore">
                            <label>
                                Batch Date: <span className="editIngredient-required-asterisk">*</span>
                                <input
                                    type="date"
                                    name="BestBeforeDate"
                                    value={BestBeforeDate}
                                    onChange={(e) => {
                                        setBestBeforeDate(e.target.value);
                                        if (form.BestBeforeDate) setForm(prev => ({ ...prev, BestBeforeDate: "" }));
                                    }}
                                    className={form.BestBeforeDate ? "editIngredient-error" : ""}
                                    required
                                />
                            </label>
                        </div>
                        <div className="ingredient-expiration">
                            <label>
                                Expiration Date: <span className="editIngredient-required-asterisk">*</span>
                                <input
                                    type="date"
                                    name="ExpirationDate"
                                    value={ExpirationDate}
                                    onChange={(e) => {
                                        setExpirationDate(e.target.value);
                                        if (form.ExpirationDate) setForm(prev => ({ ...prev, ExpirationDate: "" }));
                                    }}
                                    className={form.ExpirationDate ? "editIngredient-error" : ""}
                                    required
                                />
                            </label>
                        </div>
                    </div>

                    <div className="editIngredient-modal-buttons">
                        <button type="submit" className="editIngredient-save-button" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="editIngredient-cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
                <ToastContainer />
            </div>
        </div>
    );
}

export default EditIngredientModal;