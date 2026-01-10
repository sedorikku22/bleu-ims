import React, { useState } from "react";
import "./addMerchandiseModal.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getAuthToken = () => localStorage.getItem("authToken");

function AddMerchandiseModal({ onClose, onSubmit}) {
    const [merchName, setMerchName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [dateAdded, setDateAdded] = useState("");
    const [price, setPrice] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    const [errors, setErrors] = useState({
        merchName: "",
        quantity: "",
        dateAdded: "",
        price: "",
        imageFile: ""
    });
    
    const validate = () => {
        const newErrors = {};
        if (!merchName) newErrors.merchName = "This field is required";
        if (!quantity) newErrors.quantity = "This field is required";
        if (!dateAdded) newErrors.dateAdded = "This field is required";
        if (!price && price !== 0) newErrors.price = "This field is required";
        if (!imageFile) newErrors.imageFile = "Image is required";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        e.preventDefault();

        const newErrors = validate();
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const token = getAuthToken();
            if (!token) {
                toast.error("Authentication token not found.");
                return;
            }
            const formData = new FormData();
            formData.append("MerchandiseName", merchName);
            formData.append("MerchandiseQuantity", parseFloat(quantity));
            formData.append("MerchandiseDateAdded", dateAdded);
            formData.append("MerchandisePrice", parseFloat(price));
            formData.append("MerchandiseImageFile", imageFile);

            try {
                const response = await fetch("https://bleu-stockservices.onrender.com/merchandise/", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Failed to add item.");
                }

                const result = await response.json();
                if (onSubmit) onSubmit(result);
                toast.success("Itemadded successfully!");
                onClose();

            } catch (error) {
                console.error("Error adding item:", error);
                toast.error("Failed to add item.");
            }
        }
        setIsSubmitting(false);
    };

    const handleFocus = (field) => {
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: ""
        }));
    };

    return (
        <div className="addMerchandise-modal-overlay">
            <div className="addMerchandise-modal-container">
                <div className="addMerchandise-modal-header">
                    <h3>Add Item</h3>
                    <span className="addMerchandise-close-button" onClick={onClose}>&times;</span>
                </div>
                <form className="addMerchandise-modal-form" onSubmit={handleSubmit} encType="multipart/form-data">
                    <label>
                        Item Name: <span className="addMerchandise-required-asterisk">*</span>
                        <input
                            type="text"
                            value={merchName}
                            onChange={(e) => setMerchName(e.target.value)}
                            onFocus={() => handleFocus('merchName')}
                            className={errors.merchName ? "addMerchandise-error" : ""}
                        />
                        {errors.merchName && <p className="addMerchandise-error-message">{errors.merchName}</p>}
                    </label>

                    <div className="addMerchandise-row">
                        <label className="addMerchandise-half">
                            Quantity: <span className="addMerchandise-required-asterisk">*</span>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                onFocus={() => handleFocus('quantity')}
                                className={errors.quantity ? "addMerchandise-error" : ""}
                            />
                            {errors.quantity && <p className="addMerchandise-error-message">{errors.quantity}</p>}
                        </label>

                        <label className="addMerchandise-half">
                            Batch Date: <span className="addMerchandise-required-asterisk">*</span>
                            <input
                                type="date"
                                value={dateAdded}
                                onChange={(e) => setDateAdded(e.target.value)}
                                onFocus={() => handleFocus('dateAdded')}
                                className={errors.dateAdded ? "addMerchandise-error" : ""}
                            />
                            {errors.dateAdded && <p className="addMerchandise-error-message">{errors.dateAdded}</p>}
                        </label>
                    </div>

                    <label>
                        Price: <span className="addMerchandise-required-asterisk">*</span>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            onFocus={() => handleFocus('price')}
                            step="0.01"
                            min="0"
                            className={errors.price ? "addMerchandise-error" : ""}
                        />
                        {errors.price && <p className="addMerchandise-error-message">{errors.price}</p>}
                    </label>

                    <label>
                        Upload Image: <span className="addMerchandise-required-asterisk">*</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            onFocus={() => handleFocus('imageFile')}
                        />
                        {errors.imageFile && <p className="addMerchandise-error-message">{errors.imageFile}</p>}
                    </label>

                    <div className="addMerchandise-button-container">
                        <button type="submit" className="addMerchandise-submit-button" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Create Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddMerchandiseModal;
