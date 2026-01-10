import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./productTypeAuditLogs.css"; 
import Sidebar from "../../sidebar";
import DataTable from "react-data-table-component";
import ViewProductTypeLogModal from './Modals/viewProductTypeLogModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loadingAnimation from "../../../assets/animation/loading.webm"; 

const API_BASE_URL = "http://127.0.0.1:8006";
const getAuthToken = () => localStorage.getItem("authToken");

function ProductTypeAuditLogs() { 
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
            const response = await fetch(`${API_BASE_URL}/blockchain/producttype`, {
                headers: { Authorization: `Bearer ${token}`},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch product type logs.");
            }

            const data = await response.json();
            setLogs(data); 
        } catch (error) {
            console.error("Error fetching product type logs:", error);
            toast.error("Failed to load product type logs.");
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // filtering and sorting data
    const filteredSortedLogs = logs
        .filter((item) => {
            const matchesSearch = item.productTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.user_id && item.user_id.toString().includes(searchQuery));
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
        { name: "USER", selector: (row) => row.user_id || "N/A", width: "15%", center: true },
        { name: "ACTION", selector: (row) => row.action, width: "18%", center: true,
            cell: (row) => {
                let className = "";
                if (row.action === "CREATE") className = "prodtype-action-create";
                else if (row.action === "UPDATE") className = "prodtype-action-update";
                else if (row.action === "DELETE") className = "prodtype-action-delete";
                else className = "";

                return <span className={className}>{row.action}</span>;
            }
        },
        { name: "PRODUCT TYPE NAME", selector: (row) => row.productTypeName, width: "28%", center: true },
        { name: "SIZE REQUIRED", selector: (row) => row.SizeRequired, width: "23%", center: true,
            cell: (row) => <span>{row.SizeRequired === 1 ? "Yes" : "No"}</span>
        },
    ];

    return (
        <div className="prodtype-audit-logs">
            <Sidebar />
            <div className="prodtype-roles">

                <Header pageTitle="Product Type Audit Logs" />

                <div className="prodtype-audit-header">
                    <div className="prodtype-audit-bottom-row">
                        <input
                            type="text"
                            className="prodtype-audit-search-box"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="filter-prodtype-audit-container">
                            <label htmlFor="filter-prodtype-audit">Filter by Action: </label>
                            <select
                                id="filter-prodtype-audit"
                                className="filter-prodtype-audit-select"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                            </select>
                        </div>

                        <div className="prodtype-date-filter-container">
                            <label htmlFor="prodtype-date-from">From:</label>
                            <input
                                type="date"
                                id="prodtype-date-from"
                                className="prodtype-date-filter-input"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        <div className="prodtype-date-filter-container">
                            <label htmlFor="prodtype-date-to">To:</label>
                            <input
                                type="date"
                                id="prodtype-date-to"
                                className="prodtype-date-filter-input"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="prodtype-audit-content">
                    {loading ? (
                        <div className="prodtype-loading-container">
                            <video
                                src={loadingAnimation}
                                autoPlay
                                loop
                                muted
                                className="prodtype-loading-animation"
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
                                        textTransform: "UPPERCASE",
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
                <ViewProductTypeLogModal
                    log={selectedLog}
                    onClose={() => setShowViewLogModal(false)}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default ProductTypeAuditLogs;