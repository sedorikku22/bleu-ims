import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./addRecipeModal.css";
import SearchableSelect from "./searchableSelect";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "http://127.0.0.1:8004";
const getAuthToken = () => localStorage.getItem("authToken");

function AddRecipeModal({ onClose, onSubmit, type, products, initialIngredients, supplies: availableSupplies }) {
    const [recipeName, setRecipeName] = useState("");
    const [category, setCategory] = useState("");
    const [product, setProduct] = useState("");
    const [ingredients, setIngredients] = useState([]);
    const [recipeSupplies, setRecipeSupplies] = useState([]);
    const [recipeAddOns, setRecipeAddOns] = useState([]); 
    const [availableAddOns, setAvailableAddOns] = useState([]); 
    const [errors, setErrors] = useState({});
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [ingredientOptions, setIngredientOptions] = useState([]);
    const [materialOptions, setMaterialOptions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isStaff = localStorage.getItem("role") === "staff";
    const navigate = useNavigate();

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
    }, [navigate, handleLogout, isStaff]);

    useEffect(() => {
        // fetch ingredients
        const fetchIngredients = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await fetch("http://127.0.0.1:8002/ingredients/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setIngredientOptions(data.map(item => ({
                    id: item.IngredientID,
                    name: item.IngredientName,
                    unit: item.Measurement
                })));
            } catch (error) {
                console.error("Failed to fetch ingredients:", error);
            }
        };

        // fetch materials
        const fetchMaterials = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await fetch("http://127.0.0.1:8002/materials/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setMaterialOptions(data.map(item => ({
                    id: item.MaterialID,
                    name: item.MaterialName,
                    unit: item.MaterialMeasurement || item.Measurement
                })));
            } catch (error) {
                console.error("Failed to fetch materials:", error);
            }
        };
        fetchIngredients();
        fetchMaterials();
    }, []);

    // fetch available add-ons
    useEffect(() => {
        const fetchAddOns = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/Add%20ons/is_addons/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch add-ons");
                }
                const data = await response.json();
                setAvailableAddOns(data);
            } catch (error) {
                console.error("Error fetching add-ons:", error);
                toast.error("Could not load available add-ons.");
            }
        };
        fetchAddOns();
    }, []);

    const availableCategories = useMemo(() => {
        if (!products) return [];
        const relevantProducts = products.filter(p => p.ProductTypeName.toLowerCase() === type);
        const categorySet = new Set(relevantProducts.map(p => p.ProductCategory));
        return Array.from(categorySet).sort();
    }, [products, type]);

    // searchable selects
    const categoryOptions = useMemo(() => 
        availableCategories.map(cat => ({ value: cat, label: cat }))
    , [availableCategories]);

    const productOptions = useMemo(() => 
        filteredProducts.map(p => ({ value: p.ProductID.toString(), label: p.ProductName }))
    , [filteredProducts]);

    const ingredientSelectOptions = useMemo(() => 
        (initialIngredients || []).map(ing => ({ 
            value: ing.IngredientID.toString(), 
            label: ing.IngredientName 
        }))
    , [initialIngredients]);

    const supplySelectOptions = useMemo(() => 
        (availableSupplies || []).map(sup => ({ 
            value: (sup.MaterialID || sup.SupplyID).toString(), 
            label: sup.MaterialName || sup.SupplyName 
        }))
    , [availableSupplies]);

    const addOnSelectOptions = useMemo(() => 
        availableAddOns.map(opt => ({ 
            value: opt.AddOnID.toString(), 
            label: opt.AddOnName 
        }))
    , [availableAddOns]);

    const getIngredientUnit = (id) => {
        const ing = ingredientOptions.find(i => i.id === parseInt(id));
        return ing?.unit || "";
    };

    const getMaterialUnit = (id) => {
        const mat = materialOptions.find(m => m.id === parseInt(id));
        return mat?.unit || "";
    };

    const getAddOnUnit = (id) => {
        const addOn = availableAddOns.find(a => a.AddOnID === parseInt(id));
        return addOn?.Measurement || addOn?.Unit || "";
    };

    const handleCategoryChange = (selectedCategory) => {
        setCategory(selectedCategory);
        setProduct("");
        setRecipeName("");
        if (selectedCategory) {
            const newFilteredList = products.filter(p => p.ProductCategory === selectedCategory);
            setFilteredProducts(newFilteredList);
        } else {
            setFilteredProducts([]);
        }
    };

    const handleProductChange = (selectedProductID) => {
        setProduct(selectedProductID);
        const selectedProduct = filteredProducts.find(p => p.ProductID.toString() === selectedProductID);
        setRecipeName(selectedProduct ? selectedProduct.ProductName : "");
        handleFocus('product');
    };

    const handleAddIngredient = () =>
        setIngredients([
            ...ingredients,
            { name: "", amount: "", measurement: "" }
        ]);

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const handleRemoveIngredient = (index) =>
        setIngredients(ingredients.filter((_, i) => i !== index));

    const handleAddSupply = () =>
        setRecipeSupplies([
            ...recipeSupplies,
            { name: "", amount: "", measurement: "" }
        ]);

    const handleSupplyChange = (index, field, value) => {
        const newSupplies = [...recipeSupplies];
        newSupplies[index][field] = value;
        setRecipeSupplies(newSupplies);
    };

    const handleRemoveSupply = (index) =>
        setRecipeSupplies(recipeSupplies.filter((_, i) => i !== index));

    const handleAddAddOn = () => {
        setRecipeAddOns([...recipeAddOns, { id: "", amount: "", measurement: "" }]);
    };

    const handleAddOnChange = (index, field, value) => {
        const newAddOns = [...recipeAddOns];
        newAddOns[index][field] = value;
        setRecipeAddOns(newAddOns);
    };

    const handleRemoveAddOn = (index) => {
        setRecipeAddOns(recipeAddOns.filter((_, i) => i !== index));
    };

    const handleFocus = (field) =>
        setErrors((prev) => ({ ...prev, [field]: "" }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const newErrors = {};
        if (!product) newErrors.product = "Product is required";
        if (!category) newErrors.category = "Category is required";
        if (ingredients.length === 0) newErrors.ingredients = "At least one ingredient is required";
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const token = getAuthToken();

            if (!token) {
                toast.error("Authentication token not found.");
                handleLogout();
                return;
            }

            const formattedIngredients = ingredients.map(ing => ({
                IngredientID: parseInt(ing.name, 10),
                Amount: parseFloat(ing.amount),
                Measurement: ing.measurement || null,
            }));

            const formattedSupplies = recipeSupplies.map(sup => ({
                MaterialID: parseInt(sup.name, 10),
                Quantity: parseFloat(sup.amount),
                Measurement: sup.measurement || null,
            }));

            const formattedAddOns = recipeAddOns
                .filter(addOn => addOn.id)
                .map(addOn => parseInt(addOn.id, 10));

            const newRecipe = {
                RecipeName: recipeName,
                ProductID: parseInt(product, 10),
                Ingredients: formattedIngredients,
                Materials: formattedSupplies,
                AddOns: formattedAddOns,
            };

            try {
                const response = await fetch(`${API_BASE_URL}/recipes/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newRecipe),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.detail
                        ? JSON.stringify(errorData.detail, null, 2)
                        : "An unknown error occurred.";
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                if (onSubmit) onSubmit(result);
                toast.success("Recipe added successfully!");
                onClose();
            } catch (error) {
                console.error("Error adding recipe:", error.message);
                toast.error(`Failed to add recipe. ${error.message}`);
            }
        }
        setIsSubmitting(false);
    };

    return (
        <div className="addRecipe-modal-overlay">
            <div className="addRecipe-modal-container">
                <div className="addRecipe-modal-header">
                    <h3>Add Recipe</h3>
                    <span className="addRecipe-close-button" onClick={onClose}>×</span>
                </div>
                <form className="addRecipe-modal-form" onSubmit={handleSubmit}>

                    <div className="recipe-form-row">
                        <div className="recipe-form-group">
                            <label>Category <span className="required">*</span></label>
                            <SearchableSelect
                                value={category}
                                onChange={handleCategoryChange}
                                options={categoryOptions}
                                placeholder="Select a category"
                                onFocus={() => handleFocus('category')}
                                className={errors.category ? 'error' : ''}
                            />
                            {errors.category && <p className="error-message">{errors.category}</p>}
                        </div>
                        <div className="recipe-form-group">
                            <label>Product <span className="required">*</span></label>
                            <SearchableSelect
                                value={product}
                                onChange={handleProductChange}
                                options={productOptions}
                                placeholder="Select a product"
                                disabled={!category}
                                onFocus={() => handleFocus('product')}
                                className={errors.product ? 'error' : ''}
                            />
                            {errors.product && <p className="error-message">{errors.product}</p>}
                        </div>
                    </div>

                    <div className="recipe-section">
                        <h4>Ingredients <span className="required">*</span></h4>
                        <button type="button" onClick={handleAddIngredient} className="recipe-add-button">+ Add Ingredient</button>
                        {ingredients.length > 0 && ingredients.map((ingredient, index) => (
                            <div key={index} className="recipe-item">
                                <div className="recipe-item-row">
                                    <div className="recipe-item-field">
                                        <label>Ingredient</label>
                                        <SearchableSelect
                                            value={ingredient.name}
                                            onChange={(value) => handleIngredientChange(index, 'name', value)}
                                            options={ingredientSelectOptions}
                                            placeholder="Select an ingredient"
                                        />
                                    </div>
                                    <div className="recipe-item-field">
                                        <label>Amount</label>
                                        <input type="number" value={ingredient.amount} onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)} />
                                    </div>
                                    <div className="recipe-item-field">
                                        <label>Unit</label>
                                        <select
                                            value={ingredient.measurement}
                                            onChange={(e) => handleIngredientChange(index, 'measurement', e.target.value)}
                                        >
                                            <option value="">Select unit</option>
                                            {ingredient.name && (
                                                <option value={getRecipeUnit(getIngredientUnit(ingredient.name))}>
                                                    {getRecipeUnit(getIngredientUnit(ingredient.name))}
                                                </option>
                                            )}
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveIngredient(index)} className="recipe-remove-button">Remove</button>
                                </div>
                            </div>
                        ))}
                        {errors.ingredients && <p className="error-message">{errors.ingredients}</p>}
                    </div>

                    <div className="recipe-section">
                        <h4>Supplies</h4>
                        <button type="button" onClick={handleAddSupply} className="recipe-add-button">+ Add Supply</button>
                        {recipeSupplies.length > 0 && recipeSupplies.map((supply, index) => (
                            <div key={index} className="recipe-item">
                                <div className="recipe-item-row">
                                    <div className="recipe-item-field">
                                        <label>Supply</label>
                                        <SearchableSelect
                                            value={supply.name}
                                            onChange={(value) => handleSupplyChange(index, 'name', value)}
                                            options={supplySelectOptions}
                                            placeholder="Select a supply"
                                        />
                                    </div>
                                    <div className="recipe-item-field">
                                        <label>Amount</label>
                                        <input type="number" value={supply.amount} onChange={(e) => handleSupplyChange(index, 'amount', e.target.value)} />
                                    </div>
                                    <div className="recipe-item-field">
                                        <label>Unit</label>
                                        <select
                                            value={supply.measurement}
                                            onChange={(e) => handleSupplyChange(index, 'measurement', e.target.value)}
                                        >
                                            <option value="">Select unit</option>
                                            {getMaterialUnit(supply.name) && (
                                                <option value={getMaterialUnit(supply.name)}>
                                                    {getMaterialUnit(supply.name)}
                                                </option>
                                            )}
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveSupply(index)} className="recipe-remove-button">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="recipe-section">
                        <h4>Add-Ons</h4>
                        <button type="button" onClick={handleAddAddOn} className="recipe-add-button">+ Add Add-On</button>
                        {recipeAddOns.length > 0 && recipeAddOns.map((addOn, index) => (
                            <div key={index} className="recipe-item">
                                <div className="recipe-item-row">
                                    <div className="recipe-item-field">
                                        <label>Add-On</label>
                                        <SearchableSelect
                                            value={addOn.id}
                                            onChange={(value) => handleAddOnChange(index, 'id', value)}
                                            options={addOnSelectOptions}
                                            placeholder="Select an add-on"
                                        />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveAddOn(index)} className="recipe-remove-button">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="addRecipe-button-container">
                        <button type="submit" className="addRecipe-submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Recipe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddRecipeModal;