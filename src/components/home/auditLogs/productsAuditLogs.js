import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./productsAuditLogs.css"; 
import './Modals/viewProductLogModal.js';
import Sidebar from "../../sidebar";
import { FaEye } from "react-icons/fa";
import DataTable from "react-data-table-component";
import ViewProductLogModal from './Modals/viewProductLogModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loadingAnimation from "../../../assets/animation/loading.webm"; 

const API_BASE_URL = "https://ims-blockchain.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

function ProductsAuditLogs() { 
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const [filterAction, setFilterAction] = useState("all");
    const [loading, setLoading] = useState(true);
    const [showViewLogModal, setShowViewLogModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/');
    }, [navigate]);

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
    const fetchLogs = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/blockchain/product`, {
                headers: { Authorization: `Bearer ${token}`},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch product logs.");
            }

            const data = await response.json();
            setLogs(data); 
        } catch (error) {
            console.error("Error fetching product logs:", error);
            toast.error("Failed to load product logs.");
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // filtering and sorting data
const filteredSortedLogs = logs
.filter((item) => {
    const normalizedSearch = searchQuery.toLowerCase().trim(); // Normalize and trim search query
    const matchesSearch = item.ProductName.toLowerCase().includes(normalizedSearch) ||
                          item.ProductCategory.toLowerCase().includes(normalizedSearch) ||
                          item.action.toLowerCase().includes(normalizedSearch) ||
                          (item.user_id && item.user_id.toString().includes(normalizedSearch));
    const matchesAction = filterAction === "all" || item.action === filterAction;
   
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
        const logDate = new Date(item.timestamp);
        logDate.setHours(0, 0, 0, 0); 
        
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            matchesDateRange = matchesDateRange && logDate >= fromDate;
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(0, 0, 0, 0);
            matchesDateRange = matchesDateRange && logDate <= toDate;
        }
    }
    
    return matchesSearch && matchesAction && matchesDateRange;
})
.sort((a, b) => {
    // newest first
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA;
});

    const handleView = (log) => {
        setSelectedLog(log);
        setShowViewLogModal(true);
    };

    const columns = [
        { name: "TIMESTAMP",
        selector: (row) => {
            const formattedDate = new Date(row.timestamp).toLocaleString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
            return formattedDate.replace(",", "");
        },
        width: "12%",
        center: false,},
        { name: "USER", selector: (row) => row.user_id || "N/A", width: "14%", center: true },
        { name: "ACTION", selector: (row) => row.action, width: "14%", center: true,
            cell: (row) => {
                let className = "";
                if (row.action === "CREATE") className = "action-create";
                else if (row.action === "UPDATE") className = "action-update";
                else if (row.action === "DELETE") className = "action-delete";
                else className = "";

                return <span className={className}>{row.action}</span>;
            }
        },
        { name: "PRODUCT NAME", selector: (row) => row.ProductName, width: "16%", center: true },
        { name: "CATEGORY", selector: (row) => row.ProductCategory, width: "14%", center: true },
        { name: "PRICE", selector: (row) => row.ProductPrice, width: "14%", center: true,
            cell: (row) => <span>₱{parseFloat(row.ProductPrice).toFixed(2)}</span>
        },
        { name: "STATUS", selector: (row) => row.Status, width: "16%", center: true },
    ];

    return (
        <div className="products-audit-logs">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Products Audit Logs" />

                <div className="prod-audit-header">
                    <div className="prod-audit-bottom-row">
                        <input
                            type="text"
                            className="prod-audit-search-box"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.trimStart())}
                        />
                        <div className="filter-prod-audit-container">
                            <label htmlFor="filter-prod-audit">Filter by Action: </label>
                            <select
                                id="filter-prod-audit"
                                className="filter-prod-audit-select"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                >
                                <option value="all">All</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                            </select>
                        </div>

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
                    </div>
                </div>

                <div className="prod-audit-content">
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
                            data={filteredSortedLogs}
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
                            noDataComponent={<div>No logs found.</div>}
                        />
                    )}
                </div>
            </div>

            {showViewLogModal && selectedLog && (
                <ViewProductLogModal
                    log={selectedLog}
                    onClose={() => setShowViewLogModal(false)}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default ProductsAuditLogs;