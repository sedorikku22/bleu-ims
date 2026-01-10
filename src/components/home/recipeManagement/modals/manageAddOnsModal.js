import React, { useState, useEffect } from 'react';
import './manageAddOnsModal.css';
import { toast } from 'react-toastify';
import DataTable from "react-data-table-component";
import { FaEdit, FaArchive } from "react-icons/fa";
import { confirmAlert } from 'react-confirm-alert';
import AddOnsModal from './addOnsModal'; 
import EditAddOnModal from './editAddOnModal'; 

const API_BASE_URL = "https://ims-recipeservices.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

const ManageAddOnsModal = ({ onClose }) => {
    const [addOns, setAddOns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddOnsModal, setShowAddOnsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAddOn, setSelectedAddOn] = useState(null);

    useEffect(() => {
        fetchAddOns();
    }, []);

    const fetchAddOns = async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/Add%20ons/is_addons/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch add-ons.');
            }

            const data = await response.json();
            setAddOns(data);
            setError('');
        } catch (err) {
            setError('Could not load add-ons. Please try again later.');
            toast.error(err.message);
            console.error('Error fetching add-ons:', err);
        } finally {
            setIsLoading(false);
        }
    };

  
    const handleDelete = (addOnId, addOnName) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: `Are you sure you want to delete "${addOnName}"?`,
            parentElement: document.querySelector('.modal-content'),
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        const token = getAuthToken();
                        if (!token) {
                            toast.error("Authentication token not found.");
                            return;
                        }

                        try {
                            const response = await fetch(`${API_BASE_URL}/Add%20ons/is_addons/${addOnId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || 'Failed to delete add-on.');
                            }

                            toast.success(`Add-on "${addOnName}" deleted successfully!`);
                            fetchAddOns(); 
                        } catch (err) {
                            toast.error(err.message);
                            console.error('Error deleting add-on:', err);
                        }
                    }
                },
                {
                    label: 'No',
                    onClick: () => {}
                }
            ]
        });
    };

    const handleEdit = (addOn) => {
        setSelectedAddOn(addOn);
        setShowEditModal(true);
    };

    const handleAddOnAdded = (newAddOn) => {
        fetchAddOns(); 
        setShowAddOnsModal(false);
    };


    const handleAddOnUpdated = (updatedAddOn) => {
        fetchAddOns(); 
        setShowEditModal(false);
        setSelectedAddOn(null);
    };

    const handleClose = () => {
        if (!showAddOnsModal && !showEditModal) {
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !showAddOnsModal && !showEditModal) {
            onClose();
        }
    };

    const columns = [
        { 
            name: "NAME", 
            selector: (row) => row.AddOnName, 
            width: "26%", 
            sortable: true 
        },
        { 
            name: "INGREDIENT", 
            selector: (row) => row.IngredientName, 
            width: "26%", 
            sortable: true 
        },
        { 
            name: "PRICE", 
            selector: (row) => `₱${row.Price.toFixed(2)}`, 
            width: "18%", 
            sortable: true 
        },
        { 
            name: "AMOUNT", 
            selector: (row) => `${row.Amount} ${row.Measurement}`, 
            width: "20%", 
            sortable: true 
        },
        {
            name: "ACTIONS",
            cell: (row) => (
                <div className="manageAddOn-action-buttons">
                    <div className="manageAddOn-tooltip-container">
                        <button 
                            className="manageAddOn-action-button edit" 
                            onClick={() => handleEdit(row)}
                        >
                            <FaEdit />
                        </button>
                        <span className="manageAddOn-tooltip-text">Edit</span>
                    </div>
                    <div className="manageAddOn-tooltip-container">
                        <button 
                            className="manageAddOn-action-button delete" 
                            onClick={() => handleDelete(row.AddOnID, row.AddOnName)}
                        >
                            <FaArchive />
                        </button>
                        <span className="manageAddOn-tooltip-text">Delete</span>
                    </div>
                </div>
            ),
            width: "10%",
            center: true,
            ignoreRowClick: true,
        },
    ];

    return (
        <>
            <div className="manageAddOn-modal-overlay" onClick={handleBackdropClick}>
                <div className="manageAddOn-modal-content">
                    <div className="manageAddOn-modal-header">
                        <h2>Manage Add-Ons</h2>
                        <div className="button-container-right">
                            <button 
                                onClick={() => setShowAddOnsModal(true)}
                                className="manageAddOn-add-Product-Type"
                            >
                                Add Add-On
                            </button>
                        </div>
                    </div>

                    <div className="manageAddOn-modal-body">
                        {isLoading ? (
                            <div className="loading-message">Loading add-ons...</div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={addOns}
                                pagination
                                paginationPerPage={10}
                                paginationRowsPerPageOptions={[10, 20, 30, 50]}
                                customStyles={{
                                    headCells: {
                                        style: {
                                            backgroundColor: "#4B929D",
                                            color: "#fff",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            padding: "12px 8px",
                                            textTransform: "uppercase",
                                            textAlign: "center",
                                            letterSpacing: "1px",
                                            whiteSpace: "nowrap",
                                        },
                                    },
                                    rows: {
                                        style: {
                                            minHeight: "55px",
                                        },
                                    },
                                    cells: {
                                        style: {
                                            padding: "8px",
                                            fontSize: "14px",
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>

                    <button
                        onClick={handleClose}
                        className="manageAddOn-close-button"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Add-On Creation Modal */}
            {showAddOnsModal && (
                <AddOnsModal
                    onClose={() => setShowAddOnsModal(false)}
                    onAddOnAdded={handleAddOnAdded}
                />
            )}

            {/* Edit Add-On Modal */}
            {showEditModal && selectedAddOn && (
                <EditAddOnModal
                    addOn={selectedAddOn}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAddOn(null);
                    }}
                    onAddOnUpdated={handleAddOnUpdated}
                />
            )}
        </>
    );
};

export default ManageAddOnsModal;