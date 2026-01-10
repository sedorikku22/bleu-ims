import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./editRecipeModal.css";
import SearchableSelect from "./searchableSelect";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "https://ims-recipeservices.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

function EditRecipeModal({ recipe, onClose, onUpdate, products, ingredients: initialIngredients = [], supplies: availableSupplies = [] }) {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [category, setCategory] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [availableAddOns, setAvailableAddOns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const isStaff = localStorage.getItem("role") === "staff";
    const [editedRecipe, setEditedRecipe] = useState({
        RecipeName: "",
        ProductID: "",
        Ingredients: [],
        Materials: [],
        AddOns: [],
    });

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

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token || isStaff) {
            toast.warning("You do not have permission to add recipes.");
            handleLogout();
        }
        if (!recipe || !recipe.RecipeID) {
            console.warn("Recipe not available yet.");
            return;
        }
        const fetchRecipeDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/recipes/${recipe.RecipeID}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch recipe details.");
                const data = await response.json();

                const foundProduct = products.find(p => p.ProductID === data.ProductID);
                setCategory(foundProduct?.ProductCategory || "");

                setEditedRecipe({
                    RecipeName: data.RecipeName,
                    ProductID: data.ProductID,
                    Ingredients: (data.Ingredients || []).map(i => ({
                        name: i.IngredientName,
                        amount: i.Amount,
                        measurement: i.Measurement
                    })),
                    Materials: (data.Materials || []).map(m => ({
                        name: m.MaterialName,
                        amount: m.Quantity,
                        measurement: m.Measurement
                    })),
                    AddOns: (data.AddOns || []).map(a => ({ id: a.AddOnID }))
                });
            } catch (err) {
                console.error("Error:", err);
                toast.error("Error fetching recipe data.");
            }
        };

        fetchRecipeDetails();
    }, [recipe, products, handleLogout, isStaff]);

    useEffect(() => {
        // fetch available add-ons
        const token = getAuthToken();
        if (!token) return;
        const fetchAddOns = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/Add%20ons/is_addons/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch add-ons");
                const data = await response.json();
                setAvailableAddOns(data);
            } catch (error) {
                console.error("Error fetching add-ons:", error);
                toast.error("Could not load available add-ons.");
            }
        };
        fetchAddOns();
    }, []);

    useEffect(() => {
        console.log("Initial Ingredients:", initialIngredients);
        console.log("Available Supplies:", availableSupplies);
    }, [initialIngredients, availableSupplies]);

    useEffect(() => {
        if (category) {
            const filtered = products.filter(p => p.ProductCategory === category);
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [products, category]);

    // prepare options for searchable selects
    const categoryOptions = useMemo(() => 
        Array.from(new Set(products.map(p => p.ProductCategory)))
            .sort()
            .map(cat => ({ value: cat, label: cat }))
    , [products]);

    const productOptions = useMemo(() => 
        filteredProducts.map(p => ({ 
            value: p.ProductID.toString(), 
            label: p.ProductName 
        }))
    , [filteredProducts]);

    const ingredientSelectOptions = useMemo(() => 
        initialIngredients.map(i => ({ 
            value: i.IngredientName, 
            label: i.IngredientName 
        }))
    , [initialIngredients]);

    const supplySelectOptions = useMemo(() => 
        availableSupplies.map(m => ({ 
            value: m.MaterialName, 
            label: m.MaterialName 
        }))
    , [availableSupplies]);

    const addOnSelectOptions = useMemo(() => 
        availableAddOns.map(opt => ({ 
            value: opt.AddOnID.toString(), 
            label: opt.AddOnName 
        }))
    , [availableAddOns]);

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setEditedRecipe(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (selectedCategory) => {
        setCategory(selectedCategory);
    };

    const handleProductChange = (selectedProductID) => {
        const selectedProduct = filteredProducts.find(p => p.ProductID.toString() === selectedProductID);
        setEditedRecipe(prev => ({
            ...prev,
            ProductID: selectedProductID,
            RecipeName: selectedProduct ? selectedProduct.ProductName : ""
        }));
    };

    const handleIngredientChange = (index, field, value) => {
        const updated = [...editedRecipe.Ingredients];
        updated[index][field] = value;
        setEditedRecipe(prev => ({ ...prev, Ingredients: updated }));
    };

    const handleAddIngredient = () => {
        setEditedRecipe(prev => ({
            ...prev,
            Ingredients: [...prev.Ingredients, { name: "", amount: "", measurement: "" }]
        }));
    };

    const handleRemoveIngredient = (index) => {
        setEditedRecipe(prev => ({
            ...prev,
            Ingredients: prev.Ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        const updated = [...editedRecipe.Materials];
        updated[index][field] = value;
        setEditedRecipe(prev => ({ ...prev, Materials: updated }));
    };

    const handleAddMaterial = () => {
        setEditedRecipe(prev => ({
            ...prev,
            Materials: [...prev.Materials, { name: "", amount: "", measurement: "" }]
        }));
    };

    const handleRemoveMaterial = (index) => {
        setEditedRecipe(prev => ({
            ...prev,
            Materials: prev.Materials.filter((_, i) => i !== index)
        }));
    };

    const handleAddAddOn = () => {
        setEditedRecipe(prev => ({
            ...prev,
            AddOns: [...prev.AddOns, { id: "" }]
        }));
    };

    const handleAddOnChange = (index, value) => {
        const updated = [...editedRecipe.AddOns];
        updated[index].id = value;
        setEditedRecipe(prev => ({ ...prev, AddOns: updated }));
    };

    const handleRemoveAddOn = (index) => {
        setEditedRecipe(prev => ({
            ...prev,
            AddOns: prev.AddOns.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!editedRecipe.RecipeName) newErrors.RecipeName = "Recipe name is required";
        if (!editedRecipe.ProductID) newErrors.ProductID = "Product is required";
        if (!editedRecipe.Ingredients.length) newErrors.Ingredients = "At least one ingredient is required";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const token = getAuthToken();
        if (!token) return handleLogout();

        const formattedIngredients = editedRecipe.Ingredients.map(ing => {
            const match = initialIngredients.find(i => i.IngredientName === ing.name);
            return {
                IngredientID: match?.IngredientID,
                Amount: parseFloat(ing.amount),
                Measurement: ing.measurement
            };
        });

        const formattedMaterials = editedRecipe.Materials.map(mat => {
            const match = availableSupplies.find(m => m.MaterialName === mat.name);
            return {
                MaterialID: match?.MaterialID,
                Quantity: parseFloat(mat.amount),
                Measurement: mat.measurement
            };
        });

        // format add-ons
        const formattedAddOns = editedRecipe.AddOns
            .map(a => parseInt(a.id, 10))
            .filter(id => !isNaN(id));

        const payload = {
            RecipeName: editedRecipe.RecipeName,
            ProductID: parseInt(editedRecipe.ProductID, 10),
            Ingredients: formattedIngredients,
            Materials: formattedMaterials,
            AddOns: formattedAddOns
        };

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/recipes/${recipe.RecipeID}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Update failed.");
            }
            const result = await response.json();
            if (onUpdate) onUpdate(result);
            toast.success("Recipe updated successfully!");
            onClose();
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Failed to update recipe.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="editRecipe-modal-overlay">
            <div className="editRecipe-modal-container">
                <div className="editRecipe-modal-header">
                    <h3>Edit Recipe</h3>
                    <span className="editRecipe-close-button" onClick={onClose}>&times;</span>
                </div>
                <form onSubmit={handleSubmit} className="editRecipe-modal-form">
                    <div className="editRecipe-form-row">
                        <div className="editRecipe-form-group">
                            <label>Category <span className="required">*</span></label>
                            <SearchableSelect
                                value={category}
                                onChange={handleCategoryChange}
                                options={categoryOptions}
                                placeholder="Select a category"
                                className={errors.category ? "error" : ""}
                            />
                            {errors.category && <p className="error-message">{errors.category}</p>}
                        </div>

                        <div className="editRecipe-form-group">
                            <label>Product <span className="required">*</span></label>
                            <SearchableSelect
                                value={editedRecipe.ProductID.toString()}
                                onChange={handleProductChange}
                                options={productOptions}
                                placeholder="Select Product"
                                className={errors.ProductID ? "error" : ""}
                            />
                            {errors.ProductID && <p className="error-message">{errors.ProductID}</p>}
                        </div>
                    </div>

                    <div className="editRecipe-section">
                        <h4>Ingredients <span className="required">*</span></h4>
                        <button type="button" onClick={handleAddIngredient} className="editRecipe-add-button">+ Add Ingredient</button>
                        {editedRecipe.Ingredients.map((ing, index) => (
                            <div key={index} className="editRecipe-item">
                                <div className="editRecipe-item-row">
                                    <div className="editRecipe-item-field">
                                        <label>Ingredient</label>
                                        <SearchableSelect
                                            value={ing.name || ""}
                                            onChange={(value) => handleIngredientChange(index, "name", value)}
                                            options={ingredientSelectOptions}
                                            placeholder="Select Ingredient"
                                        />
                                    </div>
                                    <div className="editRecipe-item-field">
                                        <label>Amount</label>
                                        <input
                                            type="number"
                                            value={ing.amount}
                                            onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                                        />
                                    </div>
                                    <div className="editRecipe-item-field">
                                        <label>Unit</label>
                                        <select
                                            value={ing.measurement}
                                            onChange={(e) => handleIngredientChange(index, "measurement", e.target.value)}
                                        >
                                            <option value="">Select unit</option>
                                            {(() => {
                                                const selected = initialIngredients.find(i => i.IngredientName === ing.name);
                                                const mainUnit = selected?.Measurement;
                                                const recipeUnit = getRecipeUnit(mainUnit);
                                                return recipeUnit ? (
                                                    <option value={recipeUnit}>{recipeUnit}</option>
                                                ) : null;
                                            })()}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveIngredient(index)}
                                        className="editRecipe-remove-button"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                        {errors.ingredients && <p className="error-message">{errors.ingredients}</p>}
                    </div>

                    <div className="editRecipe-section">
                        <h4>Supplies and Materials</h4>
                        <button type="button" onClick={handleAddMaterial} className="editRecipe-add-button">+ Add Supply</button>
                        {editedRecipe.Materials.map((mat, index) => (
                            <div key={index} className="editRecipe-item">
                                <div className="editRecipe-item-row">
                                    <div className="editRecipe-item-field">
                                        <label>Supply</label>
                                        <SearchableSelect
                                            value={mat.name || ""}
                                            onChange={(value) => handleMaterialChange(index, "name", value)}
                                            options={supplySelectOptions}
                                            placeholder="Select Supply"
                                        />
                                    </div>
                                    <div className="editRecipe-item-field">
                                        <label>Quantity</label>
                                        <input
                                            type="number"
                                            value={mat.amount}
                                            onChange={(e) => handleMaterialChange(index, "amount", e.target.value)}
                                        />
                                    </div>
                                    <div className="editRecipe-item-field">
                                        <label>Unit</label>
                                        <select
                                            value={mat.measurement}
                                            onChange={(e) => handleMaterialChange(index, "measurement", e.target.value)}
                                        >
                                            <option value="">Select unit</option>
                                            <option value="pcs">pcs</option>
                                            <option value="pack">pack</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMaterial(index)}
                                        className="editRecipe-remove-button"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="editRecipe-section">
                        <h4>Add-Ons</h4>
                        <button type="button" onClick={handleAddAddOn} className="editRecipe-add-button">+ Add Add-On</button>
                        {editedRecipe.AddOns.map((addOn, index) => (
                            <div key={index} className="editRecipe-item">
                                <div className="editRecipe-item-row">
                                    <div className="editRecipe-item-field" style={{ flex: 1 }}>
                                        <label>Add-On</label>
                                        <SearchableSelect
                                            value={addOn.id.toString()}
                                            onChange={(value) => handleAddOnChange(index, value)}
                                            options={addOnSelectOptions}
                                            placeholder="Select Add-On"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAddOn(index)}
                                        className="editRecipe-remove-button"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="editRecipe-button-container">
                        <button type="submit" className="editRecipe-submit-button" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditRecipeModal;