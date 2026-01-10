import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./recipeAuditLogs.css";
import Sidebar from "../../sidebar";
import DataTable from "react-data-table-component";
import ViewRecipeLogModal from './Modals/viewRecipeLogModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loadingAnimation from "../../../assets/animation/loading.webm";

const API_BASE_URL = "https://ims-blockchain.onrender.com"; 
const getAuthToken = () => localStorage.getItem("authToken");

function RecipeAuditLogs() {
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

    // auth check
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

    // fetch logs
    const fetchLogs = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/blockchain/recipe`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch recipe logs.");
            }

            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error("Error fetching recipe logs:", error);
            toast.error("Failed to load recipe logs.");
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // filter and sort logs
    const filteredSortedLogs = logs
        .filter((item) => {
            const matchesSearch = item.RecipeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.Category.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        {
            name: "ACTION", selector: (row) => row.action, width: "15%", center: true,
            cell: (row) => {
                let className = "";
                if (row.action === "CREATE") className = "action-create";
                else if (row.action === "UPDATE") className = "action-update";
                else if (row.action === "DELETE") className = "action-delete";
                else className = "";

                return <span className={className}>{row.action}</span>;
            }
        },
        { name: "RECIPE NAME", selector: (row) => row.RecipeName, width: "25%", center: true },
        { name: "CATEGORY", selector: (row) => row.Category, width: "30%", center: true },
    ];

    return (
        <div className="recipe-audit-logs">
            <Sidebar />
            <div className="roles">

                <Header pageTitle="Recipe Audit Logs" />

                <div className="recipe-audit-header">
                    <div className="recipe-audit-bottom-row">
                        <input
                            type="text"
                            className="recipe-audit-search-box"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="filter-recipe-audit-container">
                            <label htmlFor="filter-recipe-audit">Filter by Action: </label>
                            <select
                                id="filter-recipe-audit"
                                className="filter-recipe-audit-select"
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
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="recipe-audit-content">
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
                            paginationRowsPerPageOptions={[9, 10, 15, 20]}
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
                <ViewRecipeLogModal
                    log={selectedLog}
                    onClose={() => setShowViewLogModal(false)}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default RecipeAuditLogs;