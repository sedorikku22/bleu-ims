import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SearchableSelect from './searchableSelect';
import './editAddOnModal.css';

const API_BASE_URL = "https://ims-recipeservices.onrender.com";
const INGREDIENTS_API_URL = "https://bleu-stockservices.onrender.com/ingredients/";
const getAuthToken = () => localStorage.getItem("authToken");

// unit helper
function getRecipeUnit(mainUnit) {
    if (!mainUnit) return "";
    switch (mainUnit.toLowerCase()) {
        case "kg": return "g";
        case "l": return "ml";
        case "pcs": return "pcs";
        case "pack": return "pack";
        default: return mainUnit;
    }
}

const EditAddOnModal = ({ addOn, onClose, onAddOnUpdated }) => {
    const [addOnName, setAddOnName] = useState('');
    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [measurement, setMeasurement] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [ingredientDetails, setIngredientDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (addOn) {
            setAddOnName(addOn.AddOnName);
            setSelectedIngredientId(addOn.IngredientID.toString());
            setPrice(addOn.Price.toString());
            setAmount(addOn.Amount.toString());
            setMeasurement(addOn.Measurement);
        }
    }, [addOn]);

    // fetch ingredients
    useEffect(() => {
        const fetchIngredients = async () => {
            const token = getAuthToken();
            if (!token) {
                toast.error("Authentication token not found.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/Add%20ons/is_addons/ingredients/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch ingredients.');
                }

                const data = await response.json();
                setIngredients(data);
            } catch (err) {
                setError('Could not load ingredients. Please try again later.');
                toast.error(err.message);
                console.error('Error fetching ingredients:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIngredients();
    }, []);

    // fetch ingredient details for unit derivation
    useEffect(() => {
        const fetchIngredientDetails = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await fetch(INGREDIENTS_API_URL, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch ingredient details.");
                setIngredientDetails(await res.json());
            } catch (err) { toast.error("Could not load ingredient details."); }
        };
        fetchIngredientDetails();
    }, []);

    // derive selected ingredient's unit
    const selectedIngredientUnit = React.useMemo(() => {
        const detail = ingredientDetails.find(d => d.IngredientID?.toString() === selectedIngredientId);
        return detail ? getRecipeUnit(detail.Measurement) : "";
    }, [selectedIngredientId, ingredientDetails]);

    // when ingredient changes, reset its unit
    useEffect(() => {
        setMeasurement(selectedIngredientUnit);
    }, [selectedIngredientUnit]);

    // SearchableSelect
    const ingredientOptions = React.useMemo(() => {
        return ingredients.map(ingredient => ({
            value: ingredient.IngredientID.toString(),
            label: ingredient.IngredientName
        }));
    }, [ingredients]);

    // form validation
    const validateForm = () => {
        if (!addOnName.trim()) {
            setError('Add-on name is required.');
            return false;
        }
        if (!selectedIngredientId) {
            setError('Please select an ingredient.');
            return false;
        }
        if (!price || parseFloat(price) <= 0) {
            setError('Price must be greater than 0.');
            return false;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setError('Amount must be greater than 0.');
            return false;
        }
        if (!measurement) {
            setError('Please select a unit.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        const token = getAuthToken();
        if (!token) {
            toast.error("You are not authorized. Please log in again.");
            return;
        }

        setIsSubmitting(true);

        const updatePayload = {
            AddOnName: addOnName.trim(),
            IngredientID: parseInt(selectedIngredientId, 10),
            Price: parseFloat(price),
            Amount: parseFloat(amount),
            Measurement: measurement
        };

        try {
            const response = await fetch(`${API_BASE_URL}/Add%20ons/is_addons/${addOn.AddOnID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
            }

            const updatedAddOn = await response.json();
            toast.success(`Add-on '${updatedAddOn.AddOnName}' updated successfully!`);
            
            if (onAddOnUpdated) {
                onAddOnUpdated(updatedAddOn);
            }
            
            onClose();

        } catch (err) {
            console.error('Error updating add-on:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="form-modal">
                <div className="edit-addon-header">
                    <h3>Edit Add-On</h3>
                    <button 
                        type="button" 
                        className="close-btn"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    
                    {/* Add-on name input */}
                    <div className="form-group">
                        <label htmlFor="edit-addon-name">Add-on Name <span className="required">*</span></label>
                        <input
                            type="text"
                            id="edit-addon-name"
                            value={addOnName}
                            onChange={(e) => setAddOnName(e.target.value)}
                            required
                            disabled={isSubmitting}
                            placeholder="Enter add-on name"
                        />
                    </div>
                    
                    {/* Ingredient dropdown */}
                    <div className="form-group">
                        <label htmlFor="edit-ingredient">Ingredient <span className="required">*</span></label>
                        <SearchableSelect
                            value={selectedIngredientId}
                            onChange={setSelectedIngredientId}
                            options={ingredientOptions}
                            placeholder={isLoading ? 'Loading ingredients...' : '-- Select an Ingredient --'}
                            disabled={isLoading || isSubmitting}
                            className="ingredient-select"
                        />
                    </div>
                    
                    {/* Price input */}
                    <div className="form-group">
                        <label htmlFor="edit-price">Price <span className="required">*</span></label>
                        <input
                            type="number"
                            id="edit-price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            disabled={isSubmitting}
                            placeholder="0.00"
                        />
                    </div>

                    {/* Amount input */}
                    <div className="form-group">
                        <label htmlFor="edit-amount">Amount <span className="required">*</span></label>
                        <input
                            type="number"
                            id="edit-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 15"
                            required
                            min="0"
                            step="0.01"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    {/* Unit dropdown */}
                    <div className="form-group">
                        <label htmlFor="edit-measurement">Unit <span className="required">*</span></label>
                        <select
                            id="edit-measurement"
                            value={measurement}
                            onChange={(e) => setMeasurement(e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Select unit</option>
                            {selectedIngredientUnit && (
                                <option value={selectedIngredientUnit}>{selectedIngredientUnit}</option>
                            )}
                        </select>
                    </div>
                    
                    <div className="modal-actions">
                        <button 
                            type="submit" 
                            className="update-Button"
                            disabled={isSubmitting || isLoading}
                        >
                            {isSubmitting ? 'Updating...' : 'Update'}
                        </button>
                        <button 
                            type="button" 
                            className="cancel-Update" 
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAddOnModal;