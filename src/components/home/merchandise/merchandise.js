import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./merchandise.css"; 
import Sidebar from "../../sidebar";
import { FaSync, FaEye, FaEdit, FaArchive, FaFilter } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddMerchandiseModal from './modals/addMerchandiseModal';
import EditMerchandiseModal from "./modals/editMerchandiseModal";
import ViewMerchandiseModal from "./modals/viewMerchandiseModal";
import AddMerchandiseLogsModal from '../systemLogs/restockLogs/merchandiseLogs/modals/addMerchandiseLogsModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; 
import "../../reactConfirmAlert.css";
import loadingAnimation from "../../../assets/animation/loading.webm"; 

const API_BASE_URL = "https://bleu-stockservices.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

function Merchandise() { 
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [merchandise, setMerchandise] = useState([]);
    const navigate = useNavigate();
    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });

    const [sortOrder, setSortOrder] = useState("nameAsc");
    const [loading, setLoading] = useState(true);
    const [showAddMerchandiseModal, setShowAddMerchandiseModal] = useState(false);
    const [showEditMerchandiseModal, setShowEditMerchandiseModal] = useState(false);
    const [selectedMerchandise, setSelectedMerchandise] = useState(null);
    const [currentMerchandise, setCurrentMerchandise] = useState(null);
    const [showViewMerchandiseModal, setShowViewMerchandiseModal] = useState(false);
    const [showAddMerchandiseLogsModal, setShowAddMerchandiseLogsModal] = useState(false);

    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
    });

    // filtering and sorting data
    const filteredSortedMerchandise = merchandise
    .filter((item) => {
        const matchesSearch = item.MerchandiseName.toLowerCase().includes(searchQuery.toLowerCase());

        // status filtering
        let matchesStatus = true;
        if (statusFilter !== 'All') {
            matchesStatus = item.Status === statusFilter;
        }

        // date range filtering
        let matchesDateRange = true;
        if (dateFrom || dateTo) {
            const merchandiseDate = new Date(item.MerchandiseDateAdded);
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                matchesDateRange = matchesDateRange && merchandiseDate >= fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                matchesDateRange = matchesDateRange && merchandiseDate <= toDate;
            }
        }

        return matchesSearch && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => {
        // prioritize low stock items
        const isLowA = a.Status === "Low Stock";
        const isLowB = b.Status === "Low Stock";
        if (isLowA && !isLowB) return -1;
        if (!isLowA && isLowB) return 1;

        // others, sort by newest first
        const dateA = new Date(a.MerchandiseDateAdded);
        const dateB = new Date(b.MerchandiseDateAdded);
        return dateB - dateA; // newest date at top for all statuses
    });

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

    const handleAddMerchandiseSubmit = () => {
        setShowAddMerchandiseLogsModal(false);
        fetchMerchandise();
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
    const fetchMerchandise = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/merchandise/`, {
                headers: { Authorization: `Bearer ${token}`},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch merchandise.");
            }

            const data = await response.json();
            setMerchandise(data); 
        } catch (error) {
            console.error("Error fetching merchandise:", error);
            handleLogout();
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchMerchandise();
    }, [fetchMerchandise]);

    const handleView = (merchandise) => {
        setSelectedMerchandise(merchandise);
        setShowViewMerchandiseModal(true);
    };

    const handleEdit = (merchandise) => {
        setSelectedMerchandise(merchandise);
        setShowEditMerchandiseModal(true);
    };

    const handleDelete = async (merchIdToDelete) => {
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
                            const response = await fetch(`${API_BASE_URL}/merchandise/${merchIdToDelete}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || "Failed to delete item.");
                            }

                            toast.success("Item deleted successfully.");
                            fetchMerchandise(); // refresh list after deletion
                        } catch (error) {
                            console.error("Error deleting item:", error);
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
        { name: "NO.", selector: (row, index) => index + 1, width: "8%" },
        { 
            name: "IMAGE", 
            selector: (row) => row.MerchandiseImage, 
            width: "11%",
            cell: (row) => (
                <img
                    src={row.MerchandiseImage}
                    alt={row.MerchandiseName}
                    className="merch-image"
                    style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "10px" }}
                />
            ),
            center: true
        },
        { name: "ITEM NAME", selector: (row) => row.MerchandiseName, width: "18%" },
        { name: "QUANTITY", selector: (row) => row.MerchandiseQuantity, width: "9%", center: true },
        { name: "PRICE", selector: (row) => row.MerchandisePrice, width: "10%", center: true,
            cell: (row) => <span>₱{parseFloat(row.MerchandisePrice).toFixed(2)}</span>
        },
        { name: "DATE ADDED", selector: (row) => row.MerchandiseDateAdded, width: "16%", center: true },
        { 
            name: "STATUS", 
            selector: (row) => row.Status, 
            width: "11%", 
            center: true,
            cell: (row) => {
                let className = "";
                if (row.Status === "Available") className = "status-available";
                else if (row.Status === "Low Stock") className = "status-low-stock";
                else if (row.Status === "Not Available") className = "status-not-available";
                else className = ""; // fallback style if needed

                return <span className={className}>{row.Status}</span>;
            }
        },
        {
            name: "ACTIONS",
            cell: (row) => (
                <div className="action-buttons">
                    <div className="tooltip-container">
                        <button className="action-button restock" onClick={() => { setCurrentMerchandise(row); setShowAddMerchandiseLogsModal(true); }}><FaSync /></button>
                        <span className="tooltip-text">Restock</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                        <span className="tooltip-text">Edit</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button delete" onClick={() => handleDelete(row.MerchandiseID)}><FaArchive /></button>
                        <span className="tooltip-text">Delete</span>
                    </div>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            width: "17%",
            center: true
        },
    ];

    return (
        <div className="merchandise">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Merchandise" />

                <div className="merch-header">
                    <div className="merch-bottom-row">
                        <input
                            type="text"
                            className="merch-search-box"
                            placeholder="Search merchandise..."
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
                                <button className="filter-button" onClick={toggleDropdown}>
                                    <FaFilter /> {statusFilter}
                                </button>
                                {isDropdownOpen && (
                                    <div className="filter-dropdown-menu">
                                        <button onClick={() => { setStatusFilter('All'); setDropdownOpen(false); }}>All</button>
                                        <button onClick={() => { setStatusFilter('Available'); setDropdownOpen(false); }}>Available</button>
                                        <button onClick={() => { setStatusFilter('Low Stock'); setDropdownOpen(false); }}>Low Stock</button>
                                        <button onClick={() => { setStatusFilter('Not Available'); setDropdownOpen(false); }}>Not Available</button>
                                    </div>
                                )}
                            </div>
                            <button className="add-merch-button"
                                onClick={() => setShowAddMerchandiseModal(true)}
                            >
                            + Create Item
                            </button>
                        </div>
                    </div>
                </div>

                <div className="merch-content">
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
                            data={filteredSortedMerchandise}
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
                                        textAlign: "center",
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

            {showViewMerchandiseModal && selectedMerchandise && (
                <ViewMerchandiseModal
                    merchandise={selectedMerchandise}
                    onClose={() => setShowViewMerchandiseModal(false)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showAddMerchandiseModal && (
                <AddMerchandiseModal 
                    onClose={() => setShowAddMerchandiseModal(false)} 
                    onSubmit={(newMerchandise) => {
                        setShowAddMerchandiseModal(false);
                        fetchMerchandise();
                    }}
                />
            )}

            {showEditMerchandiseModal && selectedMerchandise && (
                <EditMerchandiseModal
                    merchandise={selectedMerchandise}
                    onClose={() => setShowEditMerchandiseModal(false)}
                    onUpdate={() => {
                        setSelectedMerchandise(null);
                        fetchMerchandise();
                    }}
                />
            )}

            {showAddMerchandiseLogsModal && (
                <AddMerchandiseLogsModal
                    onClose={() => setShowAddMerchandiseLogsModal(false)}
                    onSubmit={handleAddMerchandiseSubmit}
                    currentMerchandise={currentMerchandise}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default Merchandise;