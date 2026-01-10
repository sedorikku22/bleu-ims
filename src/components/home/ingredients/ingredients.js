import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./ingredients.css";
import Sidebar from "../../sidebar";
import { FaSync, FaEye, FaEdit, FaArchive, FaFilter } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddIngredientModal from './modals/addIngredientModal';
import EditIngredientModal from './modals/editIngredientModal';
import ViewIngredientModal from './modals/viewIngredientModal';
import AddIngredientLogsModal from '../systemLogs/restockLogs/ingredientsLogs/modals/addIngredientLogsModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; 
import "../../reactConfirmAlert.css";
import loadingAnimation from "../../../assets/animation/loading.webm"; 

const API_BASE_URL = "http://127.0.0.1:8002";
const getAuthToken = () => localStorage.getItem("authToken");

function Ingredients() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [ingredients, setIngredients] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [currentIngredient, setCurrentIngredient] = useState(null);
    const [showViewIngredientModal, setShowViewIngredientModal] = useState(false);
    const [showAddIngredientLogsModal, setShowAddIngredientLogsModal] = useState(false);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });

    // filtering and sorting data
    const filteredIngredients = ingredients
    .filter(ingredient => {
        const matchesSearch = ingredient.IngredientName.toLowerCase().includes(searchQuery.toLowerCase());

        // status filtering
        let matchesStatus = true;
        if (statusFilter !== 'All') {
            matchesStatus = ingredient.Status === statusFilter;
        }

        // date range filtering
        let matchesDateRange = true;
        if (dateFrom || dateTo) {
            const ingredientDate = new Date(ingredient.BestBeforeDate);
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                matchesDateRange = matchesDateRange && ingredientDate >= fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                matchesDateRange = matchesDateRange && ingredientDate <= toDate;
            }
        }

        return matchesSearch && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => {
        const statusRank = (s) => {
            if (!s) return 1;
            const normalized = s.trim().toLowerCase();
            if (normalized === 'low stock' || normalized === 'not available') return 0;
            if (normalized === 'available') return 1;
            if (normalized === 'expired') return 2;
            return 1;
        };
        const rankA = statusRank(a.Status);
        const rankB = statusRank(b.Status);
        if (rankA !== rankB) {
            return rankA - rankB;
        }
        if (rankA === 0 || rankA === 1) {
            const dateA = a.BestBeforeDate ? new Date(a.BestBeforeDate) : new Date(0);
            const dateB = b.BestBeforeDate ? new Date(b.BestBeforeDate) : new Date(0);
            return dateB - dateA;
        }

        if (rankA === 2) {
            const expA = a.ExpirationDate ? new Date(a.ExpirationDate) : new Date(0);
            const expB = b.ExpirationDate ? new Date(b.ExpirationDate) : new Date(0);
            const diff = expB - expA;
            if (diff !== 0) return diff;
            const bbA = a.BestBeforeDate ? new Date(a.BestBeforeDate) : new Date(0);
            const bbB = b.BestBeforeDate ? new Date(b.BestBeforeDate) : new Date(0);
            return bbB - bbA;
        }
        return 0;
    });

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

    const handleAddIngredientSubmit = () => {
        setShowAddIngredientLogsModal(false);
        fetchIngredients();
    };

    // authentication and authorization
    useEffect(() => {
        const token = getAuthToken();
        const storedUsername = localStorage.getItem("username");

        if (token && storedUsername) {
            try {
                const decodedToken = jwtDecode(token);
                setLoggedInUserDisplay({
                    name: storedUsername,
                    role: decodedToken.role || "User"
                });
            } catch (error) {
                console.error("Error decoding token:", error);
                handleLogout();
            }
        } else {
            console.log("No session found. Redirecting to login.");
            navigate('/');
        }
    }, [navigate, handleLogout]);

    // data fetching
    const fetchIngredients = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ingredients/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch ingredients: ${response.status} ${errorData}`);
            }

            const data = await response.json();
            setIngredients(data); 
        } catch (error) {
            console.error("Error fetching ingredients:", error);
            toast.error(`Session expired or unauthorized: ${error.message}. Please login again.`);
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    const handleView = (ingredient) => {
        setCurrentIngredient(ingredient);
        setShowViewIngredientModal(true);
    };

    const handleEdit = (ingredient) => {
        setCurrentIngredient(ingredient);
        setShowEditIngredientModal(true);
    };

    const handleDelete = async (ingredientIdToDelete) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this item?',
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
                            const response = await fetch(`${API_BASE_URL}/ingredients/${ingredientIdToDelete}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.text();
                                throw new Error(errorData.detail || "Failed to delete item.");
                            }
                            
                            toast.success("Item deleted successfully.");
                            
                            // refetch data to ensure consistency
                            fetchIngredients();
                        } catch (error) {
                            console.error("Error deleting ingredient:", error);
                            toast.error("An error occurred while deleting the item.");
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

    const columns = [
        { name: "NO.", selector: (row, index) => index + 1, width: "10%" },
        { name: "ITEM NAME", selector: (row) => row.IngredientName, width: "20%" },
        {
            name: "AMOUNT", 
            selector: (row) => `${row.Amount} ${row.Measurement ? row.Measurement : ""}`, 
            width: "10%", 
            center: true,
            cell: (row) => (
                <span>{`${row.Amount} ${row.Measurement ? row.Measurement : ""}`}</span>
            )
        },
        { name: "BATCH DATE", selector: (row) => row.BestBeforeDate, width: "15%", center: true },
        { name: "EXPIRATION DATE", selector: (row) => row.ExpirationDate, width: "15%", center: true },
        { 
            name: "STATUS", 
            selector: (row) => row.Status, 
            width: "10%", 
            center: true,
            cell: (row) => {
                let className = "";
                if (row.Status === "Available") className = "status-available";
                else if (row.Status === "Low Stock") className = "status-low-stock";
                else if (row.Status === "Not Available") className = "status-not-available";
                else if (row.Status === "Expired") className = "status-expired";
                else className = ""; // fallback style if needed

                return <span className={className}>{row.Status}</span>;
            }
        },
        {
            name: "ACTIONS",
            cell: (row) => (
                <div className="action-buttons">
                    <div className="tooltip-container">
                        <button className="action-button restock" onClick={() => { setSelectedIngredient(row); setShowAddIngredientLogsModal(true); }}><FaSync /></button>
                        <span className="tooltip-text">Restock</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                        <span className="tooltip-text">Edit</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button delete" onClick={() => handleDelete(row.IngredientID)}><FaArchive /></button>
                        <span className="tooltip-text">Delete</span>
                    </div>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            width: "20%",
            center: true,
        },
    ];

    return (
        <div className="ingredients">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Ingredients" />

                <div className="ingredient-header">
                    <div className="ingredient-bottom-row">
                        <input
                            type="text"
                            className="ingredient-search-box"
                            placeholder="Search ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />


                        <div className="date-filter-container">
                            <label htmlFor="date-from">From:</label>
                            <input
                                type="date"
                                id="date-from"
                                className="date-filter-input"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        <div className="date-filter-container">
                            <label htmlFor="date-to">To:</label>
                            <input
                                type="date"
                                id="date-to"
                                className="date-filter-input"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>

                        <div className="filter-and-add-container">
                            <div className="filter-dropdown">
                                <button
                                    className="filter-button"
                                    onClick={() => setDropdownOpen(!isDropdownOpen)}
                                >
                                    <FaFilter /> Filter
                                </button>
                                {isDropdownOpen && (
                                    <div className="filter-dropdown-menu">
                                        <button onClick={() => { setStatusFilter('All'); setDropdownOpen(false); }}>All</button>
                                        <button onClick={() => { setStatusFilter('Available'); setDropdownOpen(false); }}>Available</button>
                                        <button onClick={() => { setStatusFilter('Low Stock'); setDropdownOpen(false); }}>Low Stock</button>
                                        <button onClick={() => { setStatusFilter('Not Available'); setDropdownOpen(false); }}>Not Available</button>
                                        <button onClick={() => { setStatusFilter('Expired'); setDropdownOpen(false); }}>Expired</button>
                                    </div>
                                )}
                            </div>
                            <button
                                className="add-ingredient-button"
                                onClick={() => setShowAddIngredientModal(true)}
                            >
                                + Create Item
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ingredient-content">
                    {loading ? (
                        <div className="loading-container">
                            <video
                                src={loadingAnimation}
                                autoPlay
                                loop
                                muted
                                className="loading-animation"
                            />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredIngredients}
                            striped
                            highlightOnHover
                            responsive
                            pagination
                            paginationPerPage={9}
                            paginationRowsPerPageOptions={[9,10,15,20]}
                            onRowClicked={handleView}
                            customStyles={{
                                headCells: {
                                    style: {
                                        backgroundColor: "#4B929D",
                                        color: "#fff",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        padding: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "1px",
                                    },
                                },
                                rows: {
                                    style: {
                                        minHeight: "55px",
                                        cursor: "pointer",
                                    },
                                },
                            }}
                            noDataComponent={<div>No items found.</div>} 
                        />
                    )}
                </div>
            </div>

            {showViewIngredientModal && currentIngredient && (
                <ViewIngredientModal
                    ingredient={currentIngredient}
                    onClose={() => setShowViewIngredientModal(false)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showAddIngredientModal && (
                <AddIngredientModal 
                    onClose={() => setShowAddIngredientModal(false)} 
                    onSuccess={(newIngredient) => {
                        setShowAddIngredientModal(false);
                        fetchIngredients();
                    }}
                />
            )}

            {showEditIngredientModal && currentIngredient && (
                <EditIngredientModal
                    ingredient={currentIngredient}
                    onClose={() => setShowEditIngredientModal(false)}
                    onUpdate={() => {
                        setCurrentIngredient(null);
                        fetchIngredients();
                    }}
                />
            )}
            <ToastContainer />

            {showAddIngredientLogsModal && (
                <AddIngredientLogsModal
                    onClose={() => setShowAddIngredientLogsModal(false)}
                    onSubmit={handleAddIngredientSubmit}
                    selectedIngredient={selectedIngredient} 
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default Ingredients;