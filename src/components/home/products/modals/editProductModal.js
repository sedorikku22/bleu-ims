import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SearchableSelect from '../../recipeManagement/modals/searchableSelect';
import "./editProductModal.css";

const API_PRODUCT_TYPE_URL = "https://ims-productservices.onrender.com/ProductType";
const API_PRODUCTS_URL = "https://ims-productservices.onrender.com/is_products/products/";

const getAuthToken = () => localStorage.getItem("authToken");

// Category options
const CATEGORY_OPTIONS = [
    "Barista Choice",
    "Frappe",
    "Milktea",
    "Non-Coffee",
    "Pasta",
    "Premium Coffee",
    "Rice Meals",
    "Sandwich",
    "Silog Bowls",
    "Snacks",
    "Sparkling Series",
    "Specialty Coffee"
];

// Size options
const SIZE_OPTIONS = [
    { value: "12", label: "12" },
    { value: "16", label: "16" },
    { value: "22", label: "22" }
];

function EditProductModal({ product, onClose, onUpdate }) {
    const [productTypes, setProductTypes] = useState([]);
    const [productTypeID, setProductTypeID] = useState("");
    const [productName, setProductName] = useState("");
    const [productCategory, setProductCategory] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productSize, setProductSize] = useState("");
    const [productImageFile, setProductImageFile] = useState(null);

    const [errors, setErrors] = useState({
        productTypeID: "",
        productName: "",
        productCategory: "",
        productPrice: "",
        productSize: "",
        productImageFile: "",
        general: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    // find selected product type for size requirement
    const selectedProductType = productTypes.find(
        (type) => type.productTypeID === parseInt(productTypeID)
    );
    const isSizeRequiredForSelectedType = selectedProductType?.SizeRequired === 1;

    const productTypeOptions = productTypes.map(type => ({
        value: type.productTypeID,
        label: type.productTypeName
    }));

    const categoryOptions = CATEGORY_OPTIONS.map(cat => ({
        value: cat,
        label: cat
    }));

    useEffect(() => {
        if (product) {
            setProductTypeID(String(product.productTypeID || ""));
            setProductName(product.productName || "");
            setProductCategory(product.productCategory || "");
            setProductDescription(product.productDescription || "");
            setProductPrice(product.productPrice ? String(product.productPrice) : "");
            setProductSize(product.productSize || "");
            setProductImageFile(null);
        }
    }, [product]);

    // fetch product types
    useEffect(() => {
        const fetchProductTypes = async () => {
            const token = getAuthToken();
            if (!token) {
                setErrors(prev => ({ ...prev, general: "Authentication token not found." }));
                return;
            }
            try {
                const response = await fetch(`${API_PRODUCT_TYPE_URL}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    throw new Error(errData?.detail || "Failed to fetch product types");
                }
                const data = await response.json();
                setProductTypes(data);
            } catch (error) {
                setErrors(prev => ({ ...prev, general: error.message || "Failed to load product types." }));
            }
        };
        fetchProductTypes();
    }, []);

    // reset productSize if not required
    useEffect(() => {
        if (productTypeID && !isSizeRequiredForSelectedType) {
            setProductSize("");
            setErrors(prev => ({ ...prev, productSize: "" }));
        }
    }, [productTypeID, isSizeRequiredForSelectedType]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, productImageFile: "Please select an image file (jpeg, png, gif)." }));
                setProductImageFile(null);
                e.target.value = null;
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, productImageFile: "File is too large. Max 5MB allowed." }));
                setProductImageFile(null);
                e.target.value = null;
                return;
            }
            setProductImageFile(file);
            setErrors(prev => ({ ...prev, productImageFile: "" }));
        } else {
            setProductImageFile(null);
        }
    };

    const handleFocus = (field) => {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "", general: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({
            productTypeID: "", productName: "", productCategory: "",
            productPrice: "", productSize: "", productImageFile: "", general: ""
        });

        let newErrors = {};
        if (!productTypeID) newErrors.productTypeID = "Product type is required";
        if (!productName.trim()) newErrors.productName = "Product name is required";
        if (!productCategory.trim()) newErrors.productCategory = "Category is required";
        if (!productPrice.trim()) {
            newErrors.productPrice = "Price is required";
        } else if (isNaN(parseFloat(productPrice)) || parseFloat(productPrice) < 0) {
            newErrors.productPrice = "Please enter a valid non-negative price.";
        }
        if (isSizeRequiredForSelectedType && !productSize.trim()) {
            newErrors.productSize = "Product size is required for this product type.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            setIsLoading(false);
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setErrors(prev => ({ ...prev, general: "Authentication token not found." }));
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("ProductName", productName.trim());
        formData.append("ProductTypeID", parseInt(productTypeID));
        formData.append("ProductCategory", productCategory.trim());
        formData.append("ProductDescription", productDescription.trim());
        formData.append("ProductPrice", parseFloat(productPrice));
        if (isSizeRequiredForSelectedType && productSize.trim()) {
            formData.append("ProductSize", productSize.trim());
        }
        if (productImageFile) {
            formData.append("ProductImageFile", productImageFile);
        }

        try {
            const response = await fetch(`${API_PRODUCTS_URL}${product.productID}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                const errorDetail = result.detail || (Array.isArray(result.detail) && result.detail[0]?.msg) || "Failed to update product.";
                throw new Error(errorDetail);
            }
            if (onUpdate) onUpdate(result);
            toast.success("Product updated successfully!");
            onClose();
        } catch (error) {
            let displayError = error.message;
            if (typeof error.message === 'object' && error.message !== null) {
                displayError = JSON.stringify(error.message);
            }
            setErrors(prev => ({ ...prev, general: displayError || "An unexpected error occurred." }));
            toast.error(displayError || "Failed to update product.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="editProduct-modal-overlay">
            <div className="editProduct-modal-container">
                <div className="editProduct-modal-header">
                    <h2>Edit Product</h2>
                    <span className="editProduct-close-button" onClick={onClose}>×</span>
                </div>
                {errors.general && <p className="editProduct-error-message general-error">{errors.general}</p>}
                <form className="editProduct-modal-form" onSubmit={handleSubmit}>
                    <label>
                        Product Type: <span className="editProduct-required-asterisk">*</span>
                        <SearchableSelect
                            value={productTypeID}
                            onChange={(value) => setProductTypeID(String(value))}
                            options={productTypeOptions}
                            placeholder="Select a product type"
                            className={errors.productTypeID ? "editProduct-error-field" : ""}
                            onFocus={() => handleFocus('productTypeID')}
                        />
                        {errors.productTypeID && <p className="editProduct-error-message">{errors.productTypeID}</p>}
                    </label>

                    <label>
                        Name: <span className="editProduct-required-asterisk">*</span>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            onFocus={() => handleFocus('productName')}
                            className={errors.productName ? "editProduct-error-field" : ""}
                        />
                        {errors.productName && <p className="editProduct-error-message">{errors.productName}</p>}
                    </label>

                    <label>
                        Category: <span className="editProduct-required-asterisk">*</span>
                        <SearchableSelect
                            value={productCategory}
                            onChange={setProductCategory}
                            options={categoryOptions}
                            placeholder="--Select Category--"
                            className={errors.productCategory ? "editProduct-error-field" : ""}
                            onFocus={() => handleFocus('productCategory')}
                        />
                        {errors.productCategory && <p className="editProduct-error-message">{errors.productCategory}</p>}
                    </label>

                    <label>
                        Description:
                        <textarea
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            onFocus={() => handleFocus('productDescription')}
                            rows="3"
                        />
                    </label>

                    <label>
                        Price: <span className="editProduct-required-asterisk">*</span>
                        <input
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            onFocus={() => handleFocus('productPrice')}
                            className={errors.productPrice ? "editProduct-error-field" : ""}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                        />
                        {errors.productPrice && <p className="editProduct-error-message">{errors.productPrice}</p>}
                    </label>

                    {/* Conditional Product Size Input */}
                    {productTypeID && (
                        <label>
                            Size: {isSizeRequiredForSelectedType && <span className="editProduct-required-asterisk">*</span>}
                            <SearchableSelect
                                value={productSize}
                                onChange={setProductSize}
                                options={SIZE_OPTIONS}
                                placeholder="Select size"
                                disabled={!isSizeRequiredForSelectedType}
                                className={`${!isSizeRequiredForSelectedType ? "editProduct-na-field" : ""} ${isSizeRequiredForSelectedType && errors.productSize ? "editProduct-error-field" : ""}`}
                                onFocus={isSizeRequiredForSelectedType ? () => handleFocus('productSize') : undefined}
                            />
                            {isSizeRequiredForSelectedType && errors.productSize && <p className="editProduct-error-message">{errors.productSize}</p>}
                        </label>
                    )}

                    <label>
                        Image: <span className="editProduct-required-asterisk">*</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            onFocus={() => handleFocus('productImageFile')}
                            className={errors.productImageFile ? "editProduct-error-field" : ""}
                        />
                        {productImageFile && (
                            <p className="editProduct-file-info">Selected file: {productImageFile.name}</p>
                        )}
                        {errors.productImageFile && (
                            <p className="addProduct-error-message">{errors.productImageFile}</p>
                        )}
                    </label>

                    <div className="editProduct-button-container">
                        <button
                            className="editProduct-submit-button"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                            type="button"
                            className="editProduct-cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

EditProductModal.propTypes = {
    product: PropTypes.shape({
        productID: PropTypes.number.isRequired,
        productName: PropTypes.string,
        productTypeID: PropTypes.any,
        productCategory: PropTypes.string,
        productDescription: PropTypes.string,
        productPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        productSize: PropTypes.string,
        productImageURL: PropTypes.string,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

export default EditProductModal;