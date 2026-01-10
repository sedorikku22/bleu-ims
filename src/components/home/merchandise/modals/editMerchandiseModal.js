import React, { useState, useEffect } from "react";
import "./editMerchandiseModal.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = "https://bleu-stockservices.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

function EditMerchandiseModal({ merchandise, onClose, onUpdate }) {
    const [MerchandiseName, setMerchandiseName] = useState("");
    const [Quantity, setQuantity] = useState("");
    const [DateAdded, setDateAdded] = useState("");
    const [Price, setPrice] = useState("");
    const [ImageFile, setImageFile] = useState(null);   
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({
        MerchandiseName: "",
        Quantity: "",
        DateAdded: "",
        Price: "",
        imageFile: ""
    });

    useEffect(() => {
        if (merchandise) {
            setMerchandiseName(merchandise.MerchandiseName || "");
            setQuantity(merchandise.MerchandiseQuantity || "");
            setDateAdded(merchandise.MerchandiseDateAdded || "");   
            setPrice(merchandise.MerchandisePrice || "");
        }
    }, [merchandise]);

    const validate = () => {
        const newErrors = {};
        if (!MerchandiseName) newErrors.MerchandiseName = "This field is required";
        if (!Quantity) newErrors.Quantity = "This field is required";
        if (!DateAdded) newErrors.DateAdded = "This field is required";
        if (!Price && Price !== 0) newErrors.Price = "This field is required";
        if (!merchandise.MerchandiseImage && !ImageFile) newErrors.imageFile = "Image is required";
        return newErrors;
    };

    const handleSubmit = async (e) => {
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
            formData.append("MerchandiseName", MerchandiseName);
            formData.append("MerchandiseQuantity", parseFloat(Quantity));
            formData.append("MerchandiseDateAdded", DateAdded);
            formData.append("MerchandisePrice", parseFloat(Price));
            if (ImageFile) formData.append("MerchandiseImageFile", ImageFile);

            setIsLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/merchandise/${merchandise.MerchandiseID}`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
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
        }
    };

    return (
        <div className="editMerchandise-modal-overlay">
            <div className="editMerchandise-modal">
                <h2>Edit Item</h2>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <label>
                        Item Name: <span className="editMerchandise-required-asterisk">*</span>
                        <input
                            type="text"
                            name="name"
                            value={MerchandiseName}
                            onChange={(e) => setMerchandiseName(e.target.value)}
                            className={errors.MerchandiseName ? "editItem-error" : ""}
                            required
                        />
                        {errors.MerchandiseName && <p className="editItem-error">{errors.MerchandiseName}</p>}
                    </label>

                    <label>
                        Quantity: <span className="editMerchandise-required-asterisk">*</span>
                        <input
                            type="number"
                            name="quantity"
                            value={Quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className={errors.Quantity ? "editItem-error" : ""}
                            required
                        />
                        {errors.Quantity && <p className="editItem-error">{errors.Quantity}</p>}
                    </label>

                    <label>
                        Batch Date: <span className="editMerchandise-required-asterisk">*</span>
                        <input
                            type="date"
                            name="dateAdded"
                            value={DateAdded}
                            onChange={(e) => setDateAdded(e.target.value)}
                            className={errors.DateAdded ? "editItem-error" : ""}
                            required
                        />
                        {errors.DateAdded && <p className="editItem-error">{errors.DateAdded}</p>}
                    </label>

                    <label>
                        Price: <span className="editMerchandise-required-asterisk">*</span>
                        <input
                            type="number"
                            name="price"
                            value={Price}
                            onChange={(e) => setPrice(e.target.value)}
                            step="0.01"
                            min="0"
                            className={errors.Price ? "editItem-error" : ""}
                            required
                        />
                        {errors.Price && <p className="editItem-error">{errors.Price}</p>}
                    </label>

                    <label>
                        Update Image: { !merchandise.MerchandiseImage && <span className="editMerchandise-required-asterisk">*</span> }
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            onFocus={() => setErrors(prev => ({ ...prev, imageFile: "" }))}
                        />
                        {errors.imageFile && <p className="editItem-error">{errors.imageFile}</p>}
                    </label>

                    <div className="editMerchandise-modal-buttons">
                        <button type="submit" className="editMerchandise-save-button" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="editMerchandise-cancel-button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditMerchandiseModal;