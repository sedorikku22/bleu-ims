import React, { useState , useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./supplies.css";
import Sidebar from "../../sidebar";
import { FaSync, FaEye, FaEdit, FaArchive, FaFilter } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddSupplyModal from './modals/addSupplyModal';
import EditSupplyModal from "./modals/editSupplyModal";
import ViewSupplyModal from "./modals/viewSupplyModal";
import AddSuppliesLogsModal from '../systemLogs/restockLogs/suppliesLogs/modals/addSuppliesLogsModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; 
import "../../reactConfirmAlert.css";
import loadingAnimation from "../../../assets/animation/loading.webm"; 

const API_BASE_URL = "https://bleu-stockservices.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

function Supplies() {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [supplies, setSupplies] = useState([]);
    const navigate = useNavigate();
    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });

    const [sortOption, setSortOption] = useState("nameAsc");
    const [loading, setLoading] = useState(true);
    const [showAddSupplyModal, setShowAddSupplyModal] = useState(false);
    const [showEditSupplyModal, setShowEditSupplyModal] = useState(false);
    const [selectedSupply, setSelectedSupply] = useState(null);
    const [currentSupply, setCurrentSupply] = useState(null);
    const [showViewSupplyModal, setShowViewSupplyModal] = useState(false);
    const [showAddSuppliesLogsModal, setShowAddSuppliesLogsModal] = useState(false);

    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
    });

    // filtering and sorting
    const filteredSupplies = supplies
    .filter((item) => {
        const normalizedSearch = searchQuery.toLowerCase().trim(); // Normalize and trim search query
        const normalizedSupplyName = item.MaterialName.toLowerCase().trim(); // Normalize and trim supply name
        const matchesSearch = normalizedSupplyName.includes(normalizedSearch);

        // status filtering
        let matchesStatus = true;
        if (statusFilter !== 'All') {
            matchesStatus = item.Status === statusFilter;
        }

        // date range filtering
        let matchesDateRange = true;
        if (dateFrom || dateTo) {
            const supplyDate = new Date(item.DateAdded);
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                matchesDateRange = matchesDateRange && supplyDate >= fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                matchesDateRange = matchesDateRange && supplyDate <= toDate;
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

        // others sort by newest first
        const dateA = new Date(a.DateAdded);
        const dateB = new Date(b.DateAdded);
        return dateB - dateA; // newest date at the top for all statuses
    });

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

    const handleAddSupplySubmit = () => {
        setShowAddSuppliesLogsModal(false);
        fetchSupplies();
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
    const fetchSupplies = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/materials/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
               throw new Error(`Failed to fetch supplies: ${response.status} ${errorData}`);
            }

            const data = await response.json();
            setSupplies(data);
        } catch (error) {
            console.error("Error fetching supplies:", error);
            handleLogout();
        }
        setLoading(false);
    }, [handleLogout]);
    
    useEffect(() => {
            fetchSupplies();
        }, []);

    const handleView = (supply) => {
        setSelectedSupply(supply);
        setShowViewSupplyModal(true);
    };

    const handleEdit = (supply) => {
        setSelectedSupply(supply);
        setShowEditSupplyModal(true);
    };

    const handleDelete = async (suppliesIdToDelete) => {
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
                            const response = await fetch(`${API_BASE_URL}/materials/${suppliesIdToDelete}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || "Failed to delete item.");
                            }

                            toast.success("Item deleted successfully!");

                            fetchSupplies(); // refresh list after deletion
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
        { name: "NO.", selector: (row, index) => index + 1, width: "10%" },
        { name: "ITEM NAME", selector: (row) => row.MaterialName, width: "18%" },
        { 
            name: "QUANTITY", 
            selector: (row) => `${row.MaterialQuantity} ${row.MaterialMeasurement ? row.MaterialMeasurement : ""}`, 
            width: "18%", 
            center: true,
            cell: (row) => (
                <span>{`${row.MaterialQuantity} ${row.MaterialMeasurement ? row.MaterialMeasurement : ""}`}</span>
            )
        },
        { name: "BATCH DATE", selector: (row) => row.DateAdded, width: "18%", center: true },
        { 
            name: "STATUS", 
            selector: (row) => row.Status, 
            width: "18%", 
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
                        <button className="action-button restock" onClick={() => { setCurrentSupply(row); setShowAddSuppliesLogsModal(true); }}><FaSync /></button>
                        <span className="tooltip-text">Restock</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button edit" onClick={() => handleEdit(row)}><FaEdit /></button>
                        <span className="tooltip-text">Edit</span>
                    </div>
                    <div className="tooltip-container">
                        <button className="action-button delete" onClick={() => handleDelete(row.MaterialID)}><FaArchive /></button>
                        <span className="tooltip-text">Delete</span>
                    </div>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            width: "18%",
            center: true
        },
    ];

    return (
        <div className="supplies">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Supplies & Materials" />

                <div className="supply-header">
                    <div className="supply-bottom-row">
                        <input
                            type="text"
                            className="supply-search-box"
                            placeholder="Search supplies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.trimStart())}
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
                                min={dateFrom}
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
                                    </div>
                                )}
                            </div>
                            <button className="add-supply-button"
                                onClick={() => setShowAddSupplyModal(true)}
                            >
                            + Create Item
                            </button>
                        </div>
                    </div>
                </div>

                <div className="supply-content">
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
                            data={filteredSupplies}
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

            {showViewSupplyModal && selectedSupply && (
                <ViewSupplyModal
                    supply={selectedSupply}
                    onClose={() => setShowViewSupplyModal(false)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {showAddSupplyModal && (
                <AddSupplyModal 
                    onClose={() => setShowAddSupplyModal(false)} 
                    onSubmit={(newSupply) => {
                        setShowAddSupplyModal(false);
                        fetchSupplies();
                    }}
                />
            )}

            {showEditSupplyModal && selectedSupply && (
                <EditSupplyModal
                    supply={selectedSupply}
                    onClose={() => setShowEditSupplyModal(false)}
                    onUpdate={() => {
                        setSelectedSupply(null);
                        fetchSupplies();
                    }}
                />
            )}

            {showAddSuppliesLogsModal && (
                <AddSuppliesLogsModal
                    onClose={() => setShowAddSuppliesLogsModal(false)}
                    onSubmit={handleAddSupplySubmit}
                    currentSupply={currentSupply}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default Supplies;