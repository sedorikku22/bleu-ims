import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./restockAuditLogs.css";
import Sidebar from "../../sidebar";
import DataTable from "react-data-table-component";
import ViewRestockLogModal from './Modals/viewRestockLogModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loadingAnimation from "../../../assets/animation/loading.webm";

const API_BASE_URL = "http://127.0.0.1:8006";
const getAuthToken = () => localStorage.getItem("authToken");

function RestockAuditLogs() {
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
            const response = await fetch(`${API_BASE_URL}/blockchain/restock`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch restock logs.");
            }

            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error("Error fetching restock logs:", error);
            toast.error("Failed to load restock audit logs.");
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // filter and sort logs
    const filteredSortedLogs = logs
        .filter((item) => {
            const matchesSearch = (item.ItemType && item.ItemType.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.LoggedBy && item.LoggedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
        { name: "USER", selector: (row) => row.user_id || "N/A", width: "10%", center: true },
        {
            name: "ACTION", selector: (row) => row.action, width: "12%", center: true,
            cell: (row) => {
                let className = "restock-action-other";
                if (row.action === "RESTOCK") className = "restock-action-restock";
                return <span className={className}>{row.action}</span>;
            }
        },
        { name: "ITEM TYPE", selector: (row) => row.ItemType, width: "15%", center: true },
        {
            name: "QUANTITY", selector: (row) => row.Quantity, width: "10%", center: true,
            cell: (row) => <span>{row.Quantity !== null ? parseFloat(row.Quantity).toFixed(2) : 'N/A'}</span>
        },
        { name: "UNIT", selector: (row) => row.Unit || "N/A", width: "8%", center: true },
        { name: "RESTOCK DATE", selector: (row) => row.RestockDate || "N/A", width: "15%", center: true },
        { name: "LOGGED BY", selector: (row) => row.LoggedBy || "N/A", width: "18%", center: true },
    ];

    return (
        <div className="restock-audit-logs">
            <Sidebar />
            <div className="restock-roles">

                <Header pageTitle="Restock Audit Logs" />

                <div className="restock-audit-header">
                    <div className="restock-audit-bottom-row">
                        <input
                            type="text"
                            className="restock-audit-search-box"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="restock-filter-audit-container">
                            <label htmlFor="restock-filter-audit">Filter by Action: </label>
                            <select
                                id="restock-filter-audit"
                                className="restock-filter-audit-select"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="RESTOCK">Restock</option>
                            </select>
                        </div>

                        <div className="restock-date-filter-container">
                            <label htmlFor="restock-date-from">From:</label>
                            <input
                                type="date"
                                id="restock-date-from"
                                className="restock-date-filter-input"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        <div className="restock-date-filter-container">
                            <label htmlFor="restock-date-to">To:</label>
                            <input
                                type="date"
                                id="restock-date-to"
                                className="restock-date-filter-input"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="restock-audit-content">
                    {loading ? (
                        <div className="restock-loading-container">
                            <video
                                src={loadingAnimation}
                                autoPlay
                                loop
                                muted
                                className="restock-loading-animation"
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
                <ViewRestockLogModal
                    log={selectedLog}
                    onClose={() => setShowViewLogModal(false)}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default RestockAuditLogs;