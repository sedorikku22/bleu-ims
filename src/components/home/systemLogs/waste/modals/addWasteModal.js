import React, { useState, useEffect } from "react";
import "./addWasteModal.css";
import { toast } from 'react-toastify';
import ConfirmationModal from "./confirmationWasteModal";
import SearchableSelect from '../../../recipeManagement/modals/searchableSelect';


function AddWasteModal({ onClose, onSubmit, }) {
    const [formData, setFormData] = useState({
        ItemType: '',
        ItemID: '',
        Amount: '',
        Unit: '',
        Reason: '',
        LoggedBy: '',
        Notes: ''
    });

    const [itemOptions, setItemOptions] = useState([]); 
    const [errors, setErrors] = useState({});
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [preparedData, setPreparedData] = useState(null);
    const [mainUnit, setMainUnit] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            const rawType = formData.ItemType.toLowerCase();
            if (!rawType) {
                setItemOptions([]);
                return;
            }

            setIsLoadingItems(true);
            const token = localStorage.getItem("authToken");
            let endpoint = "";

            if (rawType === "ingredients" || rawType === "ingredient") {
                endpoint = "http://127.0.0.1:8002/ingredients/";
            } else if (rawType === "materials" || rawType === "material") {
                endpoint = "http://127.0.0.1:8002/materials/";
            } else if (rawType === "merchandise") {
                endpoint = "http://127.0.0.1:8002/merchandise/";
            } else {
                setIsLoadingItems(false);
                return;
            }

            try {
                const res = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const formatted = data.map(item => ({
                    id: item.IngredientID || item.MaterialID || item.MerchandiseID || item.ingredient_id || item.material_id || item.merchandise_id,
                    name: item.IngredientName || item.MaterialName || item.MerchandiseName || item.ingredient_name || item.material_name || item.merchandise_name,
                    unit: item.Measurement || item.MaterialMeasurement || item.Unit || item.measurement || item.material_measurement || item.unit
                }));
                setItemOptions(formatted);
            } catch (error) {
                console.error("Failed to fetch items:", error);
                setItemOptions([]);
            }
            setIsLoadingItems(false);
        };

        fetchItems();
        setFormData(prev => ({ ...prev, Unit: '' }));
        setMainUnit('');
    }, [formData.ItemType]);

    useEffect(() => {
        const selectedItem = itemOptions.find(i => i.id === parseInt(formData.ItemID));
        if (selectedItem && selectedItem.unit) {
            setMainUnit(selectedItem.unit);
            setFormData(prev => ({ ...prev, Unit: selectedItem.unit }));
        } else {
            setMainUnit('');
            setFormData(prev => ({ ...prev, Unit: '' }));
        }
    }, [formData.ItemID, itemOptions]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (value) => {
        setFormData(prev => ({ ...prev, ItemID: value }));
        setErrors(prev => ({ ...prev, ItemID: "" }));
    };

    const handleFocus = (field) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.ItemType) newErrors.ItemType = "Item Type is required";
        if (!formData.ItemID) newErrors.ItemID = "Item is required";
        if (!formData.Amount) newErrors.Amount = "Amount is required";
        if (!formData.Reason) newErrors.Reason = "Reason is required";
        if (!formData.LoggedBy) newErrors.LoggedBy = "Logged By is required";
        const selectedType = formData.ItemType.toLowerCase();
        if (selectedType !== "merchandise") {
            if (!formData.Unit) newErrors.Unit = "Unit is required";
            if (
                mainUnit &&
                formData.Unit.toLowerCase() !== mainUnit.toLowerCase()
            ) {
                newErrors.Unit = `Unit must be '${mainUnit}' for this item`;
            }
        }
        if (!formData.Reason) newErrors.Reason = "Reason is required";
        if (!formData.LoggedBy) newErrors.LoggedBy = "Logged By is required";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const prepared = [{
            ItemType: formData.ItemType,
            ItemName: itemOptions.find(i => i.id === parseInt(formData.ItemID))?.name || '',
            BatchNo: '—', 
            Amount: formData.Amount,
            Unit: formData.Unit,
            Reason: formData.Reason,
            Date: new Date().toLocaleDateString(),
            LoggedBy: formData.LoggedBy,
           
        }];

        setPreparedData(prepared);
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        if (isSubmitting) return; 
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("authToken");
            const selectedType = formData.ItemType.toLowerCase();
            let unitValue = formData.Unit;
            if (selectedType === "merchandise") {
                unitValue = "pcs";
            }
            const res = await fetch("http://127.0.0.1:8005/wastelogs/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            body: JSON.stringify({
                    item_type: formData.ItemType.toLowerCase() === "ingredients" ? "ingredient" :
                               formData.ItemType.toLowerCase() === "materials" ? "material" :
                               formData.ItemType.toLowerCase() === "merchandise" ? "merchandise" : formData.ItemType.toLowerCase(),
                    item_id: parseInt(formData.ItemID),
                    amount: parseFloat(formData.Amount),
                    unit: unitValue,
                    waste_reason: formData.Reason,
                    logged_by: formData.LoggedBy,
                   
                })
            });

            if (!res.ok) throw new Error("Logging waste failed.");

            const result = await res.json();
            const finalLogs = result.map(log => ({
                ItemType: formData.ItemType,
                ItemName: itemOptions.find(i => i.id === parseInt(formData.ItemID))?.name || '',
                BatchNo: log.BatchID ? `Batch ${log.BatchID}` : '—',
                Amount: log.Amount,
                Unit: log.Unit,
                Reason: log.WasteReason,
                Date: new Date(log.WasteDate).toLocaleDateString(),
                LoggedBy: log.LoggedBy,
              
            }));

            onSubmit(finalLogs);
            toast.success("Logged waste successfully!");
            setShowConfirmation(false);
            setPreparedData(null);
            setFormData({
                ItemType: '',
                ItemID: '',
                Amount: '',
                Unit: '',
                WasteReason: '',
                LoggedBy: '',
              
            });
        } catch (error) {
            console.error(error);
            toast.error("Logging waste failed.");
        }
        setIsSubmitting(false); 
    };

    const handleCancel = () => {
        setShowConfirmation(false);
        setPreparedData(null);
        setIsSubmitting(false); 
    };

    const renderUnitGroup = () => {
        const selectedType = formData.ItemType.toLowerCase();
        if (selectedType === "merchandise") {
            return null;
        }
        const allowedUnits = mainUnit ? [mainUnit] : ["ml", "l", "kg", "g", "pcs"];
        return (
            <div className="addWaste-form-group">
                <label>
                    Unit: <span className="addWaste-required-asterisk">*</span>
                </label>
                <select
                    name="Unit"
                    value={formData.Unit}
                    onChange={handleChange}
                    onFocus={() => handleFocus("Unit")}
                    className={errors.Unit ? "error" : ""}
                >
                    <option value="">Select Unit</option>
                    {allowedUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                    ))}
                </select>
                {errors.Unit && <p className="addWaste-error-message">{errors.Unit}</p>}
            </div>
        );
    };

    // searchableSelect format
    const searchableOptions = itemOptions.map(item => ({
        value: item.id.toString(),
        label: item.name
    }));

    return (
        <>
        {!showConfirmation && (
            <div className="addWaste-modal-overlay">
                <div className="addWaste-modal-content">
                    <div className="addWaste-modal-header">
                        <h3>Add Waste Log</h3>
                        <span className="addWaste-modal-close-button" onClick={onClose}>×</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group">
                                <label>
                                    Item Type: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <SearchableSelect
                                    value={formData.ItemType}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, ItemType: value, ItemID: '' }));
                                        setErrors(prev => ({ ...prev, ItemType: "" }));
                                    }}
                                    options={[
                                        { value: "Ingredients", label: "Ingredients" },
                                        { value: "Materials", label: "Materials" },
                                        { value: "Merchandise", label: "Merchandise" }
                                    ]}
                                    placeholder="Search and select item type..."
                                    className={errors.ItemType ? "error" : ""}
                                    onFocus={() => handleFocus("ItemType")}
                                />
                                {errors.ItemType && <p className="addWaste-error-message">{errors.ItemType}</p>}
                            </div>
                            <div className="addWaste-form-group">
                                <label>
                                    Item Name: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <SearchableSelect
                                    value={formData.ItemID.toString()}
                                    onChange={handleItemChange}
                                    options={searchableOptions}
                                    placeholder={
                                        isLoadingItems 
                                            ? "Loading items..." 
                                            : formData.ItemType 
                                                ? "Search and select item..." 
                                                : "Select item type first"
                                    }
                                    disabled={!formData.ItemType || isLoadingItems}
                                    className={errors.ItemID ? "error" : ""}
                                    onFocus={() => handleFocus("ItemID")}
                                />
                                {errors.ItemID && <p className="addWaste-error-message">{errors.ItemID}</p>}
                            </div>
                        </div>

                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group">
                                <label>
                                    Amount: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="Amount"
                                    value={formData.Amount}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus("Amount")}
                                    className={errors.Amount ? "error" : ""}
                                />
                                {errors.Amount && <p className="addWaste-error-message">{errors.Amount}</p>}
                            </div>
                            {renderUnitGroup()}
                        </div>

                        <div className="addWaste-form-row">
                            <div className="addWaste-form-group">
                                <label>
                                    Reason: <span className="addWaste-required-asterisk">*</span>
                                </label>
                            <select
                                name="Reason"
                                value={formData.Reason}
                                onChange={handleChange}
                                onFocus={() => handleFocus("Reason")}
                                className={errors.Reason ? "error" : ""}
                            >
                                <option value="">Select Reason</option>
                                <option value="Expired">Expired</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Spillage">Spillage</option>
                                <option value="Other">Other</option>
                            </select>
                                {errors.Reason && <p className="addWaste-error-message">{errors.Reason}</p>}
                            </div>
                            <div className="addWaste-form-group">
                                <label>
                                    Logged By: <span className="addWaste-required-asterisk">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="LoggedBy"
                                    value={formData.LoggedBy}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus("LoggedBy")}
                                    className={errors.LoggedBy ? "error" : ""}
                                />
                                {errors.LoggedBy && <p className="addWaste-error-message">{errors.LoggedBy}</p>}
                            </div>
                        </div>

                    

                    <div className="addWaste-modal-buttons">
                        <button type="addWaste-submit-button">Create Log</button>
                    </div>
                </form>
            </div>
        </div>
        )}
        <ConfirmationModal
            visible={showConfirmation}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            formData={preparedData}
            isSubmitting={isSubmitting}
        />
        </>
    );
}

export default AddWasteModal;